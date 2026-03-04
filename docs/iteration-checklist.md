# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #15 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic code change: added configurable stale-while-revalidate fetch policy in `frontend/lib/api-client.ts` (`TODO_APP_SWR_SECONDS`, default `30`, `0` => `no-store`).
- [x] Added focused regression coverage in `frontend/tests/api-client.test.ts` for SWR defaults + disable path.
- [x] Synced architecture + roadmap notes for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #16 Benchmark: Define performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3).
- [ ] #17 Benchmark: Build repeatable backend load test harness for task/board endpoints (**next**, priority=3).

## Verification
- `npm test -- api-client.test.ts` (run from `frontend/`) ✅
