# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #12 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: added explicit **Phase 2 execution gates** in `docs/roadmap.md` (Gate A-E, binary pass/fail migration checkpoints).
- [x] Synced architecture notes (`docs/architecture/overview.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #13 Roadmap: Implement SPA shell with persistent board + inspector panels (**next**, priority=3).
- [ ] #14 Roadmap: Unified client state store for tasks/boards/columns/principals (**next**, priority=3).

## Verification
- `npm test -- board-page-defaults.test.tsx` (run from `frontend/`) ✅
