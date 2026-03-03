package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/example/todo-app/backend/internal/app"
	"github.com/example/todo-app/backend/internal/store"
)

type apiHarness struct {
	t     *testing.T
	store *store.SQLiteStore
	h     http.Handler
}

func newAPIHarness(t *testing.T) *apiHarness {
	t.Helper()
	dsn := fmt.Sprintf("file:%s?_pragma=foreign_keys(1)", filepath.Join(t.TempDir(), "todo-test.db"))
	s, err := store.NewSQLiteStore(dsn)
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	if err := s.Migrate(context.Background()); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	h := app.NewServer(s).Routes()
	t.Cleanup(func() {
		_ = s.Close()
	})
	return &apiHarness{t: t, store: s, h: h}
}

func (h *apiHarness) jsonRequest(method, path string, body any) (int, map[string]any) {
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
	var out map[string]any
	_ = json.NewDecoder(rr.Body).Decode(&out)
	if out == nil {
		out = map[string]any{}
	}
	return rr.Code, out
}

func (h *apiHarness) jsonRequestArray(method, path string, body any) (int, []map[string]any) {
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
	var out []map[string]any
	_ = json.NewDecoder(rr.Body).Decode(&out)
	return rr.Code, out
}

func (h *apiHarness) jsonRequestPaginated(method, path string, body any) (int, map[string]any, []map[string]any) {
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

	var out map[string]any
	_ = json.NewDecoder(rr.Body).Decode(&out)
	itemsRaw, ok := out["items"].([]any)
	if !ok {
		return rr.Code, out, nil
	}
	items := make([]map[string]any, 0, len(itemsRaw))
	for _, raw := range itemsRaw {
		item, ok := raw.(map[string]any)
		if !ok {
			h.t.Fatalf("expected paginated item object, got %T", raw)
		}
		items = append(items, item)
	}
	return rr.Code, out, items
}

func (h *apiHarness) textRequest(method, path string) (int, string) {
	h.t.Helper()
	req := httptest.NewRequest(method, path, nil)
	rr := httptest.NewRecorder()
	h.h.ServeHTTP(rr, req)
	return rr.Code, rr.Body.String()
}

func mustInt64(t *testing.T, raw any) int64 {
	t.Helper()
	v, ok := raw.(float64)
	if !ok {
		t.Fatalf("expected numeric value, got %T", raw)
	}
	return int64(v)
}

func TestPrincipalsEndpoints(t *testing.T) {
	h := newAPIHarness(t)

	status, _ := h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "robot",
		"handle":      "agent-a",
		"displayName": "Agent A",
	})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid kind, got %d", status)
	}

	status, created := h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "agent",
		"handle":      "agent-a",
		"displayName": "Agent A",
	})
	if status != http.StatusCreated {
		t.Fatalf("expected 201 for valid principal, got %d", status)
	}
	if mustInt64(t, created["id"]) <= 0 {
		t.Fatal("expected created principal id")
	}

	status, _ = h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "agent",
		"handle":      "agent-a",
		"displayName": "Duplicate",
	})
	if status != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate handle, got %d", status)
	}

	status, page, list := h.jsonRequestPaginated(http.MethodGet, "/api/principals", nil)
	if status != http.StatusOK {
		t.Fatalf("expected 200 for list principals, got %d", status)
	}
	if mustInt64(t, page["totalItems"]) != 1 {
		t.Fatalf("expected totalItems=1, got %v", page["totalItems"])
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 principal, got %d", len(list))
	}
}

func TestTaskAssigneeEndpointAndEvent(t *testing.T) {
	h := newAPIHarness(t)

	status, principal := h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "human",
		"handle":      "alice",
		"displayName": "Alice",
	})
	if status != http.StatusCreated {
		t.Fatalf("create principal: expected 201, got %d", status)
	}
	principalID := mustInt64(t, principal["id"])

	status, task := h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{"title": "Write tests"})
	if status != http.StatusCreated {
		t.Fatalf("create task: expected 201, got %d", status)
	}
	taskID := mustInt64(t, task["id"])

	status, _ = h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/tasks/%d/assignee", taskID), map[string]any{"assigneeId": 999999})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for unknown principal assignee, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/tasks/%d/assignee", taskID), map[string]any{
		"assigneeId": principalID,
		"actorId":    principalID,
	})
	if status != http.StatusOK {
		t.Fatalf("expected 200 for assign, got %d", status)
	}

	status, _, tasks := h.jsonRequestPaginated(http.MethodGet, "/api/tasks", nil)
	if status != http.StatusOK {
		t.Fatalf("list tasks: expected 200, got %d", status)
	}
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
	if got := mustInt64(t, tasks[0]["assigneeId"]); got != principalID {
		t.Fatalf("expected assigneeId=%d, got %d", principalID, got)
	}

	events, err := h.store.ListTaskEvents(context.Background(), taskID)
	if err != nil {
		t.Fatalf("list task events: %v", err)
	}
	if len(events) < 2 {
		t.Fatalf("expected at least 2 task events, got %d", len(events))
	}
	if got := events[len(events)-1].EventType; got != "task.assignee.changed" {
		t.Fatalf("expected last event type task.assignee.changed, got %q", got)
	}
}

