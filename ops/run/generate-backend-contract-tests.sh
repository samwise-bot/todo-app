#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

prepend_nix_go_bin_paths() {
  local path_sep candidate current_path
  local -a candidates
  path_sep=":$PATH:"
  current_path="$PATH"

  IFS=':' read -r -a candidates <<<"${BACKEND_TEST_NIX_GO_BIN_CANDIDATES:-/home/bot/.nix-profile/bin:${HOME:-}/.nix-profile/bin:/nix/var/nix/profiles/default/bin}"

  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" ]] || continue
    [[ -d "$candidate" ]] || continue
    [[ -x "$candidate/go" ]] || continue

    if [[ "$path_sep" != *":$candidate:"* ]]; then
      current_path="$candidate:$current_path"
      path_sep=":$current_path:"
    fi
  done

  PATH="$current_path"
  export PATH
}

prepend_nix_go_bin_paths

(
  cd "$ROOT/backend"
  GOCACHE="${GOCACHE:-/tmp/go-build}" go run ./cmd/openapi-contract-test-gen \
    -in "$ROOT/docs/openapi/openapi.json" \
    -out-mutation "$ROOT/backend/tests/generated_openapi_mutation_contract_test.go" \
    -out-read "$ROOT/backend/tests/generated_openapi_read_contract_test.go"
)
