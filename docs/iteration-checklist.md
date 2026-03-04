# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #46 moved `Next -> In Progress -> Done`, assigned to `samwise`.
- [x] Implemented one atomic change: persistent top nav now highlights active route and includes `+ Quick create` jump action to board intake.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #52 Unblock #34: run worker outcome sweep and set timeout threshold (**next**, priority=1)
- [ ] #50 Reliability: add regression coverage for nav active-state styling on non-board routes (**next**, priority=3)
- [ ] #51 Benchmark: define TODO App performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3)
- [ ] #34 Ops: subagent fanout blocked by 5-worker cap/timeouts in autonomous loop (**waiting/blocked**, priority=1)

## Verification
- `npm test -- top-nav.test.tsx` (run from `frontend/`) ✅
