#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

GO_BIN="${GO:-}"
if [ -z "$GO_BIN" ]; then
  GO_BIN="$(command -v go 2>/dev/null || true)"
fi
if [ -z "$GO_BIN" ] && [ -x "/home/bot/.nix-profile/bin/go" ]; then
  GO_BIN="/home/bot/.nix-profile/bin/go"
fi
if [ -z "$GO_BIN" ]; then
  echo "error: go binary not found (set GO or install go)" >&2
  exit 1
fi

(
  cd "$ROOT/backend"
  GOCACHE="${GOCACHE:-/tmp/go-build}" "$GO_BIN" run ./cmd/openapi-gen -in "$ROOT/docs/openapi/openapi-source.json" -out "$ROOT/docs/openapi/openapi.json"
)
