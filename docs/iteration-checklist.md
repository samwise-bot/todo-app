# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Ensured app entities are present/idempotent: principal `samwise`, project `TODO App`, board `TODO App Board`, columns `Inbox/Next/In Progress/Blocked/Done`.
- [x] Processed Inbox first (0 items pending this cycle).
- [x] Mainline execution: task #36 `Unblock #34: integrate batched fanout planner into cron execution path` moved `Next -> In Progress -> Done` (board-column flow).
- [x] Added runtime integration script `ops/run/select_subagent_fanout_batch.py` to fetch live tasks and invoke deterministic planner with cursor.
- [x] Scoped fanout planning by project with `--project-id` to avoid cross-project worker selection noise.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** column (`state=waiting`): runtime active-worker cap/timeouts prevent full fanout completion in one short cycle.
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).
- [ ] #32 DevEx: document GO binary fallback strategy for local/CI test scripts (**next**, priority=2).
- [ ] #11 Roadmap: SPA architecture decision record (**next**, priority=2).

## Subagent Fanout Snapshot
- Historical recent fanout in this cron session: 15 workers for tasks #17-#26 and #32/#35/#34 (1 done, remainder timeout due runtime limits).
- Additional workers spawned this cycle: 5 analyses for tasks #11/#27/#32/#36/#4 (running at report time).
- Runtime integration now supports deterministic rolling batches (`ops/run/select_subagent_fanout_batch.py --project-id 2 --batch-size 5`).

## Verification
- `python3 ops/run/select_subagent_fanout_batch.py --project-id 2 --batch-size 5` ✅
- `python3 -m unittest ops.tests.test_subagent_fanout_planner -v` ✅
