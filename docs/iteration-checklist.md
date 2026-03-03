# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Investigate PATCH /api/tasks/:id/board-column returning 404 on running service — **done**

## Current App Task Board (Project: TODO App)
- [ ] Add backend restart target to reduce stale-binary API drift during loops — **next**
- [ ] Add frontend malformed payload telemetry marker by endpoint — **next**
- [ ] Expand board-lane regression tests for columns/tasks mixed envelope fallbacks — **next**
- [ ] Document backend contract generator troubleshooting in docs/backend-testing.md — **next**

## Notes
- Principal ensured: `samwise` (`kind=agent`)
- Project ensured: `TODO App`
- Board ensured: `TODO App Board`
- Default columns ensured: Inbox, Next, In Progress, Review, Done
- Added local smoke check target: `make smoke-task-mutations`
