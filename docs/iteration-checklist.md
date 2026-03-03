# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added frontend dependency preflight installer (`ops/run/install-frontend-deps.sh`) that skips redundant `npm ci` when `frontend/node_modules` matches `frontend/package-lock.json` hash, while preserving deterministic lockfile-based installs.
- [x] Wired the preflight installer into browser smoke automation (`ops/run/test-browser-smoke.sh`) and CI jobs (`frontend-test`, `browser-smoke`) in `.github/workflows/ci.yml`.

## Next Iteration (Priority Order)
- [ ] Unblock backend test execution in this environment: install Go toolchain and/or restore GitHub Actions remote fallback auth so `./ops/run/test-backend.sh` can complete successfully.
- [ ] Add CI artifact retention + summary links for telemetry/regression reports to speed triage on threshold failures.
- [ ] Split generated OpenAPI contract outputs into mutation/read files to reduce churn and improve test failure locality.
- [ ] Add read-contract coverage for additional path-param endpoints (`/api/columns/{id}` and `/api/boards/{id}` invalid-id/shape edge cases) with stricter query invalidation fixtures.
- [ ] Add `make test-backend-contracts` target that regenerates contract tests and verifies clean git diff in one command.
