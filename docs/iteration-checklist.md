# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Documented OpenAPI contract generator CLI usage in `docs/backend-testing.md`, including `-out-mutation`, `-out-read`, and a local regeneration + verification workflow.
- [x] Re-ran backend test suite via `make test-backend`.

## Next Iteration (Priority Order)
- [ ] Add CI assertion that backend contract drift artifacts include both mutation and read generated test file paths when drift occurs.
- [ ] Add frontend telemetry/log marker for which endpoint returned malformed payloads to speed regression triage.
- [ ] Expand board-lane regression coverage to include mixed envelope fallbacks for `/api/columns` and `/api/tasks` in addition to `/api/boards`.
- [ ] Add a short troubleshooting note in `docs/backend-testing.md` for common generator failures (missing spec path, stale generated files, go module issues).
