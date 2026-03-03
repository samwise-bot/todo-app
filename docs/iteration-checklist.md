# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent via existing board snapshot export (`.run/tasks.json`) and stable project lane mapping.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #11 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Added SPA architecture baseline ADR: `docs/adr/0002-spa-routing-state-data.md`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #32 DevEx: document GO binary fallback strategy for local/CI test scripts (**next**, priority=2).
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).

## Verification
- `npx markdownlint-cli docs/adr/0002-spa-routing-state-data.md` ✅
