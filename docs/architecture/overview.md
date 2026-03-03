# Architecture Overview

## Goals
- Capture-first GTD workflow (Inbox -> Clarify -> Organize -> Reflect -> Engage)
- Kanban execution views by project/context/assignee
- Human + agent assignment with immutable activity log
- Local-first reliability and observability

## Context Diagram
```mermaid
flowchart LR
  Human[Human User] --> UI[Next.js Frontend]
  Agent[OpenClaw Agent] --> API[Go API]
  UI --> API
  API --> DB[(SQLite)]
  API --> METRICS[/Prometheus Metrics/]
  Prom[Prometheus] --> METRICS
```

## Container Diagram
```mermaid
flowchart TB
  subgraph AppHost[Local Host]
    UI[Next.js App]
    API[Go Service]
    DB[(SQLite)]
    EXP[/metrics endpoint/]
  end
  UI <--> API
  API <--> DB
  API --> EXP
  PR[Prometheus] --> EXP
```

## Core Components
- **Task Service**: task CRUD, GTD state transitions, recurrence
- **Project Service**: project ownership, lifecycle, WIP policy
- **Board Service**: kanban columns, swimlanes, ordering
- **Assignment Service**: human/agent principals, delegation, load checks
- **Audit Service**: append-only activity/event log
- **Review Service**: weekly review snapshots + stale detection

## Data Model (high-level)
```mermaid
erDiagram
  PROJECT ||--o{ TASK : contains
  TASK ||--o{ TASK_EVENT : emits
  TASK }o--|| PRINCIPAL : assigned_to
  BOARD ||--o{ COLUMN : has
  COLUMN ||--o{ TASK : displays
```

## Sequence: assign task to agent
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js
  participant API as Go API
  participant DB as SQLite
  U->>FE: Assign task to agent
  FE->>API: PATCH /tasks/:id/assignee
  API->>DB: Update task + write task_event
  API-->>FE: 200 + updated task
  FE-->>U: Show assignee + audit trail
```

## Observability Artifacts
- Prometheus alert rules: `ops/prometheus/alerts.yml`
- Grafana dashboard: `ops/grafana/todo-app-observability.json`

## Using Observability Artifacts
1. Configure Prometheus to load `ops/prometheus/alerts.yml` and verify alert state for:
   - high weekly review failure ratio (15m, with minimum request-volume guard)
   - board lane fetch failures by `endpoint` over 10m
   - high weekly review p95 latency over 15m
2. Import `ops/grafana/todo-app-observability.json` in Grafana and map `DS_PROMETHEUS` to your Prometheus datasource.
3. Use the dashboard panels to confirm weekly review request/failure rates, failure ratio, p95 latency, and board lane failure spikes by endpoint.

## Architecture Delta (2026-03-03, autonomous loop)
- Added deterministic subagent fanout planning utility: `ops/run/plan_subagent_fanout.py`.
  1. Sorts `Next` tasks by `priority`, then `dueAt`, then `id`.
  2. Selects a bounded batch (`--batch-size`, default 5) to respect worker caps/timeouts.
  3. Persists resume cursor in `.run/subagent-fanout-cursor.json` so multiple cycles eventually cover all `Next` tasks.
- Added unit coverage for ordering/cursor behavior in `ops/tests/test_subagent_fanout_planner.py`.
- Standardized Go binary resolution in `ops/run/generate-backend-contract-tests.sh`:
  1. Optional explicit `BACKEND_TEST_GO_BIN` (must be executable)
  2. `go` discovered on `PATH` after Nix profile bin candidates are prepended
  3. Hard failure with actionable hint when unresolved
- Contract test generation now executes with resolved `GO_BIN`, reducing non-interactive shell drift and making local/CI behavior deterministic.
