#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$ROOT/frontend"

cd "$FRONTEND_DIR"
npm ci
npm run test:smoke:install
npm run test:smoke
