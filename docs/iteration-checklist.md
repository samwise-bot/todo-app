# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #47 delivery increment (board focus defaults), assigned to `samwise`.
- [x] Implemented one atomic UI change: `/board` now defaults filters to Samwise + active work focus when query params are absent.
- [x] Added regression coverage: `frontend/tests/board-page-defaults.test.tsx` validates default and explicit filter pass-through behavior.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [x] #47 Board UX: Focus active view defaults to Next/In Progress + assignee Samwise (**done**, priority=3).
- [ ] #26 Auth: End-to-end auth test matrix (happy path, invalid creds, expired sessions) (**next**, priority=3).
- [ ] #25 Auth: Security hardening checklist (password policy, CSRF, rate limits) (**next**, priority=3).
- [ ] #24 Auth: Agent principal linking to user identity + audit trail (**next**, priority=3).

## Verification
- `npm --prefix frontend test -- board-page-defaults.test.tsx` ✅
