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
- ✅ Completed: task #35 shipped (batched subagent orchestration planner) with deterministic cursor-based batching in `ops/run/plan_subagent_fanout.py` + unit tests.
- ✅ Completed: task #36 integrated planner into runtime loop path via `ops/run/select_subagent_fanout_batch.py` (live task export + project-scoped batched selection).
- ✅ Completed: task #37 tuned worker execution policy in `ops/run/select_subagent_fanout_batch.py` with compact prompt generation + explicit `--worker-timeout-seconds` default 180s.
- ✅ Completed: DevEx task #30 (`ops/run/generate-backend-contract-tests.sh`) now has explicit Go binary fallback/override handling.
- ✅ Completed: task #38 validation utility shipped via `ops/run/validate_subagent_fanout_sweep.py` + `.run/subagent-fanout-sweep-report.json` evidence (coverageRatio=1.0 over full `Next` set in 4 cycles).
- 🚧 Blocked: task #34 remains in **Blocked** pending end-to-end verification that spawned workers (not just planner coverage) consistently return actionable notes within timeout budgets.
- ➕ Added follow-up validation need: collect spawned-worker completion/timeout ratios by cycle and define unblock threshold for #34 closure.
- 🔄 In progress: roadmap decomposition tasks for SPA architecture, auth rollout, and benchmarking remain in `Next` with prioritization by `priority` then deadline.
- ▶ Next milestone:
  - Expose priority/due-date controls in frontend create/edit flows (task #27)
  - Document canonical Go fallback strategy across all `ops/run` scripts (task #32)
  - Ship SPA architecture ADR baseline (task #11)
