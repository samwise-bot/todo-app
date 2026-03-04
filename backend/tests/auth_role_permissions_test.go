package tests

import (
	"testing"

	"github.com/example/todo-app/backend/internal/domain"
)

func TestAccountPrincipalRoleValid(t *testing.T) {
	for _, role := range []domain.AccountPrincipalRole{domain.RoleOwner, domain.RoleAgent, domain.RoleCollaborator} {
		if !role.Valid() {
			t.Fatalf("expected role %q to be valid", role)
		}
	}

	if domain.AccountPrincipalRole("invalid").Valid() {
		t.Fatal("expected unknown role to be invalid")
	}
}

func TestRoleHasPermissionMatrix(t *testing.T) {
	if !domain.RoleHasPermission(domain.RoleOwner, domain.PermissionManageUsers) {
		t.Fatal("owner should be able to manage users")
	}
	if domain.RoleHasPermission(domain.RoleAgent, domain.PermissionManageUsers) {
		t.Fatal("agent should not be able to manage users")
	}
	if !domain.RoleHasPermission(domain.RoleAgent, domain.PermissionWriteTasks) {
		t.Fatal("agent should be able to write tasks")
	}
	if !domain.RoleHasPermission(domain.RoleCollaborator, domain.PermissionReadTasks) {
		t.Fatal("collaborator should be able to read tasks")
	}
	if domain.RoleHasPermission(domain.AccountPrincipalRole("invalid"), domain.PermissionReadTasks) {
		t.Fatal("invalid role should have no permissions")
	}
}
