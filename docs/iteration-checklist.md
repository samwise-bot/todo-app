# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Ensured app entities are present/idempotent: principal `samwise`, project `TODO App`, board `TODO App Board`, columns `Inbox/Next/In Progress/Blocked/Done`.
- [x] Processed Inbox first (0 items pending this cycle).
- [x] Mainline execution: task #35 `Unblock: implement batched subagent orchestration with retry + shorter prompts` moved `Next -> In Progress -> Done`.
- [x] Added deterministic batched fanout planner utility: `ops/run/plan_subagent_fanout.py`.
- [x] Added planner tests: `ops/tests/test_subagent_fanout_planner.py`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** column (`state=waiting`): subagent fanout cap/timeouts in one-cycle execution.
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).
- [ ] #32 DevEx: document GO binary fallback strategy for local/CI test scripts (**next**, priority=2).
- [ ] #36 Unblock #34: integrate batched fanout planner into cron execution path (**next**, priority=2).

## Subagent Fanout Snapshot
- Spawn attempts: 15 workers (one per current `Next` task at spawn time).
- Outcomes: workers were accepted but mostly aborted/timed out before useful diff notes returned.
- Practical blocker surfaced: active-child cap/timeout pressure prevents all-task completion in one short cycle; planner-based batching shipped to mitigate over subsequent cycles.

## Verification
- `python3 -m unittest ops.tests.test_subagent_fanout_planner -v` ✅
- `make test-backend` ✅
- `python3 ops/run/plan_subagent_fanout.py --tasks-json .run/tasks.json --batch-size 5` ✅
