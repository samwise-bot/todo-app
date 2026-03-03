# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Added `make test-backend-contracts` to regenerate backend OpenAPI contract tests and fail on dirty git diff in one command.

## Next Iteration (Priority Order)
- [ ] Attach telemetry summary snippets to PR comments (or checks output) for at-a-glance regression triage without opening artifacts.
- [ ] Add generator CLI docs in `docs/backend-testing.md` for `-out-mutation` / `-out-read` usage and local regeneration workflow.
- [ ] Add a CI job step that runs `make test-backend-contracts` and uploads generated diff context on failure.
