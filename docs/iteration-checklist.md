# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent via API counts: principals=2, projects=7, boards=6, columns=11.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #40 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Added regression coverage `frontend/tests/home-page-routing.test.tsx` to lock root-route redirect to `/board`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #41 UX IA: Split current monolithic dashboard into route-based pages (Board, Tasks, Projects, People, Settings) (**next**, priority=3).
- [ ] #42 Board UX: Add inline task creation within board/column context (**next**, priority=3).

## Verification
- `npm test -- --run tests/home-page-routing.test.tsx` ✅
