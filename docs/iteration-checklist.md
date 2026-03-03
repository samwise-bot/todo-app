# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added a focused board-lane regression test that verifies rendering remains healthy when `/api/boards` returns `{ data: [...] }` while peer endpoints still return `{ items: [...] }` (`frontend/tests/board-lane-smoke.test.tsx`).
- [x] Re-ran backend test suite via `make test-backend`.

## Next Iteration (Priority Order)
- [ ] Document OpenAPI contract generator CLI usage in `docs/backend-testing.md`, including `-out-mutation`, `-out-read`, and local regeneration workflow.
- [ ] Add CI assertion that backend contract drift artifacts include both mutation and read generated test file paths when drift occurs.
- [ ] Add frontend telemetry/log marker for which endpoint returned malformed payloads to speed regression triage.
- [ ] Expand board-lane regression coverage to include mixed envelope fallbacks for `/api/columns` and `/api/tasks` in addition to `/api/boards`.
