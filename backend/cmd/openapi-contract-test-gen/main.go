package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type openAPISpec struct {
	Paths      map[string]pathItem `json:"paths"`
	Components struct {
		Schemas map[string]schema `json:"schemas"`
	} `json:"components"`
}

type pathItem struct {
	Parameters []parameter     `json:"parameters"`
	Get        json.RawMessage `json:"get"`
	Post       json.RawMessage `json:"post"`
	Patch      json.RawMessage `json:"patch"`
	Delete     json.RawMessage `json:"delete"`
	Put        json.RawMessage `json:"put"`
}

type operation struct {
	Parameters  []parameter         `json:"parameters"`
	RequestBody *requestBody        `json:"requestBody"`
	Responses   map[string]response `json:"responses"`
}

type parameter struct {
	In       string  `json:"in"`
	Name     string  `json:"name"`
	Required bool    `json:"required"`
	Schema   *schema `json:"schema"`
}

type requestBody struct {
	Required bool                 `json:"required"`
	Content  map[string]mediaType `json:"content"`
}

type response struct {
	Content map[string]mediaType `json:"content"`
}

type mediaType struct {
	Schema *schema `json:"schema"`
}

type schema struct {
	Ref        string             `json:"$ref"`
	Type       string             `json:"type"`
	Nullable   bool               `json:"nullable"`
	Required   []string           `json:"required"`
	Properties map[string]*schema `json:"properties"`
	Items      *schema            `json:"items"`
	Enum       []string           `json:"enum"`
	Minimum    *float64           `json:"minimum"`
	Maximum    *float64           `json:"maximum"`
}

type target struct {
	name   string
	method string
	path   string
}

type generatedCase struct {
	Name                  string
	Method                string
	Path                  string
	SuccessStatus         int
	SuccessSchema         generatedSchema
	ErrorStatuses         []int
	RequestBodyRequired   bool
	RequestRequiredFields []string
	RequestPropertyTypes  []generatedPropertyType
	QueryParams           []generatedQueryParam
}

type generatedQueryParam struct {
	Name       string
	Type       string
	Required   bool
	EnumValues []string
}

type generatedSchema struct {
	Type       string
	Nullable   bool
	Required   []string
	Properties []generatedProperty
	Items      *generatedSchema
}

type generatedProperty struct {
	Name   string
	Schema generatedSchema
}

type generatedPropertyType struct {
	Name string
	Type string
}

func main() {
	var (
		inFile  = flag.String("in", filepath.Clean("../docs/openapi/openapi.json"), "path to generated OpenAPI JSON")
		outFile = flag.String("out", filepath.Clean("../backend/tests/generated_openapi_mutation_contract_test.go"), "path to generated test file")
	)
	flag.Parse()

	src, err := os.ReadFile(*inFile)
	if err != nil {
		log.Fatalf("read openapi json: %v", err)
	}

	var spec openAPISpec
	if err := json.Unmarshal(src, &spec); err != nil {
		log.Fatalf("parse openapi json: %v", err)
	}

	mutationTargets := []target{
		{name: "create_task", method: "post", path: "/api/tasks"},
		{name: "patch_task_state", method: "patch", path: "/api/tasks/{id}/state"},
		{name: "patch_task_board_column", method: "patch", path: "/api/tasks/{id}/board-column"},
		{name: "create_board", method: "post", path: "/api/boards"},
		{name: "create_column", method: "post", path: "/api/columns"},
	}

	readTargets := []target{
		{name: "list_tasks", method: "get", path: "/api/tasks"},
		{name: "list_projects", method: "get", path: "/api/projects"},
		{name: "list_boards", method: "get", path: "/api/boards"},
		{name: "list_columns", method: "get", path: "/api/columns"},
		{name: "get_board", method: "get", path: "/api/boards/{id}"},
	}

	mutationCases := makeGeneratedCases(spec, mutationTargets)
	readCases := makeGeneratedCases(spec, readTargets)

	out := renderGeneratedTest(mutationCases, readCases)
	if err := os.WriteFile(*outFile, out, 0o644); err != nil {
		log.Fatalf("write generated test: %v", err)
	}
}

