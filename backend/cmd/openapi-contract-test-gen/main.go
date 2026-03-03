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
	Paths      map[string]map[string]json.RawMessage `json:"paths"`
	Components struct {
		Schemas map[string]schema `json:"schemas"`
	} `json:"components"`
}

type operation struct {
	RequestBody *requestBody        `json:"requestBody"`
	Responses   map[string]response `json:"responses"`
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

	targets := []struct {
		name   string
		method string
		path   string
	}{
		{name: "create_task", method: "post", path: "/api/tasks"},
		{name: "patch_task_state", method: "patch", path: "/api/tasks/{id}/state"},
		{name: "patch_task_board_column", method: "patch", path: "/api/tasks/{id}/board-column"},
		{name: "create_board", method: "post", path: "/api/boards"},
		{name: "create_column", method: "post", path: "/api/columns"},
	}

	cases := make([]generatedCase, 0, len(targets))
	for _, target := range targets {
		methods, ok := spec.Paths[target.path]
		if !ok {
			log.Fatalf("path not found in spec: %s", target.path)
		}
		opRaw, ok := methods[target.method]
		if !ok {
			log.Fatalf("method %s missing for path %s", strings.ToUpper(target.method), target.path)
		}
		var op operation
		if err := json.Unmarshal(opRaw, &op); err != nil {
			log.Fatalf("parse %s %s operation: %v", strings.ToUpper(target.method), target.path, err)
		}

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
		})
	}

	out := renderGeneratedTest(cases)
	if err := os.WriteFile(*outFile, out, 0o644); err != nil {
		log.Fatalf("write generated test: %v", err)
	}
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

func renderGeneratedTest(cases []generatedCase) []byte {
	var b bytes.Buffer
	b.WriteString("// Code generated by openapi-contract-test-gen; DO NOT EDIT.\n")
	b.WriteString("\n")
	b.WriteString("package tests\n")
	b.WriteString("\n")
	b.WriteString("import (\n")
	b.WriteString("\t\"fmt\"\n")
	b.WriteString("\t\"net/http\"\n")
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
	for _, c := range cases {
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
		b.WriteString("\t},\n")
	}
	b.WriteString("}\n\n")

	b.WriteString(testFunctionsSource)
	return b.Bytes()
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
