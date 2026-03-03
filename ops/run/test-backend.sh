#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT/backend"

if command -v go >/dev/null 2>&1; then
  (
    cd "$BACKEND_DIR"
    go test ./...
  )
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "error: neither 'go' nor 'docker' is available to run backend tests" >&2
  exit 1
fi

docker run --rm \
  -v "$BACKEND_DIR:/src" \
  -w /src \
  golang:1.24 \
  bash -lc 'go mod download && go test ./...'
