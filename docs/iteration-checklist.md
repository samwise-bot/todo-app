# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Mainline execution: task #27 moved `Next -> In Progress -> Done` with one atomic frontend change (task create form now supports `priority` + `dueAt` metadata + validation).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #33 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Hardened mutation smoke cleanup with an EXIT trap in `ops/run/check-task-mutations.sh` so interrupted runs still close synthetic tasks to `done`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #41 UX IA: split monolithic dashboard into route-based pages (**next**, priority=3).
- [ ] #42 Board UX: inline task creation within board/column context (**next**, priority=3).

## Verification
- `bash -n ops/run/check-task-mutations.sh` ✅
- `bash ops/run/check-task-mutations.sh` ✅
