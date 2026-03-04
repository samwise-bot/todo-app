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

### Phase 2 Execution Gates (2026-03-03)
- **Gate A — IA shell parity**: persistent nav + board-first default route in place.
- **Gate B — Data consistency**: shared selectors/cache preserve deterministic `Next` ordering (`priority`, `dueAt`, `id`).
- **Gate C — Route extraction**: `/tasks`, `/projects`, `/people`, `/settings` each render API-backed content (no placeholder-only pages).
- **Gate D — Interaction reliability**: lane/task create + state transitions pass focused regression coverage.
- **Gate E — Rollout safety**: SWR policy tunable via env with explicit `no-store` fallback for debugging.

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
- ✅ Completed: task #14 moved `Next -> In Progress -> Done`; expanded unified client-state snapshot to emit deterministic `Next` task groupings by assignee (`nextTaskIdsByAssignee`) with regression coverage.
- ✅ Completed: task #27 moved `Next -> In Progress -> Done` via frontend intake upgrade for `priority` + `dueAt` fields in task create flow.
- ✅ Completed: task #33 moved `Next -> In Progress -> Done` after cleaning lingering mutation-smoke residue.
- ✅ Completed: hardened `ops/run/check-task-mutations.sh` with EXIT-trap cleanup to force synthetic smoke tasks to `done` even on interrupted/error exits.
- ✅ Completed: revalidated principal/project/board/column prerequisites for TODO App (`samwise`, `TODO App`, canonical GTD board columns).
- ✅ Completed: task #4 moved `Next -> In Progress -> Done`; added frontend API-client regression tests for mixed envelope compatibility (`results.items`) and array-based paged fallback normalization.
- 🚧 Blocked: task #34 remains in **Blocked** pending one run with real worker outcome capture proving acceptable timeout ratio.
- ✅ Completed: task #41 moved `Next -> In Progress -> Done` with a board-first navigation slice (`/board` plus scaffold pages for `/tasks|/projects|/people|/settings`).
- ✅ Completed: task #42 moved `Next -> In Progress -> Done` with inline board-lane task creation forms (column-local quick add in `/board`).
- ✅ Completed: task #43 moved `Next -> In Progress -> Done` with inline board-level column creation directly from the `/board` lane UI.
- ✅ Completed: task #44 moved `Next -> In Progress -> Done` with draggable task-card metadata (`draggable`, `data-task-id`, `data-task-state`) as the first atomic step toward optimistic cross-column drag/drop interactions.
- ✅ Completed: route-split extraction increment on `/projects` (real API-backed project list + coverage) aligned to task #41 scope.
- ✅ Completed: task #47 moved `Next -> In Progress -> Done` with `/board` default focus for active work assigned to Samwise.
- ✅ Completed: task #47 follow-through hardening in `_dashboard` for multi-state focus rendering (`next,scheduled`) with deterministic local filtering + explicit focus-mode pagination messaging.
- ✅ Completed: task #12 moved `Next -> In Progress -> Done` by expanding the SPA migration plan into phased deliverables with explicit acceptance criteria.
- ✅ Completed: task #13 moved `Next -> In Progress -> Done` with initial board inspector slice (`Board health` counters) and deterministic metric tests.
- ✅ Completed: task #13 follow-up increment shipped in autonomous loop; board inspector now includes `Due soon (24h)` visibility for non-done tasks plus regression coverage.
- ✅ Completed: task #1 moved `Next -> In Progress -> Done`; backend now returns empty paginated task lists as `items: []` and includes regression coverage for empty inbox queries.
- ✅ Completed: task #14 moved `Next -> In Progress -> Done` via initial unified client-state snapshot utility (`frontend/lib/app-store.ts`) plus ordering/indexing test coverage.
- ✅ Completed: task #15 moved `Next -> In Progress -> Done` by wiring frontend collection fetches to a configurable stale-while-revalidate policy (`TODO_APP_SWR_SECONDS`, default 30s) with explicit `no-store` fallback when set to `0`.
- ✅ Completed: task #45 moved `Next -> In Progress -> Done`; `/settings` now exposes an advanced configuration panel covering SWR cache policy, board focus defaults, and current roadmap scope.
- ▶ Next milestone:
  - #46 Navigation: Add persistent top nav/sidebar with clear active page and quick-create
  - #16 Benchmark: Define performance SLA (p50/p95 load, interaction latency, API throughput)
  - #13 Roadmap: Implement SPA shell with persistent board + inspector panels