func makeGeneratedCases(spec openAPISpec, targets []target) []generatedCase {
	cases := make([]generatedCase, 0, len(targets))
	for _, target := range targets {
		item, ok := spec.Paths[target.path]
		if !ok {
			log.Fatalf("path not found in spec: %s", target.path)
		}

		opRaw := methodOperation(item, target.method)
		if len(opRaw) == 0 {
			log.Fatalf("method %s missing for path %s", strings.ToUpper(target.method), target.path)
		}

		var op operation
		if err := json.Unmarshal(opRaw, &op); err != nil {
			log.Fatalf("parse %s %s operation: %v", strings.ToUpper(target.method), target.path, err)
		}

		mergedParameters := mergeParameters(item.Parameters, op.Parameters)
		queryParams := make([]generatedQueryParam, 0)
		for _, p := range mergedParameters {
			if p.In != "query" {
				continue
			}
			paramType := ""
			enumValues := []string{}
			if p.Schema != nil {
				paramType = p.Schema.Type
				enumValues = append(enumValues, p.Schema.Enum...)
			}
			queryParams = append(queryParams, generatedQueryParam{
				Name:       p.Name,
				Type:       paramType,
				Required:   p.Required,
				EnumValues: enumValues,
			})
		}
		sort.Slice(queryParams, func(i, j int) bool { return queryParams[i].Name < queryParams[j].Name })

		successStatus, successResp := pickSuccessResponse(op.Responses)
		successSchema := schema{}
		if media, ok := successResp.Content["application/json"]; ok && media.Schema != nil {
			successSchema = resolveSchema(*media.Schema, spec.Components.Schemas)
		}

		requestSchema := schema{}
		requestBodyRequired := false
		if op.RequestBody != nil {
			requestBodyRequired = op.RequestBody.Required
			if media, ok := op.RequestBody.Content["application/json"]; ok && media.Schema != nil {
				requestSchema = resolveSchema(*media.Schema, spec.Components.Schemas)
			}
		}

		errorStatuses := make([]int, 0)
		for code := range op.Responses {
			status, err := strconv.Atoi(code)
			if err != nil {
				continue
			}
			if status < 200 || status >= 300 {
				errorStatuses = append(errorStatuses, status)
			}
		}
		sort.Ints(errorStatuses)

		requiredFields := append([]string(nil), requestSchema.Required...)
		sort.Strings(requiredFields)

		propTypes := make([]generatedPropertyType, 0, len(requestSchema.Properties))
		for name, prop := range requestSchema.Properties {
			if prop == nil {
				continue
			}
			resolved := resolveSchema(*prop, spec.Components.Schemas)
			propTypes = append(propTypes, generatedPropertyType{Name: name, Type: resolved.Type})
		}
		sort.Slice(propTypes, func(i, j int) bool { return propTypes[i].Name < propTypes[j].Name })

		cases = append(cases, generatedCase{
			Name:                  target.name,
			Method:                strings.ToUpper(target.method),
			Path:                  target.path,
			SuccessStatus:         successStatus,
			SuccessSchema:         toGeneratedSchema(successSchema),
			ErrorStatuses:         errorStatuses,
			RequestBodyRequired:   requestBodyRequired,
			RequestRequiredFields: requiredFields,
			RequestPropertyTypes:  propTypes,
			QueryParams:           queryParams,
		})
	}
	return cases
}

func methodOperation(item pathItem, method string) json.RawMessage {
	switch strings.ToLower(method) {
	case "get":
		return item.Get
	case "post":
		return item.Post
	case "patch":
		return item.Patch
	case "delete":
		return item.Delete
	case "put":
		return item.Put
	default:
		log.Fatalf("unsupported method: %s", method)
		return nil
	}
}

