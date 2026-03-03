# Todo-App Iteration Checklist

## Completed This Run (March 3, 2026)
- [x] Added frontend integration tests for assignment actions (assign/unassign + validation failure states).
- [x] Added frontend integration tests for board and column actions (create/update/delete + validation failure states).
- [x] Added task-to-board-column support in UI for create and update flows.
- [x] Switched board lane rendering to real board-column/task relationships, with explicit handling for tasks with no assigned column.
- [x] Added backend API/store tests and frontend action tests for board-column task assignment flows.
- [x] Re-ran frontend and backend test suites after changes.

## Next Iteration (Priority Order)
- [ ] Expand weekly review output into grouped sections (waiting, someday, overdue scheduled) and add threshold-boundary unit tests.
- [ ] Add lightweight empty/error states for board lanes so missing data is explicit to the user.
- [ ] Add pagination/filtering for tasks and principals to avoid loading full datasets on each render.
- [ ] Add OpenAPI-style machine-readable contract for current API surface.
