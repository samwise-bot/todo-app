# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution completed on highest-priority Next task #50; moved `Next -> In Progress -> Done` assigned to `samwise`.
- [x] Hardened top-nav regression expectations so each non-board route render has exactly one active nav link and preserves quick-create affordance.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #52 Unblock #34: run worker outcome sweep and set timeout threshold (**waiting/blocked**, priority=1)
- [ ] #51 Benchmark: define TODO App performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3)
- [ ] #17 Benchmark: build repeatable backend load test harness for task/board endpoints (**next**, priority=3)
- [ ] #16 Benchmark: define performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3)
- [ ] #34 Ops: subagent fanout blocked by 5-worker cap/timeouts in autonomous loop (**waiting/blocked**, priority=1)

## Verification
- `npm test -- --run tests/top-nav.test.tsx` ✅

## Iteration Update (2026-03-04 00:29 PT)
- [x] Re-validated TODO App ownership scaffolding (principal/project/board/columns) via source-of-truth task export review.
- [x] Processed Inbox first (no `inbox` tasks present).
- [x] Executed task #15 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Updated roadmap + architecture docs with offline-first cache strategy tiering and invalidation plan.
- [x] Refreshed Next ordering by `priority`, `dueAt`, then `id` in exported board snapshot.

## Verification
- `git diff -- docs/roadmap.md docs/architecture/overview.md docs/iteration-checklist.md .run/tasks.json` ✅

## Iteration Update (2026-03-04 01:14 PT)
- [x] Re-validated TODO App ownership scaffolding (principal/project/board/columns) against API source-of-truth.
- [x] Processed Inbox first (no `inbox` tasks present).
- [x] Executed task #51 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added benchmark harness `ops/run/benchmark_task_board.py` with focused percentile tests (`ops/tests/test_benchmark_task_board.py`).
- [x] Refreshed Next ordering by `priority`, `dueAt`, then `id` from API task export.

## Verification
- `python3 -m unittest ops.tests.test_benchmark_task_board` ✅
- `python3 ops/run/benchmark_task_board.py --iterations 3 --output .run/benchmark-task-board.json` ✅

## Iteration Update (2026-03-04 02:01 PT)
- [x] Re-validated TODO App ownership scaffolding (principal/project/board/columns) against API source-of-truth.
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #15 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Implemented endpoint-tiered SWR cache controls in `frontend/lib/api-client.ts` with env overrides for Hot/Warm/Cold collections.
- [x] Refreshed task export snapshot from API (`.run/tasks.json`) and re-ranked Next by `priority`, `dueAt`, then `id`.

## Verification
- `npm test -- --run tests/api-client.test.ts` ✅

## Iteration Update (2026-03-04 02:34 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #16 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added SLA pass/fail evaluation output in `ops/run/benchmark_task_board.py` with regression coverage.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `python3 -m unittest ops.tests.test_benchmark_task_board` ✅

## Iteration Update (2026-03-04 03:18 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #54 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Implemented deterministic `Next` lane sorting (`priority`, `dueAt`, `id`) in board-lane builder.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `npm test -- --run tests/board-lanes.test.ts` ✅

## Iteration Update (2026-03-04 04:00 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #17 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Extended benchmark harness with throughput + run metadata for repeatable backend load checks.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `python3 -m unittest ops.tests.test_benchmark_task_board` ✅

## Iteration Update (2026-03-04 04:45 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Created and executed task #55 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added endpoint-subset support to benchmark runner via `--endpoints` and corresponding focused regression coverage.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `python3 -m unittest ops.tests.test_benchmark_task_board` ✅

## Iteration Update (2026-03-04 05:06 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #18 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added frontend interaction benchmark scaffold via `benchmarkBoardLaneAssembly` with deterministic summary metrics (`avg`, `p50`, `p95`, `max`).
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `npm test -- --run tests/interaction-benchmark.test.ts` ✅

- 2026-03-04 13:37 UTC: Loop execution checkpoint — implemented and tested historical CI telemetry regression checks against recent run history.
