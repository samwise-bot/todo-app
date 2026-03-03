#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SPEC_PATH="${1:-$ROOT/docs/openapi/openapi.json}"

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required for OpenAPI validation" >&2
  exit 1
fi

node -e '
const fs = require("fs");
const specPath = process.argv[1];
const doc = JSON.parse(fs.readFileSync(specPath, "utf8"));
if (typeof doc.openapi !== "string" || !doc.openapi.startsWith("3.0.")) {
  console.error(`error: expected OpenAPI 3.0.x document, got ${JSON.stringify(doc.openapi)}`);
  process.exit(1);
}
' "$SPEC_PATH"

npx --yes swagger-cli@4.0.4 validate "$SPEC_PATH"

echo "OpenAPI validation passed for $SPEC_PATH"
