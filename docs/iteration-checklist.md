# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #47 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: `/board` multi-state focus defaults (`next,scheduled`) now render deterministic filtered task results instead of relying on single-state API filtering.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #45 Settings: Create Advanced Settings page for configuration and power-user controls (**next**, priority=3).
- [ ] #46 Navigation: Add persistent top nav/sidebar with clear active page and quick-create (**next**, priority=3).
- [ ] #13 Roadmap: Implement SPA shell with persistent board + inspector panels (**next**, priority=3).
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.

## Verification
- `npm test -- board-page-defaults.test.tsx` (run from `frontend/`) ✅
