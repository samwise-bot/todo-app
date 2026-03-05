package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/example/todo-app/backend/internal/domain"
	"github.com/example/todo-app/backend/internal/store"
)

type Server struct {
	store   *store.SQLiteStore
	metrics *metricsRegistry
}

func NewServer(s *store.SQLiteStore) *Server {
	return &Server{
		store:   s,
		metrics: newMetricsRegistry(),
	}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, 200, map[string]string{"ok": "true"}) })
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		n, _ := s.store.TaskEventCount(r.Context())
		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		_, _ = w.Write([]byte("# HELP todo_app_up Service health status.\n"))
		_, _ = w.Write([]byte("# TYPE todo_app_up gauge\n"))
		_, _ = w.Write([]byte("todo_app_up 1\n"))
		_, _ = w.Write([]byte("# HELP todo_app_task_events_total Total stored task events.\n"))
		_, _ = w.Write([]byte("# TYPE todo_app_task_events_total gauge\n"))
		_, _ = w.Write([]byte("todo_app_task_events_total " + strconv.FormatInt(n, 10) + "\n"))
		_, _ = w.Write([]byte(s.metrics.RenderPrometheus()))
	})
	mux.HandleFunc("/api/principals", s.handlePrincipals)
	mux.HandleFunc("/api/projects", s.handleProjects)
	mux.HandleFunc("/api/boards", s.handleBoards)
	mux.HandleFunc("/api/boards/", s.handleBoardByID)
	mux.HandleFunc("/api/columns", s.handleColumns)
	mux.HandleFunc("/api/columns/", s.handleColumnByID)
	mux.HandleFunc("/api/reviews/weekly", s.handleWeeklyReview)
	mux.HandleFunc("/api/tasks", s.handleTasks)
	mux.HandleFunc("/api/tasks/", s.handleTaskMutation)
	return logging(mux)
}

var principalHandlePattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

const (
	defaultPageSize = 20
	maxPageSize     = 100
)

type paginatedResponse[T any] struct {
	Items      []T   `json:"items"`
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalItems int64 `json:"totalItems"`
	TotalPages int   `json:"totalPages"`
}

