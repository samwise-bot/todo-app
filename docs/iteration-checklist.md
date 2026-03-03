# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent: principal `samwise`, project `TODO App`, board `TODO App Board`, columns `Inbox/Next/In Progress/Blocked/Done`.
- [x] Processed Inbox first (0 `inbox` tasks in project `TODO App` this cycle).
- [x] Mainline execution: task #32 moved `Next -> In Progress -> Done` and remained assigned to `samwise`.
- [x] Added canonical Go fallback strategy documentation in `docs/backend-testing.md` (resolution order, env vars, CI/local guidance).

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #11 Roadmap: SPA architecture decision record (**next**, priority=2).
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).

## Verification
- `python3 -m unittest ops.tests.test_ci_telemetry_scripts -v` ✅
