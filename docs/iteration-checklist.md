# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #41 delivery increment (route-split extraction), assigned to `samwise`.
- [x] Implemented one atomic IA change: `/projects` now renders API-backed project list instead of static scaffold.
- [x] Added regression coverage: `frontend/tests/projects-page.test.tsx` validates `/api/projects` fetch + rendered names.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [x] #42 Board UX: inline task creation within board/column context (**done**, priority=3).
- [ ] #43 Board UX: inline column creation and column management (**next**, priority=3).
- [ ] #44 Board UX: drag-and-drop movement between columns (**next**, priority=3).
- [ ] #45 Settings: advanced configuration page (**next**, priority=3).

## Verification
- `bash -n ops/run/check-task-mutations.sh` ✅
- `bash ops/run/check-task-mutations.sh` ✅
