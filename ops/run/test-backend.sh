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

run_remote_backend_tests() {
  if ! command -v gh >/dev/null 2>&1; then
    return 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "error: neither 'go' nor 'docker' is available, and GitHub CLI is not authenticated" >&2
    return 1
  fi

  local dispatch_time gh_user run_id delay run_query
  dispatch_time="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  gh_user="$(gh api user --jq .login 2>/dev/null || true)"

  echo "go/docker unavailable; running backend tests remotely via GitHub Actions workflow '$REMOTE_WORKFLOW' on ref '$REMOTE_REF'"
  gh workflow run "$REMOTE_WORKFLOW" --ref "$REMOTE_REF"

  run_id=""
  # GitHub Actions dispatch is eventually consistent; poll with deterministic backoff
  # for about 60-90 seconds before failing.
  if [[ -n "$gh_user" ]]; then
    run_query="map(select(.createdAt >= \"$dispatch_time\" and .actor.login == \"$gh_user\")) | sort_by(.createdAt) | .[0].databaseId"
  else
    run_query="map(select(.createdAt >= \"$dispatch_time\")) | sort_by(.createdAt) | .[0].databaseId"
  fi

  for delay in 0 2 3 5 8 13 21 34; do
    if [[ "$delay" -gt 0 ]]; then
      sleep "$delay"
    fi
    run_id="$(gh run list --workflow "$REMOTE_WORKFLOW" --event workflow_dispatch --limit 50 --json databaseId,createdAt,actor --jq "$run_query" 2>/dev/null || true)"
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

  gh run watch "$run_id" --exit-status
}

docker_daemon_accessible() {
  docker info >/dev/null 2>&1
}

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
