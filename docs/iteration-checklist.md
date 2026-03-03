# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Hardened frontend collection parsing for board-lane dependencies so kanban lanes keep rendering with common API envelope shapes (`items`, `data`, `data.items`, `results`) while retaining malformed-payload safeguards.
- [x] Added frontend regression tests for resilient collection parsing + malformed fallback (`frontend/tests/api-client.test.ts`).

## Next Iteration (Priority Order)
- [ ] Document OpenAPI contract generator CLI usage in `docs/backend-testing.md`, including `-out-mutation`, `-out-read`, and local regeneration workflow.
- [ ] Add CI assertion that backend contract drift artifacts include both mutation and read generated test file paths when drift occurs.
- [ ] Add a focused integration test that verifies board-lane rendering still succeeds when one endpoint returns `{ data: [...] }` instead of `{ items: [...] }`.
- [ ] Add frontend telemetry/log marker for which endpoint returned malformed payloads to speed regression triage.
