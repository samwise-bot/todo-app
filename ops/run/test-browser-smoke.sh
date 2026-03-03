#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND_DIR="$ROOT/frontend"

"$ROOT/ops/run/install-frontend-deps.sh"
cd "$FRONTEND_DIR"
npm run test:smoke:install
npm run test:smoke
