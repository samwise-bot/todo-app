# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #13 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: board inspector now surfaces `Due soon (24h)` in addition to existing board health counters.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #14 Roadmap: Unified client state store for tasks/boards/columns/principals (**next**, priority=3).
- [ ] #15 Roadmap: Offline-first cache strategy for SPA (stale-while-revalidate) (**next**, priority=3).
- [ ] #16 Benchmark: Define performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3).
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.

## Verification
- `npm test -- board-inspector.test.ts` (run from `frontend/`) ✅