func TestTaskBoardColumnEndpointAndEvent(t *testing.T) {
	h := newAPIHarness(t)

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Work"})
	if status != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", status)
	}
	projectID := mustInt64(t, project["id"])

	status, board := h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{
		"projectId": projectID,
		"name":      "Execution",
	})
	if status != http.StatusCreated {
		t.Fatalf("create board: expected 201, got %d", status)
	}
	boardID := mustInt64(t, board["id"])

	status, column := h.jsonRequest(http.MethodPost, "/api/columns", map[string]any{
		"boardId":  boardID,
		"name":     "Doing",
		"position": 1,
	})
	if status != http.StatusCreated {
		t.Fatalf("create column: expected 201, got %d", status)
	}
	columnID := mustInt64(t, column["id"])

	status, task := h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{"title": "Ship feature"})
	if status != http.StatusCreated {
		t.Fatalf("create task: expected 201, got %d", status)
	}
	taskID := mustInt64(t, task["id"])

	status, _ = h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/tasks/%d/board-column", taskID), map[string]any{"boardColumnId": 999999})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for unknown board column, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/tasks/%d/board-column", taskID), map[string]any{"boardColumnId": columnID})
	if status != http.StatusOK {
		t.Fatalf("expected 200 for setting board column, got %d", status)
	}

	status, _, tasks := h.jsonRequestPaginated(http.MethodGet, "/api/tasks", nil)
	if status != http.StatusOK {
		t.Fatalf("list tasks: expected 200, got %d", status)
	}
	if len(tasks) != 1 {
		t.Fatalf("expected 1 task, got %d", len(tasks))
	}
	if got := mustInt64(t, tasks[0]["boardColumnId"]); got != columnID {
		t.Fatalf("expected boardColumnId=%d, got %d", columnID, got)
	}

	status, _ = h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/tasks/%d/board-column", taskID), map[string]any{"boardColumnId": nil})
	if status != http.StatusOK {
		t.Fatalf("expected 200 for clearing board column, got %d", status)
	}

	events, err := h.store.ListTaskEvents(context.Background(), taskID)
	if err != nil {
		t.Fatalf("list task events: %v", err)
	}
	if len(events) < 3 {
		t.Fatalf("expected at least 3 task events, got %d", len(events))
	}
	if got := events[len(events)-1].EventType; got != "task.board_column.changed" {
		t.Fatalf("expected last event type task.board_column.changed, got %q", got)
	}
}

