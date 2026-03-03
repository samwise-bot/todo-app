# Backend Test Runner Bootstrap

Use a single command path for both local and CI loops:

```bash
make test-backend-repro
```

What it does:
- If `go` exists locally, it runs `go test ./...` in `backend/`.
- If `go` is missing but Docker is available, it runs tests in `golang:1.24`.
- If both are missing, it exits with a clear error.

Direct script entrypoint:

```bash
./ops/run/test-backend.sh
```

This makes backend test execution reproducible across developer machines and CI agents without assuming a preinstalled Go toolchain.
