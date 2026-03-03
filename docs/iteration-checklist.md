# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added frontend dependency preflight installer (`ops/run/install-frontend-deps.sh`) that skips redundant `npm ci` when `frontend/node_modules` matches `frontend/package-lock.json` hash, while preserving deterministic lockfile-based installs.
- [x] Wired the preflight installer into browser smoke automation (`ops/run/test-browser-smoke.sh`) and CI jobs (`frontend-test`, `browser-smoke`) in `.github/workflows/ci.yml`.

## Next Iteration (Priority Order)
- [x] Unblock backend test execution in this environment by bootstrapping common Nix Go profile paths before local `go`/`docker` detection in `./ops/run/test-backend.sh`.
- [ ] Publish CI telemetry/regression artifacts with retention and PR summary links to speed threshold-failure triage.
- [ ] Split generated OpenAPI contract test outputs into mutation/read files to reduce diff churn and improve failure locality.
- [ ] Expand read-contract coverage for additional path-param endpoints (`/api/columns/{id}` and `/api/boards/{id}` invalid-id/shape edge cases) with stricter query invalidation fixtures.
- [ ] Add `make test-backend-contracts` to regenerate contract tests and fail on non-clean git diff in one command.
