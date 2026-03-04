# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #44 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: board lane `TaskCard` now emits draggable metadata (`draggable`, `data-task-id`, `data-task-state`) to unblock optimistic drag/drop wiring.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #45 Settings: Create Advanced Settings page for configuration and power-user controls (**next**, priority=3).
- [ ] #46 Navigation: Add persistent top nav/sidebar with clear active page and quick-create (**next**, priority=3).
- [ ] #47 Board UX: Focus active view defaults to Next/In Progress + assignee Samwise (**next**, priority=3).
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.

## Verification
- `npm test -- board-lane-smoke.test.tsx` (run from `frontend/`) ✅