func mergeParameters(pathParams, opParams []parameter) []parameter {
	merged := make(map[string]parameter, len(pathParams)+len(opParams))
	order := make([]string, 0, len(pathParams)+len(opParams))

	for _, p := range pathParams {
		key := p.In + ":" + p.Name
		if _, exists := merged[key]; !exists {
			order = append(order, key)
		}
		merged[key] = p
	}
	for _, p := range opParams {
		key := p.In + ":" + p.Name
		if _, exists := merged[key]; !exists {
			order = append(order, key)
		}
		merged[key] = p
	}

	out := make([]parameter, 0, len(order))
	for _, key := range order {
		out = append(out, merged[key])
	}
	return out
}

func pickSuccessResponse(responses map[string]response) (int, response) {
	statusCodes := make([]int, 0)
	for code := range responses {
		status, err := strconv.Atoi(code)
		if err != nil {
			continue
		}
		if status >= 200 && status < 300 {
			statusCodes = append(statusCodes, status)
		}
	}
	if len(statusCodes) == 0 {
		log.Fatalf("no success response in operation")
	}
	sort.Ints(statusCodes)
	status := statusCodes[0]
	return status, responses[strconv.Itoa(status)]
}

func resolveSchema(s schema, components map[string]schema) schema {
	if s.Ref == "" {
		if s.Items != nil {
			resolvedItems := resolveSchema(*s.Items, components)
			s.Items = &resolvedItems
		}
		if len(s.Properties) > 0 {
			resolvedProps := make(map[string]*schema, len(s.Properties))
			for name, prop := range s.Properties {
				if prop == nil {
					continue
				}
				resolved := resolveSchema(*prop, components)
				resolvedProps[name] = &resolved
			}
			s.Properties = resolvedProps
		}
		return s
	}

	const prefix = "#/components/schemas/"
	if !strings.HasPrefix(s.Ref, prefix) {
		log.Fatalf("unsupported schema ref: %s", s.Ref)
	}
	name := strings.TrimPrefix(s.Ref, prefix)
	component, ok := components[name]
	if !ok {
		log.Fatalf("schema ref not found: %s", s.Ref)
	}
	resolved := resolveSchema(component, components)
	resolved.Nullable = s.Nullable || resolved.Nullable
	return resolved
}

func toGeneratedSchema(s schema) generatedSchema {
	out := generatedSchema{
		Type:     s.Type,
		Nullable: s.Nullable,
	}
	out.Required = append(out.Required, s.Required...)
	sort.Strings(out.Required)

	if len(s.Properties) > 0 {
		names := make([]string, 0, len(s.Properties))
		for name := range s.Properties {
			names = append(names, name)
		}
		sort.Strings(names)
		for _, name := range names {
			prop := s.Properties[name]
			if prop == nil {
				continue
			}
			out.Properties = append(out.Properties, generatedProperty{
				Name:   name,
				Schema: toGeneratedSchema(*prop),
			})
		}
	}

	if s.Items != nil {
		items := toGeneratedSchema(*s.Items)
		out.Items = &items
	}

	return out
}

