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
- Acceptance: end-to-end create->clarify->organize->execute flow works

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
- ✅ Completed: task #39 moved `Next -> In Progress -> Done` and extended sweep reporting with `workerOutcomeSummary` (`completed`, `timedOut`, ratios) in `ops/run/validate_subagent_fanout_sweep.py`.
- ✅ Completed: task #38 validated deterministic full-queue coverage with `.run/subagent-fanout-sweep-report.json` (`coverageRatio=1.0`, `cyclesRun=4`).
- ✅ Completed: task #32 documented canonical Go fallback strategy for contract-test generation in `docs/backend-testing.md` (resolution order + env vars + operator guidance).
- 🚧 Blocked: task #34 remains in **Blocked** pending one run with real worker outcome capture proving acceptable timeout ratio.
- 🔄 In progress: roadmap decomposition tasks for SPA architecture, auth rollout, and benchmarking remain in `Next` with prioritization by `priority` then deadline.
- ▶ Next milestone:
  - ✅ Shipped SPA architecture baseline (task #11): root route now redirects to `/board` with dashboard moved to `app/_dashboard.tsx` and mounted at `/board`.
  - Expose priority/due-date controls in frontend create/edit flows (task #27)
  - Continue auth/benchmark roadmap queue from prioritized `Next`
