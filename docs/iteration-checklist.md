# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent via API counts: principals=2, projects=6, boards=5, columns=10.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #31 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Hardened `ops/run/check-task-mutations.sh` cleanup so synthetic mutation task transitions to `done` at script end.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #33 Mutation smoke task (**next**, priority=3).
- [ ] #40 UX IA: Make Board the primary default page (kanban-first) (**next**, priority=3).

## Verification
- `API_BASE=http://127.0.0.1:8080 ./ops/run/check-task-mutations.sh` ✅
