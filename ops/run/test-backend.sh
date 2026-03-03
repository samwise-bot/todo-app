#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT/backend"

if command -v go >/dev/null 2>&1; then
  "$ROOT/ops/run/generate-backend-contract-tests.sh"
  (
    cd "$BACKEND_DIR"
    GOCACHE="${GOCACHE:-/tmp/go-build}" go test ./...
  )
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "error: neither 'go' nor 'docker' is available to run backend tests" >&2
  exit 1
fi

docker run --rm \
  -v "$ROOT:/work" \
  -w /work/backend \
  golang:1.24 \
  bash -lc 'GOCACHE="${GOCACHE:-/tmp/go-build}" go run ./cmd/openapi-contract-test-gen -in /work/docs/openapi/openapi.json -out /work/backend/tests/generated_openapi_mutation_contract_test.go && go mod download && go test ./...'
