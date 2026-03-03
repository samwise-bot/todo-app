package tests

import (
	"fmt"
	"net/http"
	"testing"
)

func TestReadContractPathParamEdgeCases(t *testing.T) {
	h := newAPIHarness(t)

	status, project := h.jsonRequest(http.MethodPost, "/api/projects", map[string]any{"name": "Edge Cases"})
	if status != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", status)
	}
	projectID := mustInt64(t, project["id"])

	status, board := h.jsonRequest(http.MethodPost, "/api/boards", map[string]any{
		"projectId": projectID,
		"name":      "Main Board",
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

	cases := []struct {
		name string
		path string
	}{
		{name: "get board invalid id token", path: "/api/boards/not-a-number"},
		{name: "get column invalid id token", path: "/api/columns/not-a-number"},
		{name: "get board invalid shape extra segment", path: fmt.Sprintf("/api/boards/%d/extra", boardID)},
		{name: "get column invalid shape extra segment", path: fmt.Sprintf("/api/columns/%d/extra", columnID)},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			status, _ := h.jsonRequest(http.MethodGet, tc.path, nil)
			if status != http.StatusNotFound {
				t.Fatalf("GET %s: expected 404, got %d", tc.path, status)
			}
		})
	}
}