func renderGeneratedTest(mutationCases, readCases []generatedCase) []byte {
	var b bytes.Buffer
	b.WriteString("// Code generated by openapi-contract-test-gen; DO NOT EDIT.\n")
	b.WriteString("\n")
	b.WriteString("package tests\n")
	b.WriteString("\n")
	b.WriteString("import (\n")
	b.WriteString("\t\"bytes\"\n")
	b.WriteString("\t\"encoding/json\"\n")
	b.WriteString("\t\"fmt\"\n")
	b.WriteString("\t\"net/http\"\n")
	b.WriteString("\t\"net/http/httptest\"\n")
	b.WriteString("\t\"net/url\"\n")
	b.WriteString("\t\"sort\"\n")
	b.WriteString("\t\"strings\"\n")
	b.WriteString("\t\"testing\"\n")
	b.WriteString(")\n\n")

	b.WriteString("type generatedContractCase struct {\n")
	b.WriteString("\tName                  string\n")
	b.WriteString("\tMethod                string\n")
	b.WriteString("\tPath                  string\n")
	b.WriteString("\tSuccessStatus         int\n")
	b.WriteString("\tSuccessSchema         generatedContractSchema\n")
	b.WriteString("\tErrorStatuses         []int\n")
	b.WriteString("\tRequestBodyRequired   bool\n")
	b.WriteString("\tRequestRequiredFields []string\n")
	b.WriteString("\tRequestPropertyTypes  []generatedContractPropertyType\n")
	b.WriteString("\tQueryParams           []generatedContractQueryParam\n")
	b.WriteString("}\n\n")

	b.WriteString("type generatedContractQueryParam struct {\n")
	b.WriteString("\tName       string\n")
	b.WriteString("\tType       string\n")
	b.WriteString("\tRequired   bool\n")
	b.WriteString("\tEnumValues []string\n")
	b.WriteString("}\n\n")

	b.WriteString("type generatedContractSchema struct {\n")
	b.WriteString("\tType       string\n")
	b.WriteString("\tNullable   bool\n")
	b.WriteString("\tRequired   []string\n")
	b.WriteString("\tProperties []generatedContractProperty\n")
	b.WriteString("\tItems      *generatedContractSchema\n")
	b.WriteString("}\n\n")

	b.WriteString("type generatedContractProperty struct {\n")
	b.WriteString("\tName   string\n")
	b.WriteString("\tSchema generatedContractSchema\n")
	b.WriteString("}\n\n")

	b.WriteString("type generatedContractPropertyType struct {\n")
	b.WriteString("\tName string\n")
	b.WriteString("\tType string\n")
	b.WriteString("}\n\n")

	b.WriteString("type generatedMutationSetup struct {\n")
	b.WriteString("\tTaskID    int64\n")
	b.WriteString("\tProjectID int64\n")
	b.WriteString("\tBoardID   int64\n")
	b.WriteString("\tColumnID  int64\n")
	b.WriteString("}\n\n")

	b.WriteString("var generatedMutationContractCases = []generatedContractCase{\n")
	for _, c := range mutationCases {
		renderCaseLiteral(&b, c)
	}
	b.WriteString("}\n\n")

	b.WriteString("var generatedReadContractCases = []generatedContractCase{\n")
	for _, c := range readCases {
		renderCaseLiteral(&b, c)
	}
	b.WriteString("}\n\n")

	b.WriteString(testFunctionsSource)
	return b.Bytes()
}

func renderCaseLiteral(b *bytes.Buffer, c generatedCase) {
	b.WriteString("\t{\n")
	b.WriteString(fmt.Sprintf("\t\tName: %q,\n", c.Name))
	b.WriteString(fmt.Sprintf("\t\tMethod: %q,\n", c.Method))
	b.WriteString(fmt.Sprintf("\t\tPath: %q,\n", c.Path))
	b.WriteString(fmt.Sprintf("\t\tSuccessStatus: %d,\n", c.SuccessStatus))
	b.WriteString("\t\tSuccessSchema: ")
	b.WriteString(renderSchemaLiteral(c.SuccessSchema, "\t\t"))
	b.WriteString(",\n")
	b.WriteString(fmt.Sprintf("\t\tErrorStatuses: %s,\n", renderIntSliceLiteral(c.ErrorStatuses)))
	b.WriteString(fmt.Sprintf("\t\tRequestBodyRequired: %t,\n", c.RequestBodyRequired))
	b.WriteString(fmt.Sprintf("\t\tRequestRequiredFields: %s,\n", renderStringSliceLiteral(c.RequestRequiredFields)))
	b.WriteString("\t\tRequestPropertyTypes: []generatedContractPropertyType{")
	if len(c.RequestPropertyTypes) > 0 {
		b.WriteByte('\n')
		for _, prop := range c.RequestPropertyTypes {
			b.WriteString(fmt.Sprintf("\t\t\t{Name: %q, Type: %q},\n", prop.Name, prop.Type))
		}
		b.WriteString("\t\t},\n")
	} else {
		b.WriteString("},\n")
	}

	b.WriteString("\t\tQueryParams: []generatedContractQueryParam{")
	if len(c.QueryParams) > 0 {
		b.WriteByte('\n')
		for _, p := range c.QueryParams {
			b.WriteString(fmt.Sprintf("\t\t\t{Name: %q, Type: %q, Required: %t, EnumValues: %s},\n", p.Name, p.Type, p.Required, renderStringSliceLiteral(p.EnumValues)))
		}
		b.WriteString("\t\t},\n")
	} else {
		b.WriteString("},\n")
	}
	b.WriteString("\t},\n")
}

