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
- [x] Added Prometheus alert rules and Grafana dashboard panels for weekly-review and board-lane failure observability metrics.
- [x] Added OpenAPI schema validation in CI for `docs/openapi/openapi.json` via deterministic pinned tooling (`swagger-cli@4.0.4`) with explicit OpenAPI `3.0.x` version enforcement.
- [x] Added CI caching + workflow concurrency controls to reduce duplicate runs and runtime (`actions/setup-go` module/build cache, npm cache, `cancel-in-progress` concurrency group).
- [x] Added end-to-end board-lane smoke coverage for create board/column/task + lane assignment with API/UI parity assertions in `frontend/tests/board-lane-smoke.test.tsx`.

## Next Iteration (Priority Order)
- [ ] Add a real browser-driven CI smoke test (backend + frontend process boot) to validate interactive board-lane actions beyond mocked fetch flows.
- [ ] Introduce backend API contract tests generated directly from `docs/openapi/openapi.json` for critical board/task mutation endpoints.
- [ ] Add CI runtime telemetry (per-job timing trend + cache hit visibility) and enforce regression thresholds.
