# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Expanded generated OpenAPI contract test coverage from critical mutations to selected read/list endpoints (`/api/tasks`, `/api/projects`, `/api/boards`, `/api/columns`, `/api/boards/{id}`), including merged path/operation query-parameter metadata and generated valid/invalid query assertion coverage.

## Next Iteration (Priority Order)
- [ ] Add frontend smoke preflight to skip redundant `npm ci` when lockfile hash + `node_modules` are already in sync while preserving deterministic install guarantees.
- [ ] Add CI artifact retention + summary links for telemetry/regression reports to speed triage on threshold failures.
- [ ] Split generated OpenAPI contract outputs into mutation/read files to reduce churn and improve test failure locality.
- [ ] Add read-contract coverage for additional path-param endpoints (`/api/columns/{id}` and `/api/boards/{id}` invalid-id/shape edge cases) with stricter query invalidation fixtures.
- [ ] Add `make test-backend-contracts` target that regenerates contract tests and verifies clean git diff in one command.