func TestBoardAndColumnCRUDEndpoints(t *testing.T) {
	h := newAPIHarness(t)

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Roadmap"})
	if status != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", status)
	}
	projectID := mustInt64(t, project["id"])

	status, board := h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{
		"projectId": projectID,
		"name":      "Delivery Board",
	})
	if status != http.StatusCreated {
		t.Fatalf("create board: expected 201, got %d", status)
	}
	boardID := mustInt64(t, board["id"])

	status, _ = h.jsonRequest(http.MethodGet, fmt.Sprintf("/api/boards/%d", boardID), nil)
	if status != http.StatusOK {
		t.Fatalf("get board: expected 200, got %d", status)
	}

	status, updatedBoard := h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/boards/%d", boardID), map[string]any{"name": "Delivery"})
	if status != http.StatusOK {
		t.Fatalf("patch board: expected 200, got %d", status)
	}
	if updatedBoard["name"] != "Delivery" {
		t.Fatalf("expected updated board name, got %v", updatedBoard["name"])
	}

	status, boards := h.jsonRequestArray(http.MethodGet, fmt.Sprintf("/api/boards?projectId=%d", projectID), nil)
	if status != http.StatusOK {
		t.Fatalf("list boards: expected 200, got %d", status)
	}
	if len(boards) != 1 {
		t.Fatalf("expected 1 board, got %d", len(boards))
	}

	status, column := h.jsonRequest(http.MethodPost, "/api/columns", map[string]any{
		"boardId":  boardID,
		"name":     "In Progress",
		"position": 10,
	})
	if status != http.StatusCreated {
		t.Fatalf("create column: expected 201, got %d", status)
	}
	columnID := mustInt64(t, column["id"])

	status, updatedColumn := h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/columns/%d", columnID), map[string]any{
		"name":     "Doing",
		"position": 20,
	})
	if status != http.StatusOK {
		t.Fatalf("patch column: expected 200, got %d", status)
	}
	if updatedColumn["name"] != "Doing" {
		t.Fatalf("expected updated column name, got %v", updatedColumn["name"])
	}

	status, columns := h.jsonRequestArray(http.MethodGet, fmt.Sprintf("/api/columns?boardId=%d", boardID), nil)
	if status != http.StatusOK {
		t.Fatalf("list columns: expected 200, got %d", status)
	}
	if len(columns) != 1 {
		t.Fatalf("expected 1 column, got %d", len(columns))
	}

	status, _ = h.jsonRequest(http.MethodDelete, fmt.Sprintf("/api/columns/%d", columnID), nil)
	if status != http.StatusOK {
		t.Fatalf("delete column: expected 200, got %d", status)
	}
	status, _ = h.jsonRequest(http.MethodDelete, fmt.Sprintf("/api/boards/%d", boardID), nil)
	if status != http.StatusOK {
		t.Fatalf("delete board: expected 200, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, fmt.Sprintf("/api/boards/%d", boardID), nil)
	if status != http.StatusNotFound {
		t.Fatalf("expected 404 for deleted board, got %d", status)
	}
}

func TestPrincipalsBoardsColumnsValidationErrors(t *testing.T) {
	h := newAPIHarness(t)

	status, _ := h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "human",
		"handle":      "bad handle",
		"displayName": "Alice",
	})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid principal handle, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "human",
		"handle":      "alice",
		"displayName": "",
	})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing displayName, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/principals?kind=robot", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid principals kind filter, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/principals?page=0", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid principals page, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/principals?pageSize=999", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid principals pageSize, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/boards?projectId=abc", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid boards projectId filter, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{
		"name": "No Project",
	})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing board projectId, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPatch, "/api/boards/999999", map[string]any{
		"name": "Does Not Exist",
	})
	if status != http.StatusNotFound {
		t.Fatalf("expected 404 for unknown board id, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/columns?boardId=abc", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid columns boardId filter, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPost, "/api/columns", map[string]any{
		"name": "No Board",
	})
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing column boardId, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPatch, "/api/columns/999999", map[string]any{
		"name": "Does Not Exist",
	})
	if status != http.StatusNotFound {
		t.Fatalf("expected 404 for unknown column id, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/tasks?state=not-real", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid task state filter, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/tasks?projectId=abc", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid projectId filter, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/tasks?page=-1", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid tasks page, got %d", status)
	}
}

func TestPaginatedFilteringForPrincipalsAndTasks(t *testing.T) {
	h := newAPIHarness(t)

	for _, principal := range []map[string]any{
		{"kind": "human", "handle": "alice", "displayName": "Alice Nguyen"},
		{"kind": "agent", "handle": "bot.alpha", "displayName": "Bot Alpha"},
		{"kind": "human", "handle": "bob", "displayName": "Bob Stone"},
	} {
		status, _ := h.jsonRequest(http.MethodPost, "/api/principals", principal)
		if status != http.StatusCreated {
			t.Fatalf("create principal: expected 201, got %d", status)
		}
	}

	status, principalPage, principals := h.jsonRequestPaginated(http.MethodGet, "/api/principals?kind=human&q=ali&page=1&pageSize=1", nil)
	if status != http.StatusOK {
		t.Fatalf("list principals: expected 200, got %d", status)
	}
	if mustInt64(t, principalPage["totalItems"]) != 1 {
		t.Fatalf("expected totalItems=1 for filtered principals, got %v", principalPage["totalItems"])
	}
	if mustInt64(t, principalPage["totalPages"]) != 1 {
		t.Fatalf("expected totalPages=1 for filtered principals, got %v", principalPage["totalPages"])
	}
	if len(principals) != 1 || principals[0]["handle"] != "alice" {
		t.Fatalf("expected filtered principal alice, got %+v", principals)
	}

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Work"})
	if status != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", status)
	}
	projectID := mustInt64(t, project["id"])

	status, principal := h.jsonRequest(http.MethodPost, "/api/principals", map[string]any{
		"kind":        "human",
		"handle":      "owner",
		"displayName": "Owner",
	})
	if status != http.StatusCreated {
		t.Fatalf("create owner principal: expected 201, got %d", status)
	}
	assigneeID := mustInt64(t, principal["id"])

	for _, taskBody := range []map[string]any{
		{"title": "Prepare docs", "description": "docs", "state": "next", "projectId": projectID},
		{"title": "Prepare release notes", "description": "release", "state": "next", "projectId": projectID},
		{"title": "Inbox item", "description": "misc", "state": "inbox"},
	} {
		status, task := h.jsonRequest(http.MethodPost, "/api/tasks", taskBody)
		if status != http.StatusCreated {
			t.Fatalf("create task: expected 201, got %d", status)
		}
		taskID := mustInt64(t, task["id"])
		if taskBody["title"] == "Prepare docs" {
			status, _ = h.jsonRequest(http.MethodPatch, fmt.Sprintf("/api/tasks/%d/assignee", taskID), map[string]any{"assigneeId": assigneeID})
			if status != http.StatusOK {
				t.Fatalf("assign task: expected 200, got %d", status)
			}
		}
	}

	status, taskPage, tasks := h.jsonRequestPaginated(http.MethodGet, fmt.Sprintf("/api/tasks?state=next&projectId=%d&assigneeId=%d&q=prepare&page=1&pageSize=1", projectID, assigneeID), nil)
	if status != http.StatusOK {
		t.Fatalf("list tasks: expected 200, got %d", status)
	}
	if mustInt64(t, taskPage["totalItems"]) != 1 {
		t.Fatalf("expected totalItems=1 for filtered tasks, got %v", taskPage["totalItems"])
	}
	if len(tasks) != 1 || tasks[0]["title"] != "Prepare docs" {
		t.Fatalf("expected filtered task Prepare docs, got %+v", tasks)
	}
}

