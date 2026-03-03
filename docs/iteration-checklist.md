# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Add task priority + due date fields for deterministic Next ordering — **done**
- [x] Process Inbox item into actionable Next with Samwise assignment — **done**

## Current App Task Board (Project: TODO App)
- [ ] Frontend: expose priority selector + due date in task create/edit flows — **next**
- [ ] Docs/API: update OpenAPI + examples for task priority field — **next**
- [ ] Auth: Implement account + session schema and migration plan — **next**

## Notes
- Principal ensured: `samwise` (`kind=agent`)
- Project ensured: `TODO App`
- Board ensured: `TODO App Board`
- Flow columns ensured: Inbox, Next, In Progress, Blocked, Done (`Review` remains legacy/deprioritized)
- Next ordering now deterministic at API level for `state=next`: `priority ASC`, then due date (earliest first), then id.
- Backend service was restarted via systemd after clearing a stale process binding :8080.
