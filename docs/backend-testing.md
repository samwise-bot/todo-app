# Backend Test Runner Bootstrap

Use a single command path for both local and CI loops:

```bash
make test-backend-repro
```

What it does:
- If `go` exists locally, it generates backend OpenAPI contract tests and runs `go test ./...` in `backend/`.
- If `go` is missing but Docker is available and daemon access works, it runs the same flow in `golang:1.24`.
- If local execution is unavailable (for example: missing Go, missing Docker, or Docker daemon inaccessible), it attempts a remote GitHub Actions fallback (`backend-tests-remote.yml`) using GitHub CLI.

Direct script entrypoint:

```bash
./ops/run/test-backend.sh
```

This keeps backend test execution reproducible across developer machines and CI agents, even when this runtime has neither Go nor Docker.

## Remote Fallback (Local Execution Unavailable)

`./ops/run/test-backend.sh` automatically attempts remote execution when local backend tests cannot run (for example: no Go toolchain, no Docker, or Docker daemon not accessible).

Prerequisites:
- `gh` is installed and authenticated (`gh auth status` succeeds), or `GITHUB_TOKEN` is exported so the runner can authenticate `gh` non-interactively.
- Your target branch is pushed to origin (remote runners execute repository refs, not unpushed local commits).
- After dispatch, the script polls GitHub Actions with deterministic backoff for up to about 86 seconds to resolve the created run ID before failing.

Useful environment variables:
- `BACKEND_TEST_REMOTE_WORKFLOW`: workflow file/name to dispatch (default: `backend-tests-remote.yml`).
- `BACKEND_TEST_REMOTE_REF`: git ref to run remotely (default: current branch name).
- `BACKEND_TEST_FORCE_REMOTE=1`: skip local Go/Docker checks and run the remote fallback directly.
- `GITHUB_TOKEN`: optional token for automatic `gh auth login --with-token` when `gh` is not already authenticated.

Optional explicit command:

```bash
make test-backend-remote
```

This command forces remote mode with `BACKEND_TEST_FORCE_REMOTE=1`.

## Generated OpenAPI Mutation Contract Tests

Critical mutation endpoint contract tests are generated from `docs/openapi/openapi.json` into:

`backend/tests/generated_openapi_mutation_contract_test.go`

Regenerate manually with:

```bash
./ops/run/generate-backend-contract-tests.sh
```

`./ops/run/test-backend.sh` runs this generation step before `go test ./...`, and CI fails if the generated artifact is stale.

## OpenAPI Contract Generator CLI (Local Workflow)

The generator CLI supports separate outputs for mutation and read contracts:

```bash
cd backend
go run ./cmd/openapi-contract-test-gen \
  -in ../docs/openapi/openapi.json \
  -out-mutation ./tests/generated_openapi_mutation_contract_test.go \
  -out-read ./tests/generated_openapi_read_contract_test.go
```

Equivalent single-flag examples:

```bash
cd backend
go run ./cmd/openapi-contract-test-gen \
  -in ../docs/openapi/openapi.json \
  -out-mutation ./tests/generated_openapi_mutation_contract_test.go
```

```bash
cd backend
go run ./cmd/openapi-contract-test-gen \
  -in ../docs/openapi/openapi.json \
  -out-read ./tests/generated_openapi_read_contract_test.go
```

Before running tests or committing, regenerate and verify generated contracts locally:

```bash
make generate-backend-contract-tests
make test-backend
git diff --exit-code backend/tests/generated_openapi_mutation_contract_test.go backend/tests/generated_openapi_read_contract_test.go
```