func TestWeeklyReviewEndpointScaffold(t *testing.T) {
	h := newAPIHarness(t)

	status, _ := h.jsonRequest(http.MethodGet, "/api/reviews/weekly?thresholdDays=bad", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid thresholdDays, got %d", status)
	}

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Weekly Review Project"})
	if status != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", status)
	}
	projectID := mustInt64(t, project["id"])

	status, _ = h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{
		"title":     "Waiting on feedback",
		"state":     "waiting",
		"projectId": projectID,
	})
	if status != http.StatusCreated {
		t.Fatalf("create waiting task: expected 201, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodPost, "/api/tasks", map[string]any{
		"title":     "Ship rollout on Friday",
		"state":     "scheduled",
		"projectId": projectID,
		"dueAt":     "2020-01-01T00:00:00Z",
	})
	if status != http.StatusCreated {
		t.Fatalf("create scheduled task: expected 201, got %d", status)
	}

	status, weekly := h.jsonRequest(http.MethodGet, "/api/reviews/weekly?thresholdDays=0", nil)
	if status != http.StatusOK {
		t.Fatalf("weekly review: expected 200, got %d", status)
	}
	if mustInt64(t, weekly["thresholdDays"]) != 0 {
		t.Fatalf("expected thresholdDays=0, got %v", weekly["thresholdDays"])
	}

	sections, ok := weekly["sections"].(map[string]any)
	if !ok {
		t.Fatalf("expected sections object in weekly review payload, got %T", weekly["sections"])
	}
	waiting, ok := sections["waiting"].([]any)
	if !ok || len(waiting) == 0 {
		t.Fatalf("expected waiting section to contain at least one task, got %v", sections["waiting"])
	}
	overdueScheduled, ok := sections["overdueScheduled"].([]any)
	if !ok || len(overdueScheduled) == 0 {
		t.Fatalf("expected overdueScheduled section to contain at least one task, got %v", sections["overdueScheduled"])
	}

	count := mustInt64(t, weekly["count"])
	if count < 2 {
		t.Fatalf("expected weekly section count to include waiting + overdue scheduled tasks, got %d", count)
	}
}

