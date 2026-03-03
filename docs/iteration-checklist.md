# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #13 delivery increment (board inspector panel), assigned to `samwise`.
- [x] Implemented one atomic code change: added board inspector metrics helper + board health panel in `/board` dashboard.
- [x] Synced roadmap + architecture notes for the new inspector panel slice.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [x] #13 Roadmap: Implement SPA shell with persistent board + inspector panels (**done**, priority=3).
- [ ] #14 Roadmap: Unified client state store for tasks/boards/columns/principals (**next**, priority=3).
- [ ] #15 Roadmap: Offline-first cache strategy for SPA (stale-while-revalidate) (**next**, priority=3).
- [ ] #16 Benchmark: Define performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3).

## Verification
- `npm --prefix frontend test -- board-inspector.test.ts` ✅
