package tests

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"
	"time"

	"github.com/example/todo-app/backend/internal/domain"
	"github.com/example/todo-app/backend/internal/store"
	_ "modernc.org/sqlite"
)

func TestLinkAccountPrincipalWritesAuditEvent(t *testing.T) {
	ctx := context.Background()
	dbPath := filepath.Join(t.TempDir(), "todo-test.db")
	s, err := store.NewSQLiteStore(dbPath)
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	defer s.Close()
	if err := s.Migrate(ctx); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()

	now := time.Now().UTC().Format(time.RFC3339)
	res, err := db.ExecContext(ctx, `INSERT INTO accounts(email, password_hash, status, created_at, updated_at) VALUES(?,?,?,?,?)`, "samwise@example.com", "hash", "active", now, now)
	if err != nil {
		t.Fatalf("insert account: %v", err)
	}
	accountID, _ := res.LastInsertId()

	p := &domain.Principal{Kind: domain.PrincipalAgent, Handle: "samwise-agent", DisplayName: "Samwise Agent"}
	if err := s.CreatePrincipal(ctx, p); err != nil {
		t.Fatalf("create principal: %v", err)
	}

	actorID := p.ID
	if err := s.LinkAccountPrincipal(ctx, accountID, p.ID, domain.RoleAgent, &actorID); err != nil {
		t.Fatalf("link account principal: %v", err)
	}

	events, err := s.CountAccountPrincipalEvents(ctx, accountID, p.ID)
	if err != nil {
		t.Fatalf("count events: %v", err)
	}
	if events != 1 {
		t.Fatalf("expected 1 audit event, got %d", events)
	}
}
