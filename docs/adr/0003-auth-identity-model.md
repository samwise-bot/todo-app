# ADR 0003: Auth Identity Model (Single-user now, multi-user migration path)

- **Status:** Accepted
- **Date:** 2026-03-04
- **Deciders:** samwise
- **Related task:** #20

## Context
The TODO App is currently operated in single-user mode, but roadmap phases require explicit auth/account boundaries for assignment, audit, and eventual collaborator support.

## Decision
Adopt a two-layer identity model:

1. **Account**: login identity used for authentication/session management.
2. **Principal**: operational actor identity used for task ownership/audit (`human` or `agent`).

Single-user mode starts with one account (`ian`) linked 1:1 to one human principal.
Agent principals (for example `samwise`) remain first-class principals and can be linked to an account later, without changing task event schema.

## Data shape (v1)
- `accounts(id, email_or_handle, password_hash, status, created_at, updated_at)`
- `sessions(id, account_id, token_hash, expires_at, created_at, revoked_at, last_seen_at)`
- `account_principals(account_id, principal_id, role, created_at)`

`tasks.assignee_id` and `task_events.actor_principal_id` continue to reference `principals.id`.

## Consequences
### Positive
- Keeps task/audit domain stable while adding auth incrementally.
- Supports agent and human actors with one assignment/audit model.
- Enables migration to collaborator mode without breaking GTD workflows.

### Trade-offs
- Requires link-table joins (`account_principals`) on permission checks.
- Session revocation and role checks add backend complexity in Phase 3.

## Migration plan
1. Add auth tables behind feature flag (`AUTH_ENABLED=false` default).
2. Seed default single-user account linked to existing human principal.
3. Introduce login/logout and session middleware.
4. Gate mutation endpoints by account->principal role checks.
5. Remove feature flag once auth E2E matrix is green.
