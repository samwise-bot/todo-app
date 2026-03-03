# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added reproducible backend test runner/bootstrap via `./ops/run/test-backend.sh` + `make test-backend-repro`, with documentation in `docs/backend-testing.md`.
- [x] Published OpenAPI-style machine-readable contract source at `docs/openapi/openapi-source.json` and generated JSON artifact at `docs/openapi/openapi.json` via `./ops/run/generate-openapi.sh`.
- [x] Added frontend page-level rendering tests for board-lane empty/error states in `frontend/tests/board-lanes-rendering.test.tsx`.
- [x] Added weekly-review endpoint deterministic ordering tests for `waiting`, `someday`, and `overdueScheduled`.
- [x] Added observability counters/timers for weekly-review and board-lane fetch failures, exposed via `/metrics`, with backend coverage.
- [x] Enforced OpenAPI drift in CI via `.github/workflows/ci.yml` by regenerating and diff-checking `docs/openapi/openapi.json`.
- [x] Added backend integration test coverage for `/metrics` Prometheus text exposition format (HELP/TYPE/sample/label checks).
- [x] Added frontend page-level rendering coverage for non-empty board lanes with mixed assigned/unassigned tasks.

## Next Iteration (Priority Order)
- [ ] Add dashboard panels/alerts for the new weekly-review and board-lane failure metrics.
- [ ] Add CI caching/concurrency controls to reduce workflow runtime and duplicate runs.
- [ ] Add end-to-end smoke coverage for a full board-lane flow (create board/column/task, assign lane, verify UI/API parity).
- [ ] Add OpenAPI schema validation in CI (lint/validate `docs/openapi/openapi.json` against OpenAPI 3.0 rules).
