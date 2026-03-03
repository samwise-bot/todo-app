#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080}"
task_id=""

cleanup_task_to_done() {
  [[ -n "$task_id" ]] || return 0
  curl -sS -o /tmp/task-done-smoke-cleanup.json -w '%{http_code}' \
    -X PATCH "$API_BASE/api/tasks/$task_id/state" \
    -H 'Content-Type: application/json' \
    -d '{"state":"done"}' >/tmp/task-done-smoke-cleanup.code || true
}
trap cleanup_task_to_done EXIT

project_resp=$(curl -sS -X POST "$API_BASE/api/projects" -H 'Content-Type: application/json' -d '{"name":"Mutation Smoke Project"}')
project_id=$(echo "$project_resp" | sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p')

board_resp=$(curl -sS -X POST "$API_BASE/api/boards" -H 'Content-Type: application/json' -d "{\"projectId\":$project_id,\"name\":\"Mutation Smoke Board\"}")
board_id=$(echo "$board_resp" | sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p')

column_resp=$(curl -sS -X POST "$API_BASE/api/columns" -H 'Content-Type: application/json' -d "{\"boardId\":$board_id,\"name\":\"Mutation Smoke Column\",\"position\":10}")
column_id=$(echo "$column_resp" | sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p')

task_resp=$(curl -sS -X POST "$API_BASE/api/tasks" -H 'Content-Type: application/json' -d "{\"title\":\"Mutation smoke task\",\"projectId\":$project_id,\"state\":\"inbox\"}")
task_id=$(echo "$task_resp" | sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p')

[[ -n "$project_id" && -n "$board_id" && -n "$column_id" && -n "$task_id" ]] || {
  echo "failed to create setup resources" >&2
  exit 1
}

state_code=$(curl -sS -o /tmp/task-state-smoke.json -w '%{http_code}' -X PATCH "$API_BASE/api/tasks/$task_id/state" -H 'Content-Type: application/json' -d '{"state":"next"}')
[[ "$state_code" == "200" ]] || { echo "state mutation failed" >&2; cat /tmp/task-state-smoke.json; exit 1; }

column_code=$(curl -sS -o /tmp/task-column-smoke.json -w '%{http_code}' -X PATCH "$API_BASE/api/tasks/$task_id/board-column" -H 'Content-Type: application/json' -d "{\"boardColumnId\":$column_id}")
[[ "$column_code" == "200" ]] || { echo "board-column mutation failed" >&2; cat /tmp/task-column-smoke.json; exit 1; }

assignee_code=$(curl -sS -o /tmp/task-assignee-smoke.json -w '%{http_code}' -X PATCH "$API_BASE/api/tasks/$task_id/assignee" -H 'Content-Type: application/json' -d '{"assigneeId":null}')
[[ "$assignee_code" == "200" ]] || { echo "assignee mutation failed" >&2; cat /tmp/task-assignee-smoke.json; exit 1; }

done_code=$(curl -sS -o /tmp/task-done-smoke.json -w '%{http_code}' -X PATCH "$API_BASE/api/tasks/$task_id/state" -H 'Content-Type: application/json' -d '{"state":"done"}')
[[ "$done_code" == "200" ]] || { echo "done-state cleanup failed" >&2; cat /tmp/task-done-smoke.json; exit 1; }

echo "task mutation smoke passed (task_id=$task_id, cleanup_state=done)"