func renderSchemaLiteral(s generatedSchema, indent string) string {
	var b strings.Builder
	b.WriteString("generatedContractSchema{")
	b.WriteString(fmt.Sprintf("Type: %q, Nullable: %t, Required: %s", s.Type, s.Nullable, renderStringSliceLiteral(s.Required)))
	if len(s.Properties) > 0 {
		b.WriteString(", Properties: []generatedContractProperty{\n")
		for _, prop := range s.Properties {
			b.WriteString(indent)
			b.WriteString("\t")
			b.WriteString(fmt.Sprintf("{Name: %q, Schema: %s},\n", prop.Name, renderSchemaLiteral(prop.Schema, indent+"\t")))
		}
		b.WriteString(indent)
		b.WriteString("}")
	}
	if s.Items != nil {
		b.WriteString(fmt.Sprintf(", Items: &%s", renderSchemaLiteral(*s.Items, indent+"\t")))
	}
	b.WriteString("}")
	return b.String()
}

func renderStringSliceLiteral(items []string) string {
	if len(items) == 0 {
		return "[]string{}"
	}
	var b strings.Builder
	b.WriteString("[]string{")
	for i, item := range items {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(strconv.Quote(item))
	}
	b.WriteString("}")
	return b.String()
}

func renderIntSliceLiteral(items []int) string {
	if len(items) == 0 {
		return "[]int{}"
	}
	var b strings.Builder
	b.WriteString("[]int{")
	for i, item := range items {
		if i > 0 {
			b.WriteString(", ")
		}
		b.WriteString(strconv.Itoa(item))
	}
	b.WriteString("}")
	return b.String()
}

