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
