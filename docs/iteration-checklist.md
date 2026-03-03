# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Split generated OpenAPI contract tests into separate files (`generated_openapi_mutation_contract_test.go`, `generated_openapi_read_contract_test.go`) and updated generator outputs to reduce diff churn and isolate failures.

## Next Iteration (Priority Order)
- [ ] Expand read-contract coverage for path-param endpoint edge cases (`/api/columns/{id}`, `/api/boards/{id}` invalid-id/shape scenarios).
- [ ] Add `make test-backend-contracts` to regenerate OpenAPI contract tests and fail on dirty git diff in one command.
- [ ] Attach telemetry summary snippets to PR comments (or checks output) for at-a-glance regression triage without opening artifacts.
- [ ] Add generator CLI docs in `docs/backend-testing.md` for `-out-mutation` / `-out-read` usage and local regeneration workflow.
