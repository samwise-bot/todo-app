# Roadmap

## Phase 0 - Foundations
- Repo scaffold, docs, CI baseline
- Acceptance: clean lint/test skeleton passes

## Phase 1 - Backend Core (Go + SQLite)
- Schema migrations: principals, projects, tasks, task_events, boards, columns
- REST API + validation + tests
- Acceptance: API tests green; GTD state machine enforced

## Phase 2 - Frontend Core (Next.js)
- Inbox, Next Actions, Projects, Contexts, Weekly Review, Kanban board
- Planned migration slices:
  1. Route shell split (`/board`, `/tasks`, `/projects`, `/people`, `/settings`) with persistent nav and stable server-action parity.
  2. Shared client state/cache layer for tasks, projects, boards, columns, principals with deterministic selectors.
  3. Data fetching policy: stale-while-revalidate reads + optimistic mutation rollback for lane/task operations.
  4. Progressive extraction of monolithic dashboard sections into route-local modules while preserving GTD state constraints.
- Acceptance:
  - end-to-end create->clarify->organize->execute flow works on `/board`
  - route split pages render with API-backed data (no static placeholders)
  - deterministic `Next` ordering preserved across refresh/navigation

## Phase 3 - Assignment + Agent Ops
- Human/agent principal directory
- Assignment UI/API and activity feed
- Acceptance: task assignment visible + auditable

## Phase 4 - Observability + Hardening
- /metrics, dashboards, alert rules
- Acceptance: key SLO metrics exported and scrapeable
- Current artifacts:
  - `ops/prometheus/alerts.yml` for weekly-review failure-rate/latency and board-lane fetch-failure alerting
  - `ops/grafana/todo-app-observability.json` for weekly-review and board-lane metric panels

## Phase 5 - v1 Handoff
- docs/handoff/v1.md, known limitations, ops runbook

## Current Iteration Status (2026-03-03)
- ✅ Completed: task #27 moved `Next -> In Progress -> Done` via frontend intake upgrade for `priority` + `dueAt` fields in task create flow.
- ✅ Completed: task #33 moved `Next -> In Progress -> Done` after cleaning lingering mutation-smoke residue.
- ✅ Completed: hardened `ops/run/check-task-mutations.sh` with EXIT-trap cleanup to force synthetic smoke tasks to `done` even on interrupted/error exits.
- ✅ Completed: revalidated principal/project/board/column prerequisites for TODO App (`samwise`, `TODO App`, canonical GTD board columns).
- ✅ Completed: task #4 moved `Next -> In Progress -> Done`; added frontend API-client regression tests for mixed envelope compatibility (`results.items`) and array-based paged fallback normalization.
- 🚧 Blocked: task #34 remains in **Blocked** pending one run with real worker outcome capture proving acceptable timeout ratio.
- ✅ Completed: task #41 moved `Next -> In Progress -> Done` with a board-first navigation slice (`/board` plus scaffold pages for `/tasks|/projects|/people|/settings`).
- ✅ Completed: task #42 moved `Next -> In Progress -> Done` with inline board-lane task creation forms (column-local quick add in `/board`).
- ✅ Completed: route-split extraction increment on `/projects` (real API-backed project list + coverage) aligned to task #41 scope.
- ✅ Completed: task #47 moved `Next -> In Progress -> Done` with `/board` default focus for active work assigned to Samwise.
- ✅ Completed: task #12 moved `Next -> In Progress -> Done` by expanding the SPA migration plan into phased deliverables with explicit acceptance criteria.
- ✅ Completed: task #13 moved `Next -> In Progress -> Done` with initial board inspector slice (`Board health` counters) and deterministic metric tests.
- ✅ Completed: task #1 moved `Next -> In Progress -> Done`; backend now returns empty paginated task lists as `items: []` and includes regression coverage for empty inbox queries.
- ✅ Completed: task #14 moved `Next -> In Progress -> Done` via initial unified client-state snapshot utility (`frontend/lib/app-store.ts`) plus ordering/indexing test coverage.
- ✅ Completed: task #15 moved `Next -> In Progress -> Done` by wiring frontend collection fetches to a configurable stale-while-revalidate policy (`TODO_APP_SWR_SECONDS`, default 30s) with explicit `no-store` fallback when set to `0`.
- ▶ Next milestone:
  - #16 Benchmark: Define performance SLA (p50/p95 load, interaction latency, API throughput)
  - #17 Benchmark: Build repeatable backend load test harness for task/board endpoints
  - #34 Capture one real worker run outcome proving acceptable timeout ratio (unblock evidence)
