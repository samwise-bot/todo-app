package app

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/example/todo-app/backend/internal/domain"
	"github.com/example/todo-app/backend/internal/store"
)

type Server struct {
	store *store.SQLiteStore
}

func NewServer(s *store.SQLiteStore) *Server { return &Server{store: s} }

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]string{"ok": "true"}) })
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		n, _ := s.store.TaskEventCount(r.Context())
		_, _ = w.Write([]byte("todo_app_up 1\n"))
		_, _ = w.Write([]byte("todo_app_task_events_total " + strconv.FormatInt(n, 10) + "\n"))
	})
	mux.HandleFunc("/api/principals", s.handlePrincipals)
	mux.HandleFunc("/api/projects", s.handleProjects)
	mux.HandleFunc("/api/boards", s.handleBoards)
	mux.HandleFunc("/api/boards/", s.handleBoardByID)
	mux.HandleFunc("/api/columns", s.handleColumns)
	mux.HandleFunc("/api/columns/", s.handleColumnByID)
	mux.HandleFunc("/api/tasks", s.handleTasks)
	mux.HandleFunc("/api/tasks/", s.handleTaskMutation)
	return logging(mux)
}

var principalHandlePattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

func (s *Server) handlePrincipals(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListPrincipals(r.Context())
		if err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, items)
	case http.MethodPost:
		var p domain.Principal
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeErr(w, 400, err)
			return
		}
		p.Handle = strings.TrimSpace(p.Handle)
		p.DisplayName = strings.TrimSpace(p.DisplayName)
		if !p.Kind.Valid() {
			writeJSON(w, 400, map[string]string{"error": "invalid principal kind"})
			return
		}
		if p.Handle == "" || !principalHandlePattern.MatchString(p.Handle) {
			writeJSON(w, 400, map[string]string{"error": "handle is required and may only include letters, numbers, dot, underscore, or dash"})
			return
		}
		if p.DisplayName == "" {
			writeJSON(w, 400, map[string]string{"error": "displayName is required"})
			return
		}
		if err := s.store.CreatePrincipal(r.Context(), &p); err != nil {
			if isUniqueViolation(err) {
				writeJSON(w, 409, map[string]string{"error": "principal handle already exists"})
				return
			}
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 201, p)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleProjects(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListProjects(r.Context())
		if err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, items)
	case http.MethodPost:
		var p domain.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeErr(w, 400, err)
			return
		}
		if strings.TrimSpace(p.Name) == "" {
			writeJSON(w, 400, map[string]string{"error": "name is required"})
			return
		}
		if err := s.store.CreateProject(r.Context(), &p); err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 201, p)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListTasks(r.Context())
		if err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, items)
	case http.MethodPost:
		var t domain.Task
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			writeErr(w, 400, err)
			return
		}
		if strings.TrimSpace(t.Title) == "" {
			writeJSON(w, 400, map[string]string{"error": "title is required"})
			return
		}
		if t.State == "" {
			t.State = domain.TaskStateInbox
		}
		if err := s.store.CreateTask(r.Context(), &t); err != nil {
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 201, t)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleTaskMutation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	parts, id, ok := splitResourceID(r.URL.Path, "/api/tasks/")
	if !ok || len(parts) != 2 {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	switch parts[1] {
	case "state":
		s.handleTaskState(w, r, id)
	case "assignee":
		s.handleTaskAssignee(w, r, id)
	default:
		writeJSON(w, 404, map[string]string{"error": "not found"})
	}
}