func (s *Server) handlePrincipals(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		opts, err := parseListPrincipalsOptions(r)
		if err != nil {
			writeJSON(w, 400, map[string]string{"error": err.Error()})
			return
		}
		result, err := s.store.ListPrincipals(r.Context(), opts)
		if err != nil {
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, newPaginatedResponse(result.Items, result.Total, opts.Page, opts.PageSize))
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
		opts, err := parseListTaskOptions(r)
		if err != nil {
			s.metrics.IncBoardLaneFetchFailure("/api/tasks")
			writeJSON(w, 400, map[string]string{"error": err.Error()})
			return
		}
		result, err := s.store.ListTasks(r.Context(), opts)
		if err != nil {
			s.metrics.IncBoardLaneFetchFailure("/api/tasks")
			writeErr(w, 500, err)
			return
		}
		writeJSON(w, 200, newPaginatedResponse(result.Items, result.Total, opts.Page, opts.PageSize))
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
		if t.Priority == 0 {
			t.Priority = 3
		}
		if t.Priority < 1 || t.Priority > 5 {
			writeJSON(w, 400, map[string]string{"error": "priority must be between 1 and 5"})
			return
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
	parts, id, ok := splitResourceID(r.URL.Path, "/api/tasks/")
	if !ok {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodPatch:
			s.handleTaskUpdate(w, r, id)
		case http.MethodDelete:
			s.handleTaskDelete(w, r, id)
		default:
			writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		}
		return
	}
	if r.Method != http.MethodPatch || len(parts) != 2 {
		writeJSON(w, 404, map[string]string{"error": "not found"})
		return
	}
	switch parts[1] {
	case "state":
		s.handleTaskState(w, r, id)
	case "assignee":
		s.handleTaskAssignee(w, r, id)
	case "board-column":
		s.handleTaskBoardColumn(w, r, id)
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

func (s *Server) handleTaskBoardColumn(w http.ResponseWriter, r *http.Request, id int64) {
	var body struct {
		BoardColumnID *int64 `json:"boardColumnId"`
		ActorID       *int64 `json:"actorId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, 400, err)
		return
	}
	if err := s.store.UpdateTaskBoardColumn(r.Context(), id, body.BoardColumnID, body.ActorID); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeJSON(w, 404, map[string]string{"error": "task not found"})
		case strings.Contains(err.Error(), "board column does not exist"):
			writeJSON(w, 400, map[string]string{"error": err.Error()})
		default:
			writeErr(w, 400, err)
		}
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *Server) handleTaskUpdate(w http.ResponseWriter, r *http.Request, id int64) {
	var body struct {
		Title       *string    `json:"title"`
		Description *string    `json:"description"`
		ProjectID   *int64     `json:"projectId"`
		Priority    *int       `json:"priority"`
		DueAt       *time.Time `json:"dueAt"`
		ActorID     *int64     `json:"actorId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, 400, err)
		return
	}
	if body.Title == nil {
		writeJSON(w, 400, map[string]string{"error": "title is required"})
		return
	}
	title := strings.TrimSpace(*body.Title)
	if title == "" {
		writeJSON(w, 400, map[string]string{"error": "title is required"})
		return
	}
	description := ""
	if body.Description != nil {
		description = strings.TrimSpace(*body.Description)
	}
	priority := 3
	if body.Priority != nil {
		priority = *body.Priority
	}
	if err := s.store.UpdateTaskFields(r.Context(), id, title, description, body.ProjectID, priority, body.DueAt, body.ActorID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeJSON(w, 404, map[string]string{"error": "task not found"})
			return
		}
		writeErr(w, 400, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *Server) handleTaskDelete(w http.ResponseWriter, r *http.Request, id int64) {
	if err := s.store.DeleteTask(r.Context(), id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeJSON(w, 404, map[string]string{"error": "task not found"})
			return
		}
		writeErr(w, 400, err)
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
				s.metrics.IncBoardLaneFetchFailure("/api/boards")
				writeJSON(w, 400, map[string]string{"error": "invalid projectId"})
				return
			}
			projectID = &id
		}
		items, err := s.store.ListBoards(r.Context(), projectID)
		if err != nil {
			s.metrics.IncBoardLaneFetchFailure("/api/boards")
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
	parts, id, ok := splitResourceID(r.URL.Path, "/api/boards/")
	if !ok || len(parts) != 1 {
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
				s.metrics.IncBoardLaneFetchFailure("/api/columns")
				writeJSON(w, 400, map[string]string{"error": "invalid boardId"})
				return
			}
			boardID = &id
		}
		items, err := s.store.ListColumns(r.Context(), boardID)
		if err != nil {
			s.metrics.IncBoardLaneFetchFailure("/api/columns")
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
	parts, id, ok := splitResourceID(r.URL.Path, "/api/columns/")
	if !ok || len(parts) != 1 {
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

func (s *Server) handleWeeklyReview(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	defer func() {
		s.metrics.ObserveWeeklyReviewDuration(time.Since(start))
	}()
	s.metrics.IncWeeklyReviewRequests()

	if r.Method != http.MethodGet {
		s.metrics.IncWeeklyReviewFailures()
		writeJSON(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	thresholdDays := int64(14)
	if v := strings.TrimSpace(r.URL.Query().Get("thresholdDays")); v != "" {
		n, err := strconv.ParseInt(v, 10, 64)
		if err != nil || n < 0 {
			s.metrics.IncWeeklyReviewFailures()
			writeJSON(w, 400, map[string]string{"error": "thresholdDays must be a non-negative integer"})
			return
		}
		thresholdDays = n
	}
	result, err := s.store.ListTasks(r.Context(), store.ListTasksOptions{
		Page:     1,
		PageSize: 1000000,
	})
	if err != nil {
		s.metrics.IncWeeklyReviewFailures()
		writeErr(w, 500, err)
		return
	}
	groups, staleTasks := buildWeeklyReviewGroups(result.Items, time.Now().UTC(), thresholdDays)
	count := len(groups.Waiting) + len(groups.Someday) + len(groups.OverdueScheduled)
	writeJSON(w, 200, map[string]any{
		"thresholdDays": thresholdDays,
		"sections": map[string]any{
			"waiting":          groups.Waiting,
			"someday":          groups.Someday,
			"overdueScheduled": groups.OverdueScheduled,
		},
		"staleTasks": staleTasks,
		"count":      count,
	})
}

type weeklyReviewGroups struct {
	Waiting          []domain.Task
	Someday          []domain.Task
	OverdueScheduled []domain.Task
}

func buildWeeklyReviewGroups(tasks []domain.Task, now time.Time, thresholdDays int64) (weeklyReviewGroups, []domain.Task) {
	if thresholdDays < 0 {
		thresholdDays = 0
	}
	cutoff := now.UTC().Add(-time.Duration(thresholdDays) * 24 * time.Hour)

	var groups weeklyReviewGroups
	for _, task := range tasks {
		switch task.State {
		case domain.TaskStateWaiting:
			if !task.UpdatedAt.After(cutoff) {
				groups.Waiting = append(groups.Waiting, task)
			}
		case domain.TaskStateSomeday:
			if !task.UpdatedAt.After(cutoff) {
				groups.Someday = append(groups.Someday, task)
			}
		case domain.TaskStateScheduled:
			if task.DueAt != nil && task.DueAt.UTC().Before(now.UTC()) {
				groups.OverdueScheduled = append(groups.OverdueScheduled, task)
			}
		}
	}

	sort.Slice(groups.Waiting, func(i, j int) bool {
		return taskUpdatedAtLess(groups.Waiting[i], groups.Waiting[j])
	})
	sort.Slice(groups.Someday, func(i, j int) bool {
		return taskUpdatedAtLess(groups.Someday[i], groups.Someday[j])
	})
	sort.Slice(groups.OverdueScheduled, func(i, j int) bool {
		left, right := groups.OverdueScheduled[i], groups.OverdueScheduled[j]
		if left.DueAt != nil && right.DueAt != nil && !left.DueAt.Equal(*right.DueAt) {
			return left.DueAt.Before(*right.DueAt)
		}
		return left.ID < right.ID
	})

	staleTasks := append([]domain.Task{}, groups.Waiting...)
	staleTasks = append(staleTasks, groups.Someday...)
	sort.Slice(staleTasks, func(i, j int) bool {
		return taskUpdatedAtLess(staleTasks[i], staleTasks[j])
	})

	return groups, staleTasks
}

func taskUpdatedAtLess(left, right domain.Task) bool {
	if !left.UpdatedAt.Equal(right.UpdatedAt) {
		return left.UpdatedAt.Before(right.UpdatedAt)
	}
	return left.ID < right.ID
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

func parseListPrincipalsOptions(r *http.Request) (store.ListPrincipalsOptions, error) {
	page, pageSize, err := parsePagination(r)
	if err != nil {
		return store.ListPrincipalsOptions{}, err
	}
	opts := store.ListPrincipalsOptions{
		Page:     page,
		PageSize: pageSize,
		Query:    strings.TrimSpace(r.URL.Query().Get("q")),
	}
	if rawKind := strings.TrimSpace(r.URL.Query().Get("kind")); rawKind != "" {
		kind := domain.PrincipalType(rawKind)
		if !kind.Valid() {
			return store.ListPrincipalsOptions{}, errors.New("kind must be one of: human, agent")
		}
		opts.Kind = &kind
	}
	return opts, nil
}

func parseListTaskOptions(r *http.Request) (store.ListTasksOptions, error) {
	page, pageSize, err := parsePagination(r)
	if err != nil {
		return store.ListTasksOptions{}, err
	}
	opts := store.ListTasksOptions{
		Page:     page,
		PageSize: pageSize,
		Query:    strings.TrimSpace(r.URL.Query().Get("q")),
	}
	if rawState := strings.TrimSpace(r.URL.Query().Get("state")); rawState != "" {
		state := domain.TaskState(rawState)
		if !state.Valid() {
			return store.ListTasksOptions{}, errors.New("state is invalid")
		}
		opts.State = &state
	}
	if rawProjectID := strings.TrimSpace(r.URL.Query().Get("projectId")); rawProjectID != "" {
		id, err := parsePositiveInt64(rawProjectID, "projectId")
		if err != nil {
			return store.ListTasksOptions{}, err
		}
		opts.ProjectID = &id
	}
	if rawAssigneeID := strings.TrimSpace(r.URL.Query().Get("assigneeId")); rawAssigneeID != "" {
		id, err := parsePositiveInt64(rawAssigneeID, "assigneeId")
		if err != nil {
			return store.ListTasksOptions{}, err
		}
		opts.AssigneeID = &id
	}
	if rawBoardColumnID := strings.TrimSpace(r.URL.Query().Get("boardColumnId")); rawBoardColumnID != "" {
		id, err := parsePositiveInt64(rawBoardColumnID, "boardColumnId")
		if err != nil {
			return store.ListTasksOptions{}, err
		}
		opts.BoardColumnID = &id
	}
	return opts, nil
}

func parsePagination(r *http.Request) (int, int, error) {
	page := 1
	if rawPage := strings.TrimSpace(r.URL.Query().Get("page")); rawPage != "" {
		n, err := strconv.Atoi(rawPage)
		if err != nil || n <= 0 {
			return 0, 0, errors.New("page must be a positive integer")
		}
		page = n
	}
	pageSize := defaultPageSize
	if rawPageSize := strings.TrimSpace(r.URL.Query().Get("pageSize")); rawPageSize != "" {
		n, err := strconv.Atoi(rawPageSize)
		if err != nil || n <= 0 || n > maxPageSize {
			return 0, 0, errors.New("pageSize must be between 1 and 100")
		}
		pageSize = n
	}
	return page, pageSize, nil
}

func parsePositiveInt64(raw string, field string) (int64, error) {
	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || n <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", field)
	}
	return n, nil
}

func newPaginatedResponse[T any](items []T, total int64, page int, pageSize int) paginatedResponse[T] {
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	if items == nil {
		items = make([]T, 0)
	}
	return paginatedResponse[T]{
		Items:      items,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: total,
		TotalPages: totalPages,
	}
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
