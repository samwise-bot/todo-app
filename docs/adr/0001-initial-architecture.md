# ADR 0001: Initial architecture for GTD + Kanban v1

## Status
Accepted

## Context
We need a local-first task system usable by humans and OpenClaw agents with GTD semantics, Kanban visualization, and auditable assignment history.

## Decision
- Backend: Go HTTP API (`net/http`) with SQLite (`modernc.org/sqlite`) for zero-external runtime dependency.
- Frontend: Next.js App Router for quick local UX and future expansion.
- Data model centers around: `projects`, `tasks`, `task_events`, `principals`, `boards`, `columns`.
- GTD transition guardrails are enforced in backend domain logic (actionable states require `project_id`).
- Every state change writes an immutable event to `task_events`.
- Prometheus-compatible `/metrics` endpoint exposed by API process.

## Consequences
- Fast local bootstrap and simple deployment.
- Strong auditability from append-only event stream.
- Need follow-up work for auth and richer board interactions.
