# Todo-App Iteration Checklist

## Next Iteration (Priority Order)
- [ ] Unblock backend test execution in this environment (Go toolchain missing): add a reproducible backend test runner (e.g., Docker/devcontainer or scripted toolchain bootstrap) and document the command path used in CI/local loops.
- [ ] Publish an OpenAPI-style machine-readable contract (source spec + generated JSON artifact) for current backend endpoints, including new pagination/filter query params for `/api/tasks` and `/api/principals`.
- [ ] Add frontend rendering tests for board-lane empty/error states (assert banner and fallback copy at page-level UI, not only view-model/unit tests).
- [ ] Add weekly-review endpoint tests for deterministic multi-item ordering inside each section (`waiting`, `someday`, `overdueScheduled`).
- [ ] Add basic observability counters/timers for weekly-review and board-lane fetch failures (and expose them via existing logging/metrics surface).
