# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #43 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: added inline `Add column` board-level intake on `/board` lane UI with deterministic column position incrementing.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #44 Board UX: Implement drag-and-drop task movement across columns with optimistic updates (**next**, priority=3).
- [ ] #45 Settings: Create Advanced Settings page for configuration and power-user controls (**next**, priority=3).

## Verification
- `npm test -- board-page-defaults.test.tsx` (run from `frontend/`) ✅
