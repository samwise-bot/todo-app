# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #45 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: `/settings` now renders advanced controls for SWR policy, board focus defaults, and roadmap scope.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #46 Navigation: Add persistent top nav/sidebar with clear active page and quick-create (**next**, priority=3).
- [ ] #34 Ops: subagent fanout blocked by 5-worker cap/timeouts in autonomous loop (**waiting/blocked**, priority=1).

## Verification
- `npm test -- settings-page.test.tsx` (run from `frontend/`) ✅
