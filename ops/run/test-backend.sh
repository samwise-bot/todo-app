#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT/backend"
REMOTE_WORKFLOW="${BACKEND_TEST_REMOTE_WORKFLOW:-backend-tests-remote.yml}"
DEFAULT_REMOTE_REF="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
if [[ "$DEFAULT_REMOTE_REF" == "HEAD" ]]; then
  DEFAULT_REMOTE_REF="main"
fi
REMOTE_REF="${BACKEND_TEST_REMOTE_REF:-$DEFAULT_REMOTE_REF}"
FORCE_REMOTE="${BACKEND_TEST_FORCE_REMOTE:-0}"
RUN_ID_LOOKUP_DELAYS="${BACKEND_TEST_RUN_ID_LOOKUP_DELAYS:-0 2 3 5 8 13 21 34 55}"
RUN_TERMINAL_POLL_DELAYS="${BACKEND_TEST_RUN_TERMINAL_POLL_DELAYS:-0 2 3 5 8 13 21 34}"
SLEEP_BIN="${BACKEND_TEST_SLEEP_BIN:-sleep}"

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

ensure_gh_auth() {
  if gh auth status >/dev/null 2>&1; then
    return 0
  fi

  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    echo "GitHub CLI is unauthenticated; attempting non-interactive auth via GITHUB_TOKEN"
    if gh auth login --with-token >/dev/null 2>&1 <<<"$GITHUB_TOKEN"; then
      return 0
    fi
    echo "warning: failed to authenticate GitHub CLI using GITHUB_TOKEN" >&2
  fi

  return 1
}

run_remote_backend_tests() {
  if ! command -v gh >/dev/null 2>&1; then
    return 1
  fi

  if ! ensure_gh_auth; then
    echo "error: neither 'go' nor 'docker' is available, and GitHub CLI is not authenticated" >&2
    echo "hint: run 'gh auth login' or export GITHUB_TOKEN for non-interactive auth" >&2
    return 1
  fi

  local dispatch_time run_id delay run_query current_sha
  dispatch_time="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  current_sha="$(git -C "$ROOT" rev-parse "$REMOTE_REF" 2>/dev/null || true)"

  echo "go/docker unavailable; running backend tests remotely via GitHub Actions workflow '$REMOTE_WORKFLOW' on ref '$REMOTE_REF'"
  gh workflow run "$REMOTE_WORKFLOW" --ref "$REMOTE_REF"

  run_id=""
  # GitHub Actions dispatch is eventually consistent and queued runs can appear late.
  # Poll with deterministic backoff for >90s to resolve the dispatched run id.
  run_query="map(select(.createdAt >= \"$dispatch_time\" and .headBranch == \"$REMOTE_REF\""
  if [[ -n "$current_sha" ]]; then
    run_query="$run_query and .headSha == \"$current_sha\""
  fi
  run_query="$run_query)) | sort_by(.createdAt) | reverse | .[0].databaseId"

  for delay in $RUN_ID_LOOKUP_DELAYS; do
    if [[ "$delay" -gt 0 ]]; then
      "$SLEEP_BIN" "$delay"
    fi
    run_id="$(gh run list --workflow "$REMOTE_WORKFLOW" --event workflow_dispatch --limit 50 --json databaseId,createdAt,headBranch,headSha --jq "$run_query" 2>/dev/null || true)"
    if [[ -z "$run_id" || "$run_id" == "null" ]]; then
      run_id=""
      continue
    fi
    break
  done

  if [[ -z "$run_id" ]]; then
    echo "error: triggered '$REMOTE_WORKFLOW' but could not resolve its run id within polling window (started at $dispatch_time UTC)" >&2
    echo "hint: verify GitHub CLI auth, confirm ref '$REMOTE_REF' is pushed, then retry" >&2
    return 1
  fi

  echo "resolved remote backend test run id: $run_id"
  wait_for_remote_run_terminal "$run_id"
}

wait_for_remote_run_terminal() {
  local run_id="$1"
  local delay status conclusion run_url

  for delay in $RUN_TERMINAL_POLL_DELAYS; do
    if [[ "$delay" -gt 0 ]]; then
      "$SLEEP_BIN" "$delay"
    fi

    status="$(gh run view "$run_id" --json status --jq '.status' 2>/dev/null || true)"
    conclusion="$(gh run view "$run_id" --json conclusion --jq '.conclusion // ""' 2>/dev/null || true)"
    run_url="$(gh run view "$run_id" --json url --jq '.url // ""' 2>/dev/null || true)"

    if [[ "$status" != "completed" ]]; then
      continue
    fi

    if [[ -n "$run_url" ]]; then
      echo "remote backend workflow run url: $run_url"
    fi
    echo "remote backend workflow completed with conclusion '$conclusion'"

    case "$conclusion" in
      success|neutral|skipped)
        return 0
        ;;
      *)
        return 1
        ;;
    esac
  done

  echo "error: remote backend workflow run $run_id did not reach terminal state within polling window" >&2
  return 1
}

docker_daemon_accessible() {
  docker info >/dev/null 2>&1
}

prepend_nix_go_bin_paths

if [[ "$FORCE_REMOTE" != "1" ]] && command -v go >/dev/null 2>&1; then
  "$ROOT/ops/run/generate-backend-contract-tests.sh"
  (
    cd "$BACKEND_DIR"
    GOCACHE="${GOCACHE:-/tmp/go-build}" go test ./...
  )
  exit 0
fi

if [[ "$FORCE_REMOTE" != "1" ]] && command -v docker >/dev/null 2>&1; then
  if docker_daemon_accessible; then
    docker run --rm \
      -v "$ROOT:/work" \
      -w /work/backend \
      golang:1.24 \
      bash -lc 'GOCACHE="${GOCACHE:-/tmp/go-build}" go run ./cmd/openapi-contract-test-gen -in /work/docs/openapi/openapi.json -out /work/backend/tests/generated_openapi_mutation_contract_test.go && go mod download && go test ./...'
    exit 0
  fi

  echo "warning: docker CLI is installed but daemon is not accessible; falling back to remote backend tests" >&2
fi

if run_remote_backend_tests; then
  exit 0
fi

echo "error: backend tests could not run locally (missing Go or unavailable Docker daemon) and remote fallback was unavailable" >&2
echo "hint: install Go, ensure Docker daemon access, or authenticate GitHub CLI and push your branch for remote fallback" >&2
exit 1
