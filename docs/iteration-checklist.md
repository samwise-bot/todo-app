# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent: principal `samwise`, project `TODO App`, board `TODO App Board`, columns `Inbox/Next/In Progress/Blocked/Done`.
- [x] Processed Inbox first (0 `inbox` tasks in project `TODO App` this cycle).
- [x] Mainline execution: task #39 moved `Next -> In Progress -> Done` and stayed assigned to `samwise`.
- [x] Extended `ops/run/validate_subagent_fanout_sweep.py` to include `workerOutcomeSummary` from `.run/subagent-worker-results.json` (or override path).
- [x] Added unit coverage for data-envelope parsing + worker outcome summary in `ops/tests/test_validate_subagent_fanout_sweep.py`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #11 Roadmap: SPA architecture decision record (**next**, priority=2).
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).
- [ ] #32 DevEx: document GO binary fallback strategy for local/CI test scripts (**next**, priority=2).

## Verification
- `python3 -m unittest ops.tests.test_validate_subagent_fanout_sweep -v` ✅
