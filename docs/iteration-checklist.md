# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added CI artifact retention (`retention-days: 14`) for all telemetry and regression-summary uploads in `.github/workflows/ci.yml`.
- [x] Added PR-visible telemetry regression triage summary in `ci-telemetry-regression` via `$GITHUB_STEP_SUMMARY`, including PASS/FAIL status and a link to the run artifacts page.

## Next Iteration (Priority Order)
- [ ] Split generated OpenAPI contract tests into mutation/read files to reduce diff churn and isolate failures.
- [ ] Expand read-contract coverage for path-param endpoint edge cases (`/api/columns/{id}`, `/api/boards/{id}` invalid-id/shape scenarios).
- [ ] Add `make test-backend-contracts` to regenerate contract tests and fail on dirty git diff in one command.
- [ ] Attach telemetry summary snippets to PR comments (or checks output) for at-a-glance regression triage without opening artifacts.
