#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$ROOT/frontend"
LOCKFILE="$FRONTEND_DIR/package-lock.json"
NODE_MODULES_DIR="$FRONTEND_DIR/node_modules"
MARKER_FILE="$NODE_MODULES_DIR/.package-lock.sha256"

current_hash="$(sha256sum "$LOCKFILE" | awk '{print $1}')"

if [ -d "$NODE_MODULES_DIR" ] && [ -f "$MARKER_FILE" ]; then
  stored_hash="$(tr -d '[:space:]' < "$MARKER_FILE")"
  if [ "$stored_hash" = "$current_hash" ]; then
    echo "Skipping npm ci: frontend/node_modules is in sync with frontend/package-lock.json"
    exit 0
  fi
fi

cd "$FRONTEND_DIR"
npm ci
printf '%s\n' "$current_hash" > "$MARKER_FILE"
