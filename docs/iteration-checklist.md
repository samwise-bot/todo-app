# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Processed Inbox backlog into actionable Next items (14 tasks moved Inbox -> Next)
- [x] DevEx: make openapi generation script honor configured GO binary in non-interactive shells (task #29) — **done**

## Current App Task Board (Project: TODO App)
- [ ] DevEx: apply GO binary fallback to generate-backend-contract-tests script — **next**
- [ ] Frontend: expose priority selector + due date in task create/edit flows — **next**
- [ ] Auth: End-to-end auth test matrix (happy path, invalid creds, expired sessions) — **next**

## Notes
- Principal ensured: `samwise` (`kind=agent`)
- Project ensured: `TODO App`
- Board ensured: `TODO App Board`
- Flow columns ensured: Inbox, Next, In Progress, Blocked, Done (`Review` remains legacy/deprioritized)
- Verification run: `./ops/run/generate-openapi.sh` and `make test-backend` passed.