const testFunctionsSource = `
func TestGeneratedOpenAPIMutationContracts(t *testing.T) {
	h := newAPIHarness(t)

	for _, tc := range generatedMutationContractCases {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			setup := generatedPrepareMutationSetup(t, h, tc.Name)
			path := generatedPathWithSetup(tc.Path, setup)
			successBody := generatedSuccessBody(tc.Name, setup)

			status, response := h.jsonRequest(tc.Method, path, successBody)
			if status != tc.SuccessStatus {
				t.Fatalf("%s %s: expected success status %d, got %d", tc.Method, tc.Path, tc.SuccessStatus, status)
			}
			generatedAssertSchemaMatch(t, tc.Method+" "+tc.Path+" success", response, tc.SuccessSchema)

			if generatedContainsStatus(tc.ErrorStatuses, http.StatusBadRequest) {
				invalidBody, ok := generatedInvalidBody(tc)
				if !ok {
					t.Fatalf("%s %s: missing invalid request body fixture", tc.Method, tc.Path)
				}
				status, _ = h.jsonRequest(tc.Method, path, invalidBody)
				if status != http.StatusBadRequest {
					t.Fatalf("%s %s: expected 400 for invalid request, got %d", tc.Method, tc.Path, status)
				}
			}

			if generatedContainsStatus(tc.ErrorStatuses, http.StatusNotFound) {
				notFoundPath := strings.Replace(tc.Path, "{id}", "9999999", 1)
				status, _ = h.jsonRequest(tc.Method, notFoundPath, successBody)
				if status != http.StatusNotFound {
					t.Fatalf("%s %s: expected 404 for missing resource, got %d", tc.Method, tc.Path, status)
				}
			}
		})
	}
}

func TestGeneratedOpenAPIReadContracts(t *testing.T) {
	h := newAPIHarness(t)

	for _, tc := range generatedReadContractCases {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			setup := generatedPrepareReadSetup(t, h, tc.Name)
			path := generatedReadPathWithSetup(tc.Path, setup)
			validPath := generatedPathWithQuery(path, generatedValidQueryValues(tc, setup))

			status, response := generatedJSONRequestAny(h, tc.Method, validPath, nil)
			if status != tc.SuccessStatus {
				t.Fatalf("%s %s: expected success status %d, got %d", tc.Method, tc.Path, tc.SuccessStatus, status)
			}
			generatedAssertSchemaMatch(t, tc.Method+" "+tc.Path+" success", response, tc.SuccessSchema)

			if generatedContainsStatus(tc.ErrorStatuses, http.StatusBadRequest) {
				invalidQuery, ok := generatedInvalidQueryValues(tc)
				if !ok {
					t.Fatalf("%s %s: missing invalid query fixture", tc.Method, tc.Path)
				}
				invalidPath := generatedPathWithQuery(path, invalidQuery)
				status, _ = generatedJSONRequestAny(h, tc.Method, invalidPath, nil)
				if status != http.StatusBadRequest {
					t.Fatalf("%s %s: expected 400 for invalid query, got %d", tc.Method, tc.Path, status)
				}
			}

			if generatedContainsStatus(tc.ErrorStatuses, http.StatusNotFound) && strings.Contains(tc.Path, "{id}") {
				notFoundPath := strings.Replace(tc.Path, "{id}", "9999999", 1)
				status, _ = generatedJSONRequestAny(h, tc.Method, notFoundPath, nil)
				if status != http.StatusNotFound {
					t.Fatalf("%s %s: expected 404 for missing resource, got %d", tc.Method, tc.Path, status)
				}
			}
		})
	}
}

func generatedPrepareMutationSetup(t *testing.T, h *apiHarness, caseName string) generatedMutationSetup {
	t.Helper()

	switch caseName {
	case "create_task":
		return generatedMutationSetup{}
	case "patch_task_state":
		status, task := h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{"title": "Contract task"})
		if status != http.StatusCreated {
			t.Fatalf("setup task for state patch: expected 201, got %d", status)
		}
		return generatedMutationSetup{TaskID: mustInt64(t, task["id"])}
	case "patch_task_board_column":
		status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Contract Project"})
		if status != http.StatusCreated {
			t.Fatalf("setup project for board-column patch: expected 201, got %d", status)
		}
		projectID := mustInt64(t, project["id"])

		status, board := h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{"projectId": projectID, "name": "Contract Board"})
		if status != http.StatusCreated {
			t.Fatalf("setup board for board-column patch: expected 201, got %d", status)
		}
		boardID := mustInt64(t, board["id"])

		status, column := h.jsonRequest(http.MethodPost, "/api/columns", map[string]any{"boardId": boardID, "name": "Contract Column", "position": 1})
		if status != http.StatusCreated {
			t.Fatalf("setup column for board-column patch: expected 201, got %d", status)
		}
		columnID := mustInt64(t, column["id"])

		status, task := h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{"title": "Contract task"})
		if status != http.StatusCreated {
			t.Fatalf("setup task for board-column patch: expected 201, got %d", status)
		}
		return generatedMutationSetup{TaskID: mustInt64(t, task["id"]), ProjectID: projectID, BoardID: boardID, ColumnID: columnID}
	case "create_board":
		status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Contract Project"})
		if status != http.StatusCreated {
			t.Fatalf("setup project for board create: expected 201, got %d", status)
		}
		return generatedMutationSetup{ProjectID: mustInt64(t, project["id"])}
	case "create_column":
		status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Contract Project"})
		if status != http.StatusCreated {
			t.Fatalf("setup project for column create: expected 201, got %d", status)
		}
		projectID := mustInt64(t, project["id"])
		status, board := h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{"projectId": projectID, "name": "Contract Board"})
		if status != http.StatusCreated {
			t.Fatalf("setup board for column create: expected 201, got %d", status)
		}
		return generatedMutationSetup{ProjectID: projectID, BoardID: mustInt64(t, board["id"])}
	default:
		t.Fatalf("unknown generated case %q", caseName)
		return generatedMutationSetup{}
	}
}

func generatedPrepareReadSetup(t *testing.T, h *apiHarness, caseName string) generatedMutationSetup {
	t.Helper()

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Read Contract Project"})
	if status != http.StatusCreated {
		t.Fatalf("setup project for %s: expected 201, got %d", caseName, status)
	}
	projectID := mustInt64(t, project["id"])

	status, board := h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{"projectId": projectID, "name": "Read Contract Board"})
	if status != http.StatusCreated {
		t.Fatalf("setup board for %s: expected 201, got %d", caseName, status)
	}
	boardID := mustInt64(t, board["id"])

	status, column := h.jsonRequest(http.MethodPost, "/api/columns", map[string]any{"boardId": boardID, "name": "Read Contract Column", "position": 1})
	if status != http.StatusCreated {
		t.Fatalf("setup column for %s: expected 201, got %d", caseName, status)
	}
	columnID := mustInt64(t, column["id"])

	status, _ = h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{"title": "Read Contract Task", "projectId": projectID, "boardColumnId": columnID, "state": "inbox"})
	if status != http.StatusCreated {
		t.Fatalf("setup task for %s: expected 201, got %d", caseName, status)
	}

	return generatedMutationSetup{ProjectID: projectID, BoardID: boardID, ColumnID: columnID}
}

func generatedPathWithSetup(path string, setup generatedMutationSetup) string {
	if strings.Contains(path, "{id}") {
		id := setup.TaskID
		if id <= 0 {
			id = 1
		}
		return strings.Replace(path, "{id}", fmt.Sprintf("%d", id), 1)
	}
	return path
}

func generatedReadPathWithSetup(path string, setup generatedMutationSetup) string {
	if !strings.Contains(path, "{id}") {
		return path
	}
	id := int64(1)
	switch {
	case strings.Contains(path, "/api/boards/{id}"):
		if setup.BoardID > 0 {
			id = setup.BoardID
		}
	case strings.Contains(path, "/api/columns/{id}"):
		if setup.ColumnID > 0 {
			id = setup.ColumnID
		}
	default:
		if setup.TaskID > 0 {
			id = setup.TaskID
		}
	}
	return strings.Replace(path, "{id}", fmt.Sprintf("%d", id), 1)
}

func generatedSuccessBody(caseName string, setup generatedMutationSetup) map[string]any {
	switch caseName {
	case "create_task":
		return map[string]any{"title": "Contract task"}
	case "patch_task_state":
		return map[string]any{"state": "inbox"}
	case "patch_task_board_column":
		return map[string]any{"boardColumnId": setup.ColumnID}
	case "create_board":
		return map[string]any{"projectId": setup.ProjectID, "name": "Contract Board"}
	case "create_column":
		return map[string]any{"boardId": setup.BoardID, "name": "Contract Column", "position": 1}
	default:
		return map[string]any{}
	}
}

func generatedValidQueryValues(tc generatedContractCase, setup generatedMutationSetup) map[string]string {
	query := map[string]string{}
	for _, param := range tc.QueryParams {
		switch param.Name {
		case "page":
			query[param.Name] = "1"
		case "pageSize":
			query[param.Name] = "20"
		case "state":
			if len(param.EnumValues) > 0 {
				query[param.Name] = param.EnumValues[0]
			} else {
				query[param.Name] = "inbox"
			}
		case "projectId":
			if setup.ProjectID > 0 {
				query[param.Name] = fmt.Sprintf("%d", setup.ProjectID)
			} else {
				query[param.Name] = "1"
			}
		case "boardId":
			if setup.BoardID > 0 {
				query[param.Name] = fmt.Sprintf("%d", setup.BoardID)
			} else {
				query[param.Name] = "1"
			}
		case "boardColumnId":
			if setup.ColumnID > 0 {
				query[param.Name] = fmt.Sprintf("%d", setup.ColumnID)
			} else {
				query[param.Name] = "1"
			}
		case "q", "assigneeId":
		default:
			switch param.Type {
			case "integer", "number":
				query[param.Name] = "1"
			case "boolean":
				query[param.Name] = "true"
			case "string":
				if len(param.EnumValues) > 0 {
					query[param.Name] = param.EnumValues[0]
				} else {
					query[param.Name] = "value"
				}
			}
		}
	}
	return query
}

func generatedInvalidQueryValues(tc generatedContractCase) (map[string]string, bool) {
	params := append([]generatedContractQueryParam(nil), tc.QueryParams...)
	sort.Slice(params, func(i, j int) bool { return params[i].Name < params[j].Name })

	for _, param := range params {
		switch param.Type {
		case "integer", "number", "boolean":
			return map[string]string{param.Name: "invalid"}, true
		case "string":
			if len(param.EnumValues) > 0 {
				return map[string]string{param.Name: "invalid"}, true
			}
		}
	}

	return nil, false
}

func generatedPathWithQuery(path string, query map[string]string) string {
	if len(query) == 0 {
		return path
	}
	keys := make([]string, 0, len(query))
	for key := range query {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	values := url.Values{}
	for _, key := range keys {
		values.Set(key, query[key])
	}
	encoded := values.Encode()
	if encoded == "" {
		return path
	}
	if strings.Contains(path, "?") {
		return path + "&" + encoded
	}
	return path + "?" + encoded
}

func generatedInvalidBody(tc generatedContractCase) (map[string]any, bool) {
	if len(tc.RequestRequiredFields) > 0 {
		return map[string]any{}, true
	}

	props := append([]generatedContractPropertyType(nil), tc.RequestPropertyTypes...)
	sort.Slice(props, func(i, j int) bool { return props[i].Name < props[j].Name })
	for _, prop := range props {
		switch prop.Type {
		case "integer", "number":
			return map[string]any{prop.Name: "invalid"}, true
		case "string":
			return map[string]any{prop.Name: 123}, true
		case "boolean":
			return map[string]any{prop.Name: "invalid"}, true
		}
	}

	if tc.RequestBodyRequired {
		return nil, true
	}
	return nil, false
}

func generatedContainsStatus(statuses []int, target int) bool {
	for _, status := range statuses {
		if status == target {
			return true
		}
	}
	return false
}

func generatedJSONRequestAny(h *apiHarness, method, path string, body any) (int, any) {
	h.t.Helper()

	var reader *bytes.Reader
	if body == nil {
		reader = bytes.NewReader(nil)
	} else {
		payload, err := json.Marshal(body)
		if err != nil {
			h.t.Fatalf("marshal request body: %v", err)
		}
		reader = bytes.NewReader(payload)
	}

	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.h.ServeHTTP(rr, req)

	var out any
	_ = json.NewDecoder(rr.Body).Decode(&out)
	if out == nil {
		out = map[string]any{}
	}
	return rr.Code, out
}

func generatedAssertSchemaMatch(t *testing.T, context string, value any, schema generatedContractSchema) {
	t.Helper()

	if value == nil {
		if schema.Nullable {
			return
		}
		t.Fatalf("%s: expected %s, got null", context, schema.Type)
	}

	switch schema.Type {
	case "object":
		obj, ok := value.(map[string]any)
		if !ok {
			t.Fatalf("%s: expected object, got %T", context, value)
		}
		for _, key := range schema.Required {
			if _, exists := obj[key]; !exists {
				t.Fatalf("%s: missing required property %q", context, key)
			}
		}
		for _, prop := range schema.Properties {
			v, exists := obj[prop.Name]
			if !exists {
				continue
			}
			generatedAssertSchemaMatch(t, context+"."+prop.Name, v, prop.Schema)
		}
	case "array":
		arr, ok := value.([]any)
		if !ok {
			t.Fatalf("%s: expected array, got %T", context, value)
		}
		if schema.Items != nil {
			for i, item := range arr {
				generatedAssertSchemaMatch(t, fmt.Sprintf("%s[%d]", context, i), item, *schema.Items)
			}
		}
	case "integer", "number":
		if _, ok := value.(float64); !ok {
			t.Fatalf("%s: expected number, got %T", context, value)
		}
	case "string":
		if _, ok := value.(string); !ok {
			t.Fatalf("%s: expected string, got %T", context, value)
		}
	case "boolean":
		if _, ok := value.(bool); !ok {
			t.Fatalf("%s: expected boolean, got %T", context, value)
		}
	default:
		t.Fatalf("%s: unsupported schema type %q", context, schema.Type)
	}
}
`
