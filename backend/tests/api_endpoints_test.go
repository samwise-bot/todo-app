package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
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

	status, list := h.jsonRequestArray(http.MethodGet, "/api/principals", nil)
	if status != http.StatusOK {
		t.Fatalf("expected 200 for list principals, got %d", status)
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

	status, tasks := h.jsonRequestArray(http.MethodGet, "/api/tasks", nil)
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

	status, tasks := h.jsonRequestArray(http.MethodGet, "/api/tasks", nil)
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

	status, weekly := h.jsonRequest(http.MethodGet, "/api/reviews/weekly?thresholdDays=0", nil)
	if status != http.StatusOK {
		t.Fatalf("weekly review: expected 200, got %d", status)
	}
	if mustInt64(t, weekly["thresholdDays"]) != 0 {
		t.Fatalf("expected thresholdDays=0, got %v", weekly["thresholdDays"])
	}
	count := mustInt64(t, weekly["count"])
	if count < 1 {
		t.Fatalf("expected at least one stale task, got %d", count)
	}
}
