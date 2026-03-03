# Todo-App Iteration Checklist

## Completed This Iteration
- [x] Unblocked local `make test-backend-contracts` when `go` is not on PATH by adding Nix Go-bin fallback resolution in `ops/run/generate-backend-contract-tests.sh`.

## Next Iteration (Priority Order)
- [ ] Fix board-lane data loading regression in frontend (`Malformed data payloads` state) so kanban lanes render consistently.
- [ ] Document OpenAPI contract generator CLI usage in `docs/backend-testing.md`, including `-out-mutation`, `-out-read`, and local regeneration workflow.
- [ ] Add CI assertion that backend contract drift artifacts include both mutation and read generated test file paths when drift occurs.