func TestWeeklyReviewEndpointDeterministicOrdering(t *testing.T) {
	h := newAPIHarness(t)

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Ordering"})
	if status != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", status)
	}
	projectID := mustInt64(t, project["id"])

	waitingPayloads := []map[string]any{
		{"title": "Waiting A", "state": "waiting", "projectId": projectID},
		{"title": "Waiting B", "state": "waiting", "projectId": projectID},
	}
	somedayPayloads := []map[string]any{
		{"title": "Someday A", "state": "someday", "projectId": projectID},
		{"title": "Someday B", "state": "someday", "projectId": projectID},
	}
	scheduledPayloads := []map[string]any{
		{"title": "Scheduled later", "state": "scheduled", "projectId": projectID, "dueAt": "2020-01-02T00:00:00Z"},
		{"title": "Scheduled earlier", "state": "scheduled", "projectId": projectID, "dueAt": "2020-01-01T00:00:00Z"},
	}

	waitingIDs := make([]int64, 0, len(waitingPayloads))
	for _, payload := range waitingPayloads {
		status, created := h.jsonRequest(http.MethodPost, "/api/tasks", payload)
		if status != http.StatusCreated {
			t.Fatalf("create waiting task: expected 201, got %d", status)
		}
		waitingIDs = append(waitingIDs, mustInt64(t, created["id"]))
	}

	somedayIDs := make([]int64, 0, len(somedayPayloads))
	for _, payload := range somedayPayloads {
		status, created := h.jsonRequest(http.MethodPost, "/api/tasks", payload)
		if status != http.StatusCreated {
			t.Fatalf("create someday task: expected 201, got %d", status)
		}
		somedayIDs = append(somedayIDs, mustInt64(t, created["id"]))
	}

	scheduledIDs := make([]int64, 0, len(scheduledPayloads))
	for _, payload := range scheduledPayloads {
		status, created := h.jsonRequest(http.MethodPost, "/api/tasks", payload)
		if status != http.StatusCreated {
			t.Fatalf("create scheduled task: expected 201, got %d", status)
		}
		scheduledIDs = append(scheduledIDs, mustInt64(t, created["id"]))
	}

	status, weekly := h.jsonRequest(http.MethodGet, "/api/reviews/weekly?thresholdDays=0", nil)
	if status != http.StatusOK {
		t.Fatalf("weekly review: expected 200, got %d", status)
	}
	sections, ok := weekly["sections"].(map[string]any)
	if !ok {
		t.Fatalf("expected sections object in weekly review payload, got %T", weekly["sections"])
	}

	assertIDs := func(section string, want []int64) {
		t.Helper()
		rawItems, ok := sections[section].([]any)
		if !ok {
			t.Fatalf("expected %s section array, got %T", section, sections[section])
		}
		got := make([]int64, 0, len(rawItems))
		for _, raw := range rawItems {
			item, ok := raw.(map[string]any)
			if !ok {
				t.Fatalf("expected section item object, got %T", raw)
			}
			got = append(got, mustInt64(t, item["id"]))
		}
		if len(got) != len(want) {
			t.Fatalf("%s: expected %d items, got %d (%v)", section, len(want), len(got), got)
		}
		for i := range got {
			if got[i] != want[i] {
				t.Fatalf("%s: expected id order %v, got %v", section, want, got)
			}
		}
	}

	assertIDs("waiting", waitingIDs)
	assertIDs("someday", somedayIDs)
	assertIDs("overdueScheduled", []int64{scheduledIDs[1], scheduledIDs[0]})
}

func TestMetricsExposeWeeklyReviewAndBoardLaneFailureCounters(t *testing.T) {
	h := newAPIHarness(t)

	status, _ := h.jsonRequest(http.MethodGet, "/api/reviews/weekly?thresholdDays=bad", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for bad thresholdDays, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/reviews/weekly?thresholdDays=0", nil)
	if status != http.StatusOK {
		t.Fatalf("expected 200 for weekly review success, got %d", status)
	}

	status, _ = h.jsonRequest(http.MethodGet, "/api/boards?projectId=bad", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid boards projectId, got %d", status)
	}
	status, _ = h.jsonRequest(http.MethodGet, "/api/columns?boardId=bad", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid columns boardId, got %d", status)
	}
	status, _ = h.jsonRequest(http.MethodGet, "/api/tasks?state=bad", nil)
	if status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid tasks state, got %d", status)
	}

	status, metrics := h.textRequest(http.MethodGet, "/metrics")
	if status != http.StatusOK {
		t.Fatalf("metrics: expected 200, got %d", status)
	}

	for _, expected := range []string{
		"todo_app_weekly_review_requests_total 2",
		"todo_app_weekly_review_failures_total 1",
		"todo_app_weekly_review_duration_seconds_count 2",
		"todo_app_board_lane_fetch_failures_total{endpoint=\"/api/boards\"} 1",
		"todo_app_board_lane_fetch_failures_total{endpoint=\"/api/columns\"} 1",
		"todo_app_board_lane_fetch_failures_total{endpoint=\"/api/tasks\"} 1",
		"todo_app_weekly_review_duration_seconds_sum",
	} {
		if !strings.Contains(metrics, expected) {
			t.Fatalf("metrics response missing %q:\n%s", expected, metrics)
		}
	}
}
