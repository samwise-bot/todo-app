#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

(
  cd "$ROOT/backend"
  GOCACHE="${GOCACHE:-/tmp/go-build}" go run ./cmd/openapi-contract-test-gen \
    -in "$ROOT/docs/openapi/openapi.json" \
    -out-mutation "$ROOT/backend/tests/generated_openapi_mutation_contract_test.go" \
    -out-read "$ROOT/backend/tests/generated_openapi_read_contract_test.go"
)
