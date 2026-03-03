# TODO App (GTD + Kanban)

Local-first GTD + Kanban task system for humans and OpenClaw agents.

## Stack
- Backend: Go (`net/http`) + SQLite (`modernc.org/sqlite`)
- Frontend: Next.js (App Router)
- Database: SQLite
- Metrics: Prometheus scrape endpoint (`/metrics`)

## Current status
- ✅ Architecture docs + roadmap
- ✅ Backend scaffold with migrations + core API + GTD transition checks
- ✅ Task event audit log (append-only)
- ✅ Principals API + task assignee mutation with audit events
- ✅ Board/column CRUD APIs
- ✅ Minimal frontend with project/task creation + task state transition actions
- 🔜 Auth, richer board UX, assignment UI polish

## API endpoints (v1 slice)
- `GET /healthz`
- `GET /metrics`
- `GET /api/principals`
- `POST /api/principals`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:id`
- `PATCH /api/boards/:id`
- `DELETE /api/boards/:id`
- `GET /api/columns`
- `POST /api/columns`
- `GET /api/columns/:id`
- `PATCH /api/columns/:id`
- `DELETE /api/columns/:id`
- `GET /api/reviews/weekly`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/state`
- `PATCH /api/tasks/:id/assignee`

## Run locally

### Backend
```bash
make dev-backend
# API on :8080
```

### Tests
```bash
make test-backend
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
# UI on :3000
```

## GTD rules currently enforced
- `inbox` capture allows no `project_id`
- actionable states (`next`, `scheduled`, `waiting`) require `project_id`
- every task state change writes a `task_events` record

## Prometheus
- Scrape backend `/metrics`
- Starter alert rules: `ops/prometheus/alerts.yml`
