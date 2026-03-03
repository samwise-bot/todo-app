package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/example/todo-app/backend/internal/domain"
	_ "modernc.org/sqlite"
)

type SQLiteStore struct {
	db *sql.DB
}

var ErrNotFound = errors.New("not found")

func NewSQLiteStore(dsn string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	return &SQLiteStore{db: db}, nil
}

func (s *SQLiteStore) Close() error { return s.db.Close() }

func (s *SQLiteStore) Migrate(ctx context.Context) error {
	candidates := []string{
		filepath.Join("backend", "migrations"),
		"migrations",
		filepath.Join("..", "migrations"),
	}
	var (
		entries       []os.DirEntry
		err           error
		migrationsDir string
	)
	for _, dir := range candidates {
		entries, err = os.ReadDir(dir)
		if err == nil {
			migrationsDir = dir
			break
		}
	}
	if migrationsDir == "" {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	if _, err := s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`); err != nil {
		return err
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		name := e.Name()
		var exists string
		err := s.db.QueryRowContext(ctx, `SELECT name FROM schema_migrations WHERE name=?`, name).Scan(&exists)
		if err == nil {
			continue
		}
		if err != sql.ErrNoRows {
			return err
		}
		b, err := os.ReadFile(filepath.Join(migrationsDir, name))
		if err != nil {
			return err
		}
		tx, err := s.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, string(b)); err != nil {
			tx.Rollback()
			return fmt.Errorf("migration %s: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations(name, applied_at) VALUES(?, ?)`, name, time.Now().UTC().Format(time.RFC3339)); err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

func (s *SQLiteStore) CreateProject(ctx context.Context, p *domain.Project) error {
	res, err := s.db.ExecContext(ctx, `INSERT INTO projects(name, description, created_at) VALUES(?,?,?)`, p.Name, p.Description, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	p.ID = id
	return nil
}

func (s *SQLiteStore) CreatePrincipal(ctx context.Context, p *domain.Principal) error {
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := s.db.ExecContext(ctx, `INSERT INTO principals(kind, handle, display_name, created_at) VALUES(?,?,?,?)`, p.Kind, p.Handle, p.DisplayName, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	p.ID = id
	p.CreatedAt, _ = time.Parse(time.RFC3339, now)
	return nil
}

func (s *SQLiteStore) ListPrincipals(ctx context.Context) ([]domain.Principal, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, kind, handle, display_name, created_at FROM principals ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Principal
	for rows.Next() {
		var p domain.Principal
		var created string
		if err := rows.Scan(&p.ID, &p.Kind, &p.Handle, &p.DisplayName, &created); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse(time.RFC3339, created)
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) PrincipalExists(ctx context.Context, id int64) (bool, error) {
	var exists int
	err := s.db.QueryRowContext(ctx, `SELECT 1 FROM principals WHERE id=?`, id).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func (s *SQLiteStore) ListProjects(ctx context.Context) ([]domain.Project, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, description, created_at FROM projects ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Project
	for rows.Next() {
		var p domain.Project
		var created string
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &created); err != nil {
			return nil, err
		}
		p.CreatedAt, _ = time.Parse(time.RFC3339, created)
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) CreateBoard(ctx context.Context, b *domain.Board) error {
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := s.db.ExecContext(ctx, `INSERT INTO boards(project_id, name, created_at) VALUES(?,?,?)`, b.ProjectID, b.Name, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	b.ID = id
	b.CreatedAt, _ = time.Parse(time.RFC3339, now)
	return nil
}

func (s *SQLiteStore) ListBoards(ctx context.Context, projectID *int64) ([]domain.Board, error) {
	query := `SELECT id, project_id, name, created_at FROM boards`
	args := []any{}
	if projectID != nil {
		query += ` WHERE project_id=?`
		args = append(args, *projectID)
	}
	query += ` ORDER BY id DESC`
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Board
	for rows.Next() {
		var b domain.Board
		var created string
		if err := rows.Scan(&b.ID, &b.ProjectID, &b.Name, &created); err != nil {
			return nil, err
		}
		b.CreatedAt, _ = time.Parse(time.RFC3339, created)
		out = append(out, b)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) GetBoard(ctx context.Context, id int64) (*domain.Board, error) {
	var b domain.Board
	var created string
	err := s.db.QueryRowContext(ctx, `SELECT id, project_id, name, created_at FROM boards WHERE id=?`, id).
		Scan(&b.ID, &b.ProjectID, &b.Name, &created)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	b.CreatedAt, _ = time.Parse(time.RFC3339, created)
	return &b, nil
}

func (s *SQLiteStore) UpdateBoard(ctx context.Context, b *domain.Board) error {
	res, err := s.db.ExecContext(ctx, `UPDATE boards SET project_id=?, name=? WHERE id=?`, b.ProjectID, b.Name, b.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *SQLiteStore) DeleteBoard(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM boards WHERE id=?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *SQLiteStore) CreateColumn(ctx context.Context, c *domain.Column) error {
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := s.db.ExecContext(ctx, `INSERT INTO columns(board_id, name, position, created_at) VALUES(?,?,?,?)`, c.BoardID, c.Name, c.Position, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	c.ID = id
	c.CreatedAt, _ = time.Parse(time.RFC3339, now)
	return nil
}

func (s *SQLiteStore) ListColumns(ctx context.Context, boardID *int64) ([]domain.Column, error) {
	query := `SELECT id, board_id, name, position, created_at FROM columns`
	args := []any{}
	if boardID != nil {
		query += ` WHERE board_id=?`
		args = append(args, *boardID)
	}
	query += ` ORDER BY position ASC, id ASC`
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Column
	for rows.Next() {
		var c domain.Column
		var created string
		if err := rows.Scan(&c.ID, &c.BoardID, &c.Name, &c.Position, &created); err != nil {
			return nil, err
		}
		c.CreatedAt, _ = time.Parse(time.RFC3339, created)
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) GetColumn(ctx context.Context, id int64) (*domain.Column, error) {
	var c domain.Column
	var created string
	err := s.db.QueryRowContext(ctx, `SELECT id, board_id, name, position, created_at FROM columns WHERE id=?`, id).
		Scan(&c.ID, &c.BoardID, &c.Name, &c.Position, &created)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	c.CreatedAt, _ = time.Parse(time.RFC3339, created)
	return &c, nil
}

func (s *SQLiteStore) UpdateColumn(ctx context.Context, c *domain.Column) error {
	res, err := s.db.ExecContext(ctx, `UPDATE columns SET board_id=?, name=?, position=? WHERE id=?`, c.BoardID, c.Name, c.Position, c.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *SQLiteStore) DeleteColumn(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM columns WHERE id=?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *SQLiteStore) CreateTask(ctx context.Context, t *domain.Task) error {
	if (t.State == domain.TaskStateNext || t.State == domain.TaskStateScheduled || t.State == domain.TaskStateWaiting) && t.ProjectID == nil {
		return fmt.Errorf("projectId is required for actionable tasks")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := s.db.ExecContext(ctx, `INSERT INTO tasks(title, description, state, project_id, assignee_id, board_column_id, due_at, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?)`,
		t.Title, t.Description, t.State, t.ProjectID, t.AssigneeID, t.BoardColumnID, nullableTime(t.DueAt), now, now)
	if err != nil {
		return err
	}
	id, _ := res.LastInsertId()
	t.ID = id
	return s.appendEvent(ctx, id, nil, "task.created", map[string]any{"state": t.State})
}

func nullableTime(t *time.Time) any {
	if t == nil {
		return nil
	}
	return t.UTC().Format(time.RFC3339)
}

func (s *SQLiteStore) ListTasks(ctx context.Context) ([]domain.Task, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, title, description, state, project_id, assignee_id, board_column_id, due_at, created_at, updated_at FROM tasks ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Task
	for rows.Next() {
		var t domain.Task
		var due, created, updated sql.NullString
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.State, &t.ProjectID, &t.AssigneeID, &t.BoardColumnID, &due, &created, &updated); err != nil {
			return nil, err
		}
		if due.Valid {
			d, _ := time.Parse(time.RFC3339, due.String)
			t.DueAt = &d
		}
		if created.Valid {
			t.CreatedAt, _ = time.Parse(time.RFC3339, created.String)
		}
		if updated.Valid {
			t.UpdatedAt, _ = time.Parse(time.RFC3339, updated.String)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) ListStaleTasksForWeeklyReview(ctx context.Context, olderThan time.Duration) ([]domain.Task, error) {
	if olderThan < 0 {
		olderThan = 0
	}
	cutoff := time.Now().UTC().Add(-olderThan).Format(time.RFC3339)
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, description, state, project_id, assignee_id, board_column_id, due_at, created_at, updated_at
		FROM tasks
		WHERE state IN (?, ?) AND updated_at <= ?
		ORDER BY updated_at ASC, id ASC
	`, domain.TaskStateWaiting, domain.TaskStateSomeday, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.Task
	for rows.Next() {
		var t domain.Task
		var due, created, updated sql.NullString
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.State, &t.ProjectID, &t.AssigneeID, &t.BoardColumnID, &due, &created, &updated); err != nil {
			return nil, err
		}
		if due.Valid {
			d, _ := time.Parse(time.RFC3339, due.String)
			t.DueAt = &d
		}
		if created.Valid {
			t.CreatedAt, _ = time.Parse(time.RFC3339, created.String)
		}
		if updated.Valid {
			t.UpdatedAt, _ = time.Parse(time.RFC3339, updated.String)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) UpdateTaskState(ctx context.Context, taskID int64, to domain.TaskState, actorID *int64) error {
	var cur domain.TaskState
	var projectID *int64
	if err := s.db.QueryRowContext(ctx, `SELECT state, project_id FROM tasks WHERE id=?`, taskID).Scan(&cur, &projectID); err != nil {
		return err
	}
	if !domain.TransitionAllowed(cur, to, projectID) {
		return fmt.Errorf("invalid transition %s -> %s", cur, to)
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE tasks SET state=?, updated_at=? WHERE id=?`, to, time.Now().UTC().Format(time.RFC3339), taskID); err != nil {
		return err
	}
	return s.appendEvent(ctx, taskID, actorID, "task.state.changed", map[string]any{"from": cur, "to": to})
}

func (s *SQLiteStore) UpdateTaskAssignee(ctx context.Context, taskID int64, assigneeID *int64, actorID *int64) error {
	var prev sql.NullInt64
	if err := s.db.QueryRowContext(ctx, `SELECT assignee_id FROM tasks WHERE id=?`, taskID).Scan(&prev); err != nil {
		if err == sql.ErrNoRows {
			return ErrNotFound
		}
		return err
	}
	var previous *int64
	if prev.Valid {
		previous = &prev.Int64
	}
	if assigneeID != nil {
		ok, err := s.PrincipalExists(ctx, *assigneeID)
		if err != nil {
			return err
		}
		if !ok {
			return fmt.Errorf("assignee principal does not exist")
		}
	}
	if _, err := s.db.ExecContext(ctx, `UPDATE tasks SET assignee_id=?, updated_at=? WHERE id=?`, assigneeID, time.Now().UTC().Format(time.RFC3339), taskID); err != nil {
		return err
	}
	return s.appendEvent(ctx, taskID, actorID, "task.assignee.changed", map[string]any{"from": previous, "to": assigneeID})
}

func (s *SQLiteStore) appendEvent(ctx context.Context, taskID int64, actorID *int64, event string, payload any) error {
	b, _ := json.Marshal(payload)
	_, err := s.db.ExecContext(ctx, `INSERT INTO task_events(task_id, actor_id, event_type, payload, created_at) VALUES(?,?,?,?,?)`, taskID, actorID, event, string(b), time.Now().UTC().Format(time.RFC3339))
	return err
}

func (s *SQLiteStore) TaskEventCount(ctx context.Context) (int64, error) {
	var n int64
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM task_events`).Scan(&n)
	return n, err
}

func (s *SQLiteStore) ListTaskEvents(ctx context.Context, taskID int64) ([]domain.TaskEvent, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, task_id, actor_id, event_type, payload, created_at FROM task_events WHERE task_id=? ORDER BY id ASC`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []domain.TaskEvent
	for rows.Next() {
		var e domain.TaskEvent
		var created string
		if err := rows.Scan(&e.ID, &e.TaskID, &e.ActorID, &e.EventType, &e.Payload, &created); err != nil {
			return nil, err
		}
		e.CreatedAt, _ = time.Parse(time.RFC3339, created)
		out = append(out, e)
	}
	return out, rows.Err()
}
