package app

import (
	"encoding/json"
	"log"
	"net/http"
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
	mux.HandleFunc("/api/projects", s.handleProjects)
	mux.HandleFunc("/api/tasks", s.handleTasks)
	mux.HandleFunc("/api/tasks/", s.handleTaskState)
	return logging(mux)
}

func (s *Server) handleProjects(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListProjects(r.Context())
		if err != nil { writeErr(w, 500, err); return }
		writeJSON(w, 200, items)
	case http.MethodPost:
		var p domain.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil { writeErr(w, 400, err); return }
		if strings.TrimSpace(p.Name) == "" { writeJSON(w, 400, map[string]string{"error": "name is required"}); return }
		if err := s.store.CreateProject(r.Context(), &p); err != nil { writeErr(w, 500, err); return }
		writeJSON(w, 201, p)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		items, err := s.store.ListTasks(r.Context())
		if err != nil { writeErr(w, 500, err); return }
		writeJSON(w, 200, items)
	case http.MethodPost:
		var t domain.Task
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil { writeErr(w, 400, err); return }
		if strings.TrimSpace(t.Title) == "" { writeJSON(w, 400, map[string]string{"error": "title is required"}); return }
		if t.State == "" { t.State = domain.TaskStateInbox }
		if err := s.store.CreateTask(r.Context(), &t); err != nil { writeErr(w, 400, err); return }
		writeJSON(w, 201, t)
	default:
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
	}
}

func (s *Server) handleTaskState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch { writeJSON(w, 405, map[string]string{"error": "method not allowed"}); return }
	idRaw := strings.TrimPrefix(r.URL.Path, "/api/tasks/")
	parts := strings.Split(strings.Trim(idRaw, "/"), "/")
	if len(parts) != 2 || parts[1] != "state" { writeJSON(w, 404, map[string]string{"error": "not found"}); return }
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil { writeErr(w, 400, err); return }
	var body struct { State domain.TaskState `json:"state"`; ActorID *int64 `json:"actorId"` }
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { writeErr(w, 400, err); return }
	if !body.State.Valid() { writeJSON(w, 400, map[string]string{"error": "invalid state"}); return }
	if err := s.store.UpdateTaskState(r.Context(), id, body.State, body.ActorID); err != nil { writeErr(w, 400, err); return }
	writeJSON(w, 200, map[string]any{"ok": true})
}

func writeErr(w http.ResponseWriter, status int, err error) { writeJSON(w, status, map[string]string{"error": err.Error()}) }
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
