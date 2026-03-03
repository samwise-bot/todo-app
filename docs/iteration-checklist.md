# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent: principal `samwise`, project `TODO App`, board `TODO App Board`, columns `Inbox/Next/In Progress/Blocked/Done`.
- [x] Processed Inbox first (0 `inbox` tasks in project `TODO App` this cycle).
- [x] Mainline execution: task #38 moved `Next -> In Progress -> Done` (board-column flow) and implemented fanout sweep validation utility.
- [x] Added `ops/run/validate_subagent_fanout_sweep.py` to validate deterministic full-queue coverage and emit `.run/subagent-fanout-sweep-report.json`.
- [x] Added unit coverage for new sweep helper in `ops/tests/test_validate_subagent_fanout_sweep.py`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending spawned-worker completion ratio validation.
- [ ] #11 Roadmap: SPA architecture decision record (**next**, priority=2).
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).
- [ ] #32 DevEx: document GO binary fallback strategy for local/CI test scripts (**next**, priority=2).

## Subagent Fanout Snapshot
- Spawn attempts this cycle: 10 tool invocations; accepted/running-or-complete: 5 (tasks #38/#11/#27/#32/#15), gateway-timeout at spawn: 4 (#4/#12/#13/#14), capacity-blocked: 1 (#16 due to 5/5 active cap).
- Completed result captured: task #11 worker returned ADR-style proposed diff + tests/blockers.
- Timeouts observed: task #38 worker timed out at 180s before final summary.
- Validation evidence: `python3 ops/run/validate_subagent_fanout_sweep.py --project-id 2 --batch-size 5 --max-cycles 10` produced `coverageRatio=1.0`, `completedFullSweep=true`, `cyclesRun=4`.

## Verification
- `python3 -m unittest ops.tests.test_subagent_fanout_planner ops.tests.test_select_subagent_fanout_batch ops.tests.test_validate_subagent_fanout_sweep -v` ✅
- `python3 ops/run/validate_subagent_fanout_sweep.py --project-id 2 --batch-size 5 --max-cycles 10` ✅
