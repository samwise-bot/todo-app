# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Docs/API: update OpenAPI + examples for task priority field — **done**
- [x] Processed Inbox item into Next with Samwise assignment (`Roadmap: SPA architecture decision record`) — **done**

## Current App Task Board (Project: TODO App)
- [ ] DevEx: make openapi generation script honor configured GO binary in non-interactive shells — **next**
- [ ] Expand board-lane regression tests for columns/tasks mixed envelope fallbacks — **next**
- [ ] Roadmap: SPA architecture decision record (routing, state, data fetching) — **next**

## Notes
- Principal ensured: `samwise` (`kind=agent`)
- Project ensured: `TODO App`
- Board ensured: `TODO App Board`
- Flow columns ensured: Inbox, Next, In Progress, Blocked, Done (`Review` remains legacy/deprioritized)
- Next ordering now deterministic at API level for `state=next`: `priority ASC`, then due date (earliest first), then id.
- Backend service was restarted via systemd after clearing a stale process binding :8080.
