# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution completed on highest-priority Next task #53; moved `Next -> In Progress -> Done` assigned to `samwise`.
- [x] Added fixture-backed worker outcome evidence path for no-subagent mode (`ops/fixtures/subagent-worker-results.sample.json`).
- [x] Extended `ops/run/validate_subagent_fanout_sweep.py` with `--worker-results-fixture-json` fallback and provenance flags (`usedFixture`, `requestedPath`).
- [x] Added regression coverage in `ops/tests/test_validate_subagent_fanout_sweep.py` for fixture fallback behavior.
- [x] Synced architecture + roadmap notes (`docs/architecture/overview.md`, `docs/roadmap.md`) for this increment.

## Current App Task Board (Project: TODO App)
- [ ] #52 Unblock #34: run worker outcome sweep and set timeout threshold (**waiting/blocked**, priority=1)
- [ ] #50 Reliability: add regression coverage for nav active-state styling on non-board routes (**next**, priority=3)
- [ ] #51 Benchmark: define TODO App performance SLA (p50/p95 load, interaction latency, API throughput) (**next**, priority=3)
- [x] #53 Unblock #52: capture one worker outcome sample via non-subagent runner or fixture import (**done**, priority=1)
- [ ] #34 Ops: subagent fanout blocked by 5-worker cap/timeouts in autonomous loop (**waiting/blocked**, priority=1)

## Verification
- `npm test -- top-nav.test.tsx` (run from `frontend/`) ✅
