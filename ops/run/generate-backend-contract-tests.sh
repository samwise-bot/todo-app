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

resolve_go_bin() {
  if [[ -n "${BACKEND_TEST_GO_BIN:-}" ]]; then
    if [[ -x "${BACKEND_TEST_GO_BIN}" ]]; then
      printf '%s\n' "${BACKEND_TEST_GO_BIN}"
      return 0
    fi
    echo "error: BACKEND_TEST_GO_BIN is set but not executable: ${BACKEND_TEST_GO_BIN}" >&2
    return 1
  fi

  if command -v go >/dev/null 2>&1; then
    command -v go
    return 0
  fi

  return 1
}

prepend_nix_go_bin_paths
GO_BIN="$(resolve_go_bin)" || {
  echo "error: could not find a usable Go binary for contract generation" >&2
  echo "hint: install Go, enter nix develop, or set BACKEND_TEST_GO_BIN=/path/to/go" >&2
  exit 1
}

(
  cd "$ROOT/backend"
  GOCACHE="${GOCACHE:-/tmp/go-build}" "$GO_BIN" run ./cmd/openapi-contract-test-gen \
    -in "$ROOT/docs/openapi/openapi.json" \
    -out-mutation "$ROOT/backend/tests/generated_openapi_mutation_contract_test.go" \
    -out-read "$ROOT/backend/tests/generated_openapi_read_contract_test.go"
)
