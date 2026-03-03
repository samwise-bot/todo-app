# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Split generated OpenAPI contract tests into separate files (`generated_openapi_mutation_contract_test.go`, `generated_openapi_read_contract_test.go`) and updated generator outputs to reduce diff churn and isolate failures.
- [x] Updated `ops/run/generate-backend-contract-tests.sh` to use the new `-out-mutation` / `-out-read` flags so backend test automation remains green.
- [x] Expanded read-contract edge-case coverage for path-param read endpoints (`/api/columns/{id}`, `/api/boards/{id}`) with invalid-id and invalid-shape scenarios.

## Next Iteration (Priority Order)
- [ ] Add `make test-backend-contracts` to regenerate OpenAPI contract tests and fail on dirty git diff in one command.
- [ ] Attach telemetry summary snippets to PR comments (or checks output) for at-a-glance regression triage without opening artifacts.
- [ ] Add generator CLI docs in `docs/backend-testing.md` for `-out-mutation` / `-out-read` usage and local regeneration workflow.
