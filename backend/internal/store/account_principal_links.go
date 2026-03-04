package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/example/todo-app/backend/internal/domain"
)

func (s *SQLiteStore) LinkAccountPrincipal(ctx context.Context, accountID, principalID int64, role domain.AccountPrincipalRole, actorPrincipalID *int64) error {
	if !role.Valid() {
		return fmt.Errorf("invalid account principal role: %s", role)
	}

	var existingRole sql.NullString
	err := s.db.QueryRowContext(ctx, `SELECT role FROM account_principals WHERE account_id=? AND principal_id=?`, accountID, principalID).Scan(&existingRole)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO account_principals(account_id, principal_id, role, created_at)
		VALUES(?,?,?,?)
		ON CONFLICT(account_id, principal_id)
		DO UPDATE SET role=excluded.role
	`, accountID, principalID, role, now); err != nil {
		return err
	}

	payload, _ := json.Marshal(map[string]any{
		"previousRole": nullStringToPtr(existingRole),
		"nextRole":     role,
	})
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO account_principal_events(account_id, principal_id, actor_principal_id, event_type, payload, created_at)
		VALUES(?,?,?,?,?,?)
	`, accountID, principalID, actorPrincipalID, "account_principal.linked", string(payload), now)
	return err
}

func (s *SQLiteStore) CountAccountPrincipalEvents(ctx context.Context, accountID, principalID int64) (int64, error) {
	var n int64
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM account_principal_events WHERE account_id=? AND principal_id=?`, accountID, principalID).Scan(&n)
	return n, err
}

func nullStringToPtr(v sql.NullString) *string {
	if !v.Valid {
		return nil
	}
	out := v.String
	return &out
}
