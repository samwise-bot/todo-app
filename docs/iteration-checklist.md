# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Add backend restart target to reduce stale-binary API drift during loops — **done**
- [x] Document backend contract generator troubleshooting in docs/backend-testing.md — **done**

## Current App Task Board (Project: TODO App)
- [ ] Add task priority + due date fields for deterministic Next ordering — **next**
- [ ] Add frontend malformed payload telemetry marker by endpoint — **next**
- [ ] Expand board-lane regression tests for columns/tasks mixed envelope fallbacks — **next**

## Notes
- Principal ensured: `samwise` (`kind=agent`)
- Project ensured: `TODO App`
- Board ensured: `TODO App Board`
- Flow columns ensured: Inbox, Next, In Progress, Blocked, Done (`Review` left as legacy column, deprioritized at position 99)
- Added local restart helper: `make restart-backend`
- Added local smoke check target: `make smoke-task-mutations`
