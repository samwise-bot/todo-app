# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added reproducible backend test runner/bootstrap via `./ops/run/test-backend.sh` + `make test-backend-repro`, with documentation in `docs/backend-testing.md`.
- [x] Published OpenAPI-style machine-readable contract source at `docs/openapi/openapi-source.json` and generated JSON artifact at `docs/openapi/openapi.json` via `./ops/run/generate-openapi.sh`.
- [x] Added frontend page-level rendering tests for board-lane empty/error states in `frontend/tests/board-lanes-rendering.test.tsx`.
- [x] Added weekly-review endpoint deterministic ordering tests for `waiting`, `someday`, and `overdueScheduled`.
- [x] Added observability counters/timers for weekly-review and board-lane fetch failures, exposed via `/metrics`, with backend coverage.

## Next Iteration (Priority Order)
- [ ] Validate and enforce OpenAPI contract drift in CI (fail build when generated JSON is stale).
- [ ] Add integration test coverage for `/metrics` text format parsing compatibility with Prometheus scrape expectations.
- [ ] Add frontend tests for non-empty board-lane rendering with mixed assigned/unassigned tasks in page markup.
- [ ] Add dashboard panels/alerts for the new weekly-review and board-lane failure metrics.
