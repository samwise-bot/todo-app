#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

(
  cd "$ROOT/backend"
  GOCACHE="${GOCACHE:-/tmp/go-build}" go run ./cmd/openapi-gen -in "$ROOT/docs/openapi/openapi-source.json" -out "$ROOT/docs/openapi/openapi.json"
)
