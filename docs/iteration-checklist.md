# Todo-App Iteration Checklist

## Next Iteration (Priority Order)
- [ ] Add pagination + server-side filtering for `/api/tasks` and `/api/principals`, then wire query-state controls in the frontend list views.
- [ ] Publish an OpenAPI-style machine-readable contract (source file + generated JSON) for current backend endpoints.
- [ ] Add frontend rendering tests for board-lane empty/error states (assert banner and fallback copy in page-level UI, not just view-model unit tests).
- [ ] Add weekly-review endpoint tests for multi-item ordering within each section to lock deterministic response ordering.
- [ ] Add basic observability counters/timers for weekly-review and board-lane fetch failures.
