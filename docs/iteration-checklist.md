# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #14 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic code change: added `frontend/lib/app-store.ts` unified snapshot utility with deterministic `Next` ordering (`priority` -> `dueAt` -> `id`).
- [x] Added focused regression test coverage in `frontend/tests/app-store.test.ts`.
- [x] Synced architecture + roadmap notes for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [ ] #15 Roadmap: Offline-first cache strategy for SPA (stale-while-revalidate) (**next**, priority=3).
- [ ] #16 Benchmark: Define performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3).
- [ ] #17 Benchmark: Build repeatable backend load test harness for task/board endpoints (**next**, priority=3).

## Verification
- `npm test -- app-store.test.ts` (run from `frontend/`) ✅
