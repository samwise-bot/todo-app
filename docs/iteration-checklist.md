# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #76 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped compact board/settings top-nav quick-jumps (`⚙ Advanced controls` from `/board`, `← Back to board` from `/settings`).
- [x] Added follow-up UI task #80 (`next`, priority 4) so top-3 Next queue stays populated in strike mode.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #78 Board UX: add active saved-view helper text + clear affordance in toolbar (**next**, priority=4)
- [ ] #79 Board UX: add compact board empty-state CTA linking to /settings advanced controls (**next**, priority=4)
- [ ] #80 Navigation: add settings header return-to-board chip (**next**, priority=4)

## Verification
- `npm test -- --run tests/top-nav.test.tsx tests/board-lanes-rendering.test.tsx tests/settings-page.test.tsx` ✅

## Completed This Iteration
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #74 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped board IA shortcut card from `/board` to `/settings#advanced-controls` to keep advanced controls off-board but immediately accessible.
- [x] Added follow-up UI task #79 (`next`, priority 4) so top-3 Next queue stays populated for strike mode.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #76 Navigation: add compact board quick-jump between /board and /settings (**next**, priority=4)
- [ ] #78 Board UX: add active saved-view helper text + clear affordance in toolbar (**next**, priority=4)
- [ ] #79 Board UX: add compact board empty-state CTA linking to /settings advanced controls (**next**, priority=4)

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx tests/settings-page.test.tsx` ✅

## Completed This Iteration
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #77 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped saved-view active-state persistence on `/board` (active chip highlight + `aria-current="page"` semantics for matching saved view).
- [x] Added follow-up board UX task #78 (`next`, priority 4) to keep UI-strike queue stocked.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #74 Settings: add board-to-settings advanced-controls shortcut card (**next**, priority=4)
- [ ] #76 Navigation: add compact board quick-jump between /board and /settings (**next**, priority=4)
- [ ] #78 Board UX: add active saved-view helper text + clear affordance in toolbar (**next**, priority=4)

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx` ✅

## Completed This Iteration
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #75 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped board saved-view chip row in `/board` sticky toolbar (`Assigned to me`, `Priority P1`, `Mobile sweep (3d)`) with deterministic filter-link composition.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #77 Board UX: persist active saved-view chip state in toolbar (**next**, priority=3)
- [ ] #74 Settings: add board-to-settings advanced-controls shortcut card (**next**, priority=4)
- [ ] #76 Navigation: add compact board quick-jump between /board and /settings (**next**, priority=4)

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx` ✅

## Completed This Iteration
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #73 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped board-header active-filter count pill beside filter reset controls and hardened mobile action-row wrapping under 900px.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #74 Settings: add board-to-settings advanced-controls shortcut card (**next**, priority=4)
- [ ] #75 Board UX: add saved-view chips row for common board filter combinations (**next**, priority=3)
- [ ] #76 Navigation: add compact board quick-jump between /board and /settings (**next**, priority=4)

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx` ✅

## Completed This Iteration
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #72 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped mobile board UX tightening under 900px: denser lane/card spacing + robust sticky-toolbar filter wrapping.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #73 Board UX: add board-header active-filter count pill beside reset controls (**next**, priority=3)
- [ ] #74 Settings: add board-to-settings advanced-controls shortcut card (**next**, priority=4)

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx` ✅

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical board columns Inbox/Next/In Progress/Blocked/Done) via source-of-truth DB/API checks.
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Executed highest-priority UI `Next` task #71 through full flow with assignment (`next -> scheduled -> done`, board column `Next -> In Progress -> Done`) under `samwise`.
- [x] Shipped one-tap filter reset chip cluster with active-count pill + reset-all affordance in the `/board` sticky toolbar.
- [x] Synced architecture/roadmap/checklist docs.

## Current App Task Board (Project: TODO App)
- [ ] #72 Board UX: tighten mobile column/card spacing and sticky toolbar wrapping under 900px (**next**, priority=3)
- [ ] #73 Board UX: add board-header active-filter count pill beside reset controls (**next**, priority=3)
- [ ] #74 Settings: add board-to-settings advanced-controls shortcut card (**next**, priority=4)

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx` ✅

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

## Iteration Update (2026-03-04 06:34 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #26 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added auth E2E matrix baseline in `docs/auth/e2e-test-matrix.md`.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `npm test -- --run tests/api-client.test.ts` (focused regression guard) 

## Iteration Update (2026-03-04 07:45 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, board `TODO App`, Inbox/Next/In Progress/Done/Blocked).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #20 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added ADR `docs/adr/0003-auth-identity-model.md` documenting account/principal split and migration sequence.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `git diff -- docs/adr/0003-auth-identity-model.md docs/architecture/overview.md docs/roadmap.md docs/iteration-checklist.md` ✅

## Iteration Update (2026-03-04 08:43 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #21 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added auth schema migration baseline in `backend/migrations/003_auth_accounts_sessions.sql`.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `python3 - <<'PY' ... sqlite executescript migration check ... PY` ✅

## Iteration Update (2026-03-04 09:43 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #22 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added secure auth session-cookie helpers in `backend/internal/app/auth_cookie.go` with focused tests in `backend/internal/app/auth_cookie_test.go`.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `/home/bot/.nix-profile/bin/go test ./internal/app -run 'Test(NewSessionCookieSecureDefaults|ClearSessionCookieExpiresImmediately)$'` ✅

## Autonomous Loop Run — 2026-03-04 10:43 PT

- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #23 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Implemented one atomic auth-domain change: role/permission primitives + focused test coverage.
- [x] Refreshed Next ordering snapshot by `priority`, `dueAt`, `id` from API export.

## Autonomous Loop Run — 2026-03-04 11:43 PT

- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #24 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Implemented one atomic auth-domain change: account-principal link upsert + audit-event logging support (`backend/internal/store/account_principal_links.go`, `backend/migrations/004_account_principal_link_events.sql`).
- [x] Refreshed task export snapshot from API (`.run/tasks.json`) and re-ranked Next by `priority`, `dueAt`, then `id`.

## Verification
- `/home/bot/.nix-profile/bin/go test ./tests -run TestLinkAccountPrincipalWritesAuditEvent` ✅

## Iteration Update (2026-03-04 13:15 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #25 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Added auth security hardening checklist baseline in `docs/auth/security-hardening-checklist.md`.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `git diff -- docs/auth/security-hardening-checklist.md docs/architecture/overview.md docs/roadmap.md docs/iteration-checklist.md` ✅

## Iteration Update (2026-03-04 14:43 PT)
- [x] Re-validated principal/project/board/columns for TODO App (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done) directly in DB source-of-truth.
- [x] Processed Inbox first (no `inbox` tasks present for TODO App).
- [x] Executed task #26 lifecycle (`Next -> In Progress -> Done`) assigned to `samwise`.
- [x] Shipped board-first filter increment: added first-class `taskPriority` + `taskDueWindow` controls and unified board-lane/task-explorer filtering in `frontend/app/_dashboard.tsx`.
- [x] Synced architecture + roadmap docs for this increment.

## Verification
- `npm test -- --run tests/board-lanes-rendering.test.tsx tests/board-page-defaults.test.tsx` ✅
- `npm test -- --run tests/tasks-page.test.tsx tests/board-lane-smoke.test.tsx` ✅
