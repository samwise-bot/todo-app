# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated app entities are present/idempotent: principal `samwise`, project `TODO App`, board `TODO App Board`, columns `Inbox/Next/In Progress/Blocked/Done`.
- [x] Processed Inbox first (0 `inbox` tasks in project `TODO App` this cycle).
- [x] Mainline execution: task #37 `Unblock #34: tune subagent worker timeout + prompt budget for higher completion rate` moved `Next -> In Progress -> Done` (board-column flow) and was implemented.
- [x] Updated fanout runtime selector to emit compact worker spawn specs with explicit timeout tuning:
  - `ops/run/select_subagent_fanout_batch.py --emit-spawn-spec`
  - default `--worker-timeout-seconds 180`
- [x] Added unit test coverage for compact prompt builder (`ops/tests/test_select_subagent_fanout_batch.py`).

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending confirmation of reduced timeout churn over full-queue fanout cycles.
- [ ] #27 Frontend: expose priority selector + due date in task create/edit flows (**next**, priority=2).
- [ ] #32 DevEx: document GO binary fallback strategy for local/CI test scripts (**next**, priority=2).
- [ ] #11 Roadmap: SPA architecture decision record (**next**, priority=2).

## Subagent Fanout Snapshot
- This cycle: selected 5 Next tasks via deterministic planner batch (`#22-#26`) and spawned analysis workers (4 accepted immediately, 1 gateway timeout during spawn).
- Recent evidence confirms dominant failure mode was 60s worker timeout churn; this cycle codifies 180s timeout as default for generated spawn specs.

## Verification
- `python3 -m unittest ops.tests.test_subagent_fanout_planner ops.tests.test_select_subagent_fanout_batch -v` ✅
- `python3 ops/run/select_subagent_fanout_batch.py --project-id 2 --batch-size 5 --emit-spawn-spec` ✅
