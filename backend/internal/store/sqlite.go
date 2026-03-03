package store

import (
	"context"
	"database/sql"
	"encoding/json"
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
	entries, err := os.ReadDir(filepath.Join("backend", "migrations"))
	if err != nil {
		entries, err = os.ReadDir("migrations")
		if err != nil {
			return err
		}
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
		path := filepath.Join("backend", "migrations", name)
		b, err := os.ReadFile(path)
		if err != nil {
			b, err = os.ReadFile(filepath.Join("migrations", name))
			if err != nil {
				return err
			}
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
