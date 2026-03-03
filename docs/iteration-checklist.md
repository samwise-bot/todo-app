# Todo-App Iteration Checklist

## Status From Last Iteration (March 3, 2026)
- [x] Build frontend principals + assignment UI (create principal, assign/unassign task).
- [x] Build frontend board/column CRUD UI against new APIs.
- [x] Add backend tests for validation edge cases (invalid handles, bad IDs, missing required fields) across principals/boards/columns endpoints.
- [x] Add weekly-review endpoint scaffold (`GET /api/reviews/weekly`) with stale waiting/someday query.
- [x] Add frontend `lint` and `test` scripts plus minimal baseline test setup.
- [x] Add API docs examples for principals/boards/columns/reviews routes.

## Prioritized Next Iteration
- [x] Add optimistic/error UI feedback for all server actions (inline validation and API error surfacing).
- [x] Add frontend integration tests for assignment and board/column forms (happy-path and validation failures).
- [ ] Attach tasks to board columns from UI (set `boardColumnId`) and render board lanes from real column/task relationships.
- [ ] Expand weekly review output with grouped sections (waiting, someday, overdue scheduled) and unit tests for threshold boundaries.
- [ ] Add pagination/filtering for tasks and principals to avoid loading full datasets on each render.
- [ ] Add OpenAPI-style machine-readable contract for current API surface.
