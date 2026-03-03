# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added `make test-backend-contracts` to regenerate backend OpenAPI contract tests and fail on dirty git diff in one command.
- [x] Attach telemetry summary snippets to PR comments (or checks output) for at-a-glance regression triage without opening artifacts.
- [x] Add a CI step that runs `make test-backend-contracts` and uploads generated diff context on failure.

## Next Iteration (Priority Order)
- [ ] Unblock local `make test-backend-contracts` on hosts without `go` in PATH (align with `test-backend.sh` toolchain fallback behavior or document required PATH contract).
- [ ] Document generator CLI usage in `docs/backend-testing.md`, including `-out-mutation`, `-out-read`, and local regeneration workflow.
- [ ] Add a small CI assertion that the backend contract drift artifact includes both mutation and read test file paths when drift occurs.
