# Todo-App Iteration Checklist

## Completed This Run (March 3, 2026)
- [x] Added frontend integration tests for assignment actions (assign/unassign + validation failure states).
- [x] Added frontend integration tests for board and column actions (create/update/delete + validation failure states).
- [x] Re-ran frontend and backend test suites after changes.

## Next Iteration (Priority Order)
- [ ] Attach tasks to board columns from UI (`boardColumnId`) and render each board lane from real column/task relationships.
- [ ] Expand weekly review output into grouped sections (waiting, someday, overdue scheduled) and add threshold-boundary unit tests.
- [ ] Add pagination/filtering for tasks and principals to avoid loading full datasets on each render.
- [ ] Add OpenAPI-style machine-readable contract for current API surface.
- [ ] Add lightweight empty/error states for board lanes so missing data is explicit to the user.