func (s *Server) handleTaskState(w http.ResponseWriter, r *http.Request, id int64) {
	var body struct {
		State   domain.TaskState `json:"state"`
		ActorID *int64           `json:"actorId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, 400, err)
		return
	}
	if !body.State.Valid() {
		writeJSON(w, 400, map[string]string{"error": "invalid state"})
		return
	}
	if err := s.store.UpdateTaskState(r.Context(), id, body.State, body.ActorID); err != nil {
		writeErr(w, 400, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *Server) handleTaskAssignee(w http.ResponseWriter, r *http.Request, id int64) {
	var body struct {
		AssigneeID *int64 `json:"assigneeId"`
		ActorID    *int64 `json:"actorId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, 400, err)
		return
	}
	if err := s.store.UpdateTaskAssignee(r.Context(), id, body.AssigneeID, body.ActorID); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeJSON(w, 404, map[string]string{"error": "task not found"})
		case strings.Contains(err.Error(), "assignee principal does not exist"):
			writeJSON(w, 400, map[string]string{"error": err.Error()})
		default:
			writeErr(w, 400, err)
		}
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *Server) handleBoards(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		var projectID *int64
		if v := strings.TrimSpace(r.URL.Query().Get("projectId")); v != "" {
			id, err := strconv.ParseInt(v, 10, 64)
			if err != nil {
				writeJSON(w, 400, map[string]string{"error": "invalid projectId"})
				return
			}
			projectID = &id
		}
		items, err := s.store.ListBoards(r.Context(), projectID)
		if err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, items)
	case http.MethodPost:
		var b domain.Board
		if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
			writeErr(w, 400, err)
			return
		}
		b.Name = strings.TrimSpace(b.Name)
		if b.ProjectID <= 0 {
			writeJSON(w, 400, map[string]string{"error": "projectId is required"})
			return
		}
		if b.Name == "" {
			writeJSON(w, 400, map[string]string{"error": "name is required"})
			return
		}
		if err := s.store.CreateBoard(r.Context(), &b); err != nil {
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 201, b)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleBoardByID(w http.ResponseWriter, r *http.Request) {
	_, id, ok := splitResourceID(r.URL.Path, "/api/boards/")
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		item, err := s.store.GetBoard(r.Context(), id)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "board not found"})
				return
			}
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, item)
	case http.MethodPatch:
		item, err := s.store.GetBoard(r.Context(), id)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "board not found"})
				return
			}
			writeErr(w, 500, err)
			return
		}
		var body struct {
			ProjectID *int64  `json:"projectId"`
			Name      *string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeErr(w, 400, err)
			return
		}
		if body.ProjectID != nil {
			if *body.ProjectID <= 0 {
				writeJSON(w, 400, map[string]string{"error": "projectId must be positive"})
				return
			}
			item.ProjectID = *body.ProjectID
		}
		if body.Name != nil {
			item.Name = strings.TrimSpace(*body.Name)
			if item.Name == "" {
				writeJSON(w, 400, map[string]string{"error": "name is required"})
				return
			}
		}
		if err := s.store.UpdateBoard(r.Context(), item); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "board not found"})
				return
			}
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 200, item)
	case http.MethodDelete:
		if err := s.store.DeleteBoard(r.Context(), id); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "board not found"})
				return
			}
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 200, map[string]any{"ok": true})
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleColumns(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		var boardID *int64
		if v := strings.TrimSpace(r.URL.Query().Get("boardId")); v != "" {
			id, err := strconv.ParseInt(v, 10, 64)
			if err != nil {
				writeJSON(w, 400, map[string]string{"error": "invalid boardId"})
				return
			}
			boardID = &id
		}
		items, err := s.store.ListColumns(r.Context(), boardID)
		if err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, items)
	case http.MethodPost:
		var c domain.Column
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			writeErr(w, 400, err)
			return
		}
		c.Name = strings.TrimSpace(c.Name)
		if c.BoardID <= 0 {
			writeJSON(w, 400, map[string]string{"error": "boardId is required"})
			return
		}
		if c.Name == "" {
			writeJSON(w, 400, map[string]string{"error": "name is required"})
			return
		}
		if err := s.store.CreateColumn(r.Context(), &c); err != nil {
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 201, c)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleColumnByID(w http.ResponseWriter, r *http.Request) {
	_, id, ok := splitResourceID(r.URL.Path, "/api/columns/")
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		item, err := s.store.GetColumn(r.Context(), id)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "column not found"})
				return
			}
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, item)
	case http.MethodPatch:
		item, err := s.store.GetColumn(r.Context(), id)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "column not found"})
				return
			}
			writeErr(w, 500, err)
			return
		}
		var body struct {
			BoardID  *int64  `json:"boardId"`
			Name     *string `json:"name"`
			Position *int    `json:"position"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeErr(w, 400, err)
			return
		}
		if body.BoardID != nil {
			if *body.BoardID <= 0 {
				writeJSON(w, 400, map[string]string{"error": "boardId must be positive"})
				return
			}
			item.BoardID = *body.BoardID
		}
		if body.Name != nil {
			item.Name = strings.TrimSpace(*body.Name)
			if item.Name == "" {
				writeJSON(w, 400, map[string]string{"error": "name is required"})
				return
			}
		}
		if body.Position != nil {
			item.Position = *body.Position
		}
		if err := s.store.UpdateColumn(r.Context(), item); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "column not found"})
				return
			}
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 200, item)
	case http.MethodDelete:
		if err := s.store.DeleteColumn(r.Context(), id); err != nil {
			if errors.Is(err, store.ErrNotFound) {
				writeJSON(w, 404, map[string]string{"error": "column not found"})
				return
			}
			writeErr(w, 400, err)
			return
		}
		writeJSON(w, 200, map[string]any{"ok": true})
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func splitResourceID(path, prefix string) ([]string, int64, bool) {
	idRaw := strings.TrimPrefix(path, prefix)
	parts := strings.Split(strings.Trim(idRaw, "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		return nil, 0, false
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return nil, 0, false
	}
	return parts, id, true
}

func isUniqueViolation(err error) bool {
	return strings.Contains(strings.ToLower(err.Error()), "unique constraint")
}

func writeErr(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
