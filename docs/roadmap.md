# Roadmap


## Current Iteration Status (2026-03-05 07:53 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #86 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board visual polish increment shipped — lane container now shows horizontal edge-fade indicators to signal scrollable overflow (desktop + mobile-safe sizing).
- ✅ Added follow-up UI task #87 to keep board UX strike queue depth at 3.
- ▶ Next milestone:
  - #87 Board UX: add subtle lane-edge fade labels for mobile scroll discoverability.
  - #84 Board UX: add compact active-filter diagnostics in empty-state helper.
  - #83 Board UX: add compact settings header breadcrumb context for board workspace.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **Improving**.
  - D) Visual polish/mobile safety: **Improving** (edge-fade overflow cues shipped).
  - E) Advanced controls moved off board: **On track**.

## Current Iteration Status (2026-03-05 07:23 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #85 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board visual polish increment shipped — lane headers now use a sticky shadowed container for stronger horizontal scroll context and Trello-like readability.
- ✅ Added follow-up UI task #86 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #83 Board UX: add compact settings header breadcrumb context for board workspace.
  - #84 Board UX: add compact active-filter diagnostics in empty-state helper.
  - #86 Board UX: add horizontal scroll edge-fade indicators for lane container.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **Improving**.
  - D) Visual polish/mobile safety: **Improving** (sticky lane-header context shipped).
  - E) Advanced controls moved off board: **On track**.

## Current Iteration Status (2026-03-05 06:23 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #81 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board saved-view helper copy polish shipped — active helper now explicitly advertises one-click reset and uses clearer `Reset view ×` wording.
- ✅ Added follow-up UI task #84 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #82 Board UX: add filter-empty-state count hint for quick diagnosis.
  - #83 Board UX: add compact settings header breadcrumb context for board workspace.
  - #84 Board UX: add compact active-filter diagnostics in empty-state helper.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **Improving** (saved-view reset affordance now clearer in-context).
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **On track**.

## Current Iteration Status (2026-03-05 05:54 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #80 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: navigation polish increment shipped — `/settings` header now includes a compact `← Board workspace` return chip for fast board re-entry.
- ✅ Added follow-up UI task #83 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #81 Board UX: clarify saved-view helper with one-click reset hint.
  - #82 Board UX: add filter-empty-state count hint for quick diagnosis.
  - #83 Board UX: add compact settings header breadcrumb context for board workspace.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **Improving**.
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **On track** (settings return chip improves board-primary loop without restoring clutter).

## Current Iteration Status (2026-03-05 05:38 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #79 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board filtered-empty-state UX increment shipped — `/board` now shows a compact CTA card with one-tap `Clear filters` + `Open advanced controls` when active filters hide all cards.
- ✅ Added follow-up UI task #82 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #80 Navigation: add settings header return-to-board chip.
  - #81 Board UX: clarify saved-view helper with one-click reset hint.
  - #82 Board UX: add filter-empty-state count hint for quick diagnosis.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **Improving** (new zero-results CTA closes discoverability gap).
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **Improving** (filtered-empty state now points to `/settings` instead of adding board clutter).

## Current Iteration Status (2026-03-05 05:23 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #78 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board toolbar UX increment shipped — active saved view now shows helper text plus a one-click `Clear view ×` affordance in `/board` sticky toolbar.
- ✅ Added follow-up UI task #81 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #79 Board UX: add compact board empty-state CTA linking to `/settings` advanced controls.
  - #80 Navigation: add settings header return-to-board chip.
  - #81 Board UX: clarify saved-view helper with one-click reset hint.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **On track** (saved-view clear affordance improved).
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **Improving**.

## Current Iteration Status (2026-03-05 05:10 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #76 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: compact board/settings navigation increment shipped — top nav now provides directional quick-jumps (`⚙ Advanced controls` on `/board`, `← Back to board` on `/settings`).
- ✅ Added follow-up UI task #80 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #78 Board UX: add active saved-view helper text + clear affordance in toolbar.
  - #79 Board UX: add compact board empty-state CTA linking to `/settings` advanced controls.
  - #80 Navigation: add settings header return-to-board chip.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **On track**.
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **Improving** (bidirectional board/settings quick-jump now in top nav).

## Current Iteration Status (2026-03-05 04:56 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #74 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board IA increment shipped — `/board` now includes a dedicated shortcut card to `/settings#advanced-controls` so advanced controls stay off-board but one click away.
- ✅ Added follow-up UI task #79 to keep board-first pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #76 Navigation: add compact board quick-jump between `/board` and `/settings`.
  - #78 Board UX: add active saved-view helper text + clear affordance in toolbar.
  - #79 Board UX: add compact board empty-state CTA linking to `/settings` advanced controls.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **On track**.
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **Improving** (explicit board→settings bridge shipped).

## Current Iteration Status (2026-03-05 04:41 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #77 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — saved-view chips on `/board` now persist active state with `aria-current` + highlighted chip styling.
- ✅ Added follow-up UI task #78 to keep board UX pipeline full (`next`, priority 4).
- ▶ Next milestone:
  - #74 Settings: add board-to-settings advanced-controls shortcut card.
  - #76 Navigation: add compact board quick-jump between `/board` and `/settings`.
  - #78 Board UX: add active saved-view helper text + clear affordance in toolbar.
- Board-first criteria snapshot:
  - A) `/board` focused workspace: **On track**.
  - B) Core card/header actions: **On track**.
  - C) Strong filtering + chips/reset: **On track** (saved-view active-state clarity improved).
  - D) Visual polish/mobile safety: **Improving**.
  - E) Advanced controls moved off board: **In progress** (`/settings` shortcut remains next).

## Current Iteration Status (2026-03-05 04:23 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #75 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — sticky toolbar now includes a saved-view chip row (`Assigned to me`, `Priority P1`, `Mobile sweep (3d)`) for one-tap filter pivots.
- ▶ Next milestone:
  - #77 Board UX: persist active saved-view chip state in toolbar.
  - #74 Settings: add board-to-settings advanced-controls shortcut card.
  - #76 Navigation: add compact board quick-jump between `/board` and `/settings`.

## Current Iteration Status (2026-03-05 04:10 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #73 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — board filter action row now includes a persistent active-filter count pill beside apply/reset controls, with robust mobile wrapping under 900px.
- ▶ Next milestone:
  - #74 Settings: add board-to-settings advanced-controls shortcut card.
  - #75 Board UX: add saved-view chips row for common board filter combinations.
  - #76 Navigation: add compact board quick-jump between `/board` and `/settings`.

## Current Iteration Status (2026-03-05 03:55 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #72 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — mobile `/board` spacing + toolbar wrapping tightened under 900px (compact columns/cards, resilient 2-column filter grid, improved sticky-toolbar wrap behavior).
- ▶ Next milestone:
  - #73 Board UX: add board-header active-filter count pill beside reset controls.
  - #74 Settings: add board-to-settings advanced-controls shortcut card.
  - UX IA: keep extracting non-board controls to dedicated `/settings` while preserving `/board` as primary workspace.

## Current Iteration Status (2026-03-05 03:40 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #71 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — `/board` now exposes one-tap filter reset chip cluster with active-count pill and reset-all affordance in the sticky toolbar.
- ▶ Next milestone:
  - #72 Board UX: tighten mobile column/card spacing and sticky toolbar wrapping under 900px.
  - #73 Board UX: add board-header active-filter count pill beside reset controls.
  - #74 Settings: add board-to-settings advanced-controls shortcut card.

## Phase 0 - Foundations
- Repo scaffold, docs, CI baseline
- Acceptance: clean lint/test skeleton passes

## Phase 1 - Backend Core (Go + SQLite)
- Schema migrations: principals, projects, tasks, task_events, boards, columns
- REST API + validation + tests
- Acceptance: API tests green; GTD state machine enforced

## Phase 2 - Frontend Core (Next.js)
- Inbox, Next Actions, Projects, Contexts, Weekly Review, Kanban board
- Planned migration slices:
  1. Route shell split (`/board`, `/tasks`, `/projects`, `/people`, `/settings`) with persistent nav and stable server-action parity.
  2. Shared client state/cache layer for tasks, projects, boards, columns, principals with deterministic selectors.
  3. Data fetching policy: stale-while-revalidate reads + optimistic mutation rollback for lane/task operations.
  4. Progressive extraction of monolithic dashboard sections into route-local modules while preserving GTD state constraints.
  5. Offline-first cache tiers:
     - Hot (board lanes, Next list): SWR 15-30s + mutation-triggered revalidation.
     - Warm (projects/principals): SWR 2-5m.
     - Cold (settings/metadata): SWR 10-30m.
  6. Invalidation contract: task mutations invalidate task collections + impacted board lane; board/column mutations invalidate board topology; assignment changes invalidate assignee-focused views.
- Acceptance:
  - end-to-end create->clarify->organize->execute flow works on `/board`
  - route split pages render with API-backed data (no static placeholders)
  - deterministic `Next` ordering preserved across refresh/navigation

### Phase 2 Execution Gates (2026-03-03)
- **Gate A — IA shell parity**: persistent nav + board-first default route in place.
- **Gate B — Data consistency**: shared selectors/cache preserve deterministic `Next` ordering (`priority`, `dueAt`, `id`).
- **Gate C — Route extraction**: `/tasks`, `/projects`, `/people`, `/settings` each render API-backed content (no placeholder-only pages).
- **Gate D — Interaction reliability**: lane/task create + state transitions pass focused regression coverage.
- **Gate E — Rollout safety**: SWR policy tunable via env with explicit `no-store` fallback for debugging.

## Phase 3 - Assignment + Agent Ops
- Human/agent principal directory
- Assignment UI/API and activity feed
- Acceptance: task assignment visible + auditable

## Phase 4 - Observability + Hardening
- /metrics, dashboards, alert rules
- Acceptance: key SLO metrics exported and scrapeable
- Current artifacts:
  - `ops/prometheus/alerts.yml` for weekly-review failure-rate/latency and board-lane fetch-failure alerting
  - `ops/grafana/todo-app-observability.json` for weekly-review and board-lane metric panels

## Phase 5 - v1 Handoff
- docs/handoff/v1.md, known limitations, ops runbook

## Current Iteration Status (2026-03-05 03:20 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked UI-strike `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #69 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — board filters now live in a sticky compact toolbar on `/board` while preserving full filter/search/reset functionality.
- ▶ Next milestone:
  - #71 Board UX: add one-tap filter reset chip cluster with active count.
  - #72 Board UX: tighten mobile column/card spacing and sticky toolbar wrapping under 900px.
  - #73 Board UX: add board-header active-filter count pill beside reset controls.

## Current Iteration Status (2026-03-05 03:05 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #70 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first IA increment shipped — `/board` now renders a focused board workspace only (removed monolithic dashboard sections), while preserving in-lane core controls and adding assignee/project quick-clear chips in the filter header.
- ▶ Next milestone:
  - #69 Board UX: move board filters into sticky compact toolbar on `/board`.
  - #71 Board UX: add one-tap filter reset chip cluster with active count.
  - UX IA: migrate remaining advanced controls to dedicated `/settings` modules with API-backed controls.

## Current Iteration Status (2026-03-05 02:55 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #68 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — board header now includes assignee/project/state/priority/due/search filter dropdowns + search input + `Clear all`, while retaining inline active chips for per-filter quick-clear.
- ▶ Next milestone:
  - Roadmap: SPA extract board-only shell from monolithic dashboard.
  - Board UX: move board filters into sticky compact toolbar on `/board`.
  - Board UX: add one-tap filter reset chip cluster with active count.

## Current Iteration Status (2026-03-05 02:35 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via source-of-truth API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #67 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — direct column rename/delete controls now live in each board column header, with delete disabled when tasks remain in that column.
- ▶ Next milestone:
  - #68 Board UX: add assignee/project filter dropdown quick-clear chips in board header.
  - Board UX hardening: clear one-shot status/notice query params after first successful render.
  - Board UX hardening: add focused interaction tests for successful/failed inline column delete actions.

## Current Iteration Status (2026-03-05 02:20 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently in source-of-truth DB/API (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #66 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — post-reorder success announcement now includes persistent keyboard guidance so reorder hints remain available immediately after submit.
- ▶ Next milestone:
  - #67 Board UX: add direct column rename/delete controls on board headers.
  - #68 Board UX: add assignee/project filter dropdown quick-clear chips in board header.
  - Board UX hardening: clear one-shot status/notice query params after first successful render.

## Current Iteration Status (2026-03-05 01:59 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently via API source of truth (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #65 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — column reordering controls are now explicitly keyboard-guided and announce successful moves through an aria-live status region on `/board`.
- ▶ Next milestone:
  - #66 Board UX: keyboard shortcut hints persist after column reorder submit.
  - #67 Board UX: add direct column rename/delete controls on board headers.
  - #68 Board UX: add assignee/project filter dropdown quick-clear chips in board header.

## Current Iteration Status (2026-03-05 00:33 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently through the API source of truth (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #64 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — column move actions now surface rollback messaging on `/board` when a move fails (`columnMoveNotice` alert: "Optimistic reorder was rolled back").
- ▶ Next milestone:
  - #65 Board UX: keyboard-accessible column reordering controls with aria-live feedback.
  - Board UX hardening: clear one-shot rollback notices after first render.
  - Board UX hardening: extend API/contract coverage for quick-control and column-move validation error paths.

## Current Iteration Status (2026-03-05 00:29 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently in source-of-truth DB (`samwise`, `TODO App`, `TODO App Board`, Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox-first queue (0 inbox tasks), then ranked `Next` by (`priority`, `dueAt`, `id`).
- ✅ Completed: task #63 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — board cards now expose quick controls on `/board` for assignee, project, priority, and due date (plus edit/delete), no route hopping.
- ▶ Next milestone:
  - #64 Board UX: add optimistic rollback messaging for column move failures.
  - #65 Board UX: keyboard-accessible column reordering controls with aria-live feedback.
  - Board UX hardening: extend API/contract coverage for quick-control validation error paths.

## Current Iteration Status (2026-03-04 23:55 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites idempotently in source-of-truth DB.
- ✅ Completed: processed Inbox first (0 inbox tasks), then ranked `Next` by `priority`, `dueAt`, `id`.
- ✅ Completed: task #62 moved `Next -> In Progress -> Done` with explicit `samwise` assignment.
- ✅ Completed: board-first UX increment shipped — inline column move controls (left/right) now reorder columns directly from `/board`.
- ▶ Next milestone:
  - #63 Board UX: board-card quick controls for assignee/project/priority/due.
  - #64 Board UX: add optimistic rollback messaging for column move failures.
  - #65 Board UX: keyboard-accessible column reordering controls with aria-live feedback.

## Current Iteration Status (2026-03-04 22:26 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical GTD columns Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox first (0 inbox tasks this cycle) and re-ranked `Next` by `priority`, `dueAt`, `id`.
- ✅ Completed: task #61 moved `Next -> In Progress -> Done` with explicit `samwise` assignment in source-of-truth DB.
- ✅ Completed: board-first UX increment shipped — inline board-card `Edit / Delete` controls now operate directly from `/board` without route hopping.
- ▶ Next milestone:
  - #62 Board UX: drag-drop column moves with optimistic persistence + rollback.
  - #63 Board UX: board-card quick controls for assignee/project/priority/due.
  - Board UX hardening: optimistic/error feedback polish for inline board-card edit/delete actions.

## Current Iteration Status (2026-03-04 22:20 PT)
- ✅ Completed: re-validated principal/project/board/column prerequisites for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical GTD columns Inbox/Next/In Progress/Blocked/Done).
- ✅ Completed: processed Inbox first (0 inbox tasks this cycle) and re-ranked `Next` by `priority`, `dueAt`, `id`.
- ✅ Completed: task #34 moved `Next -> In Progress -> Done` with explicit `samwise` assignment in source-of-truth DB.
- ✅ Completed: task #60 moved `Next -> In Progress -> Done` with explicit `samwise` assignment in source-of-truth DB.
- ✅ Completed: board-first filter increment shipped — shareable preset links now resolve to `/board?...` URLs and are rendered directly in the board panel.
- ▶ Next milestone:
  - #61 Board UX: inline task edit/delete controls directly on board cards.
  - #62 Board UX: drag-drop column moves with optimistic persistence + rollback.
  - #63 Board UX: board-card quick controls for assignee/project/priority/due.

## Current Iteration Status (2026-03-05)
- ✅ Completed: re-validated principal/project/board/column prerequisites for TODO App (`samwise`, `TODO App`, `TODO App Board`, canonical GTD columns).
- ✅ Completed: processed Inbox first (0 inbox tasks this cycle) and re-ranked `Next` by `priority`, `dueAt`, `id`.
- ✅ Completed: task #52 moved `Next -> In Progress -> Done` with explicit `samwise` assignment in source-of-truth DB; task #34 was unblocked back to `Next` with blocker-note event evidence.
- ✅ Completed: task #57 moved `Next -> In Progress -> Done` with explicit `samwise` assignment after shipping board-lane active-filter summary badges.
- ✅ Completed: board-first UX increment shipped — `/board` now shows first-class active filter badges (assignee/project/state/priority/due-window/search) directly above lanes.
- ▶ Next milestone:
  - #34 Ops: close fanout timeout/cap issue now that unblock prerequisites are done.
  - Board UX: make active-filter badges removable inline (single-click clear).

## Current Iteration Status (2026-03-03)
- ✅ Completed: task #14 moved `Next -> In Progress -> Done`; expanded unified client-state snapshot to emit deterministic `Next` task groupings by assignee (`nextTaskIdsByAssignee`) with regression coverage.
- ✅ Completed: task #27 moved `Next -> In Progress -> Done` via frontend intake upgrade for `priority` + `dueAt` fields in task create flow.
- ✅ Completed: task #33 moved `Next -> In Progress -> Done` after cleaning lingering mutation-smoke residue.
- ✅ Completed: hardened `ops/run/check-task-mutations.sh` with EXIT-trap cleanup to force synthetic smoke tasks to `done` even on interrupted/error exits.
- ✅ Completed: revalidated principal/project/board/column prerequisites for TODO App (`samwise`, `TODO App`, canonical GTD board columns).
- ✅ Completed: task #4 moved `Next -> In Progress -> Done`; added frontend API-client regression tests for mixed envelope compatibility (`results.items`) and array-based paged fallback normalization.
- 🚧 Blocked: task #34 remains in **Blocked** pending one run with real worker outcome capture proving acceptable timeout ratio.
- ✅ Completed: task #41 moved `Next -> In Progress -> Done` with a board-first navigation slice (`/board` plus scaffold pages for `/tasks|/projects|/people|/settings`).
- ✅ Completed: task #42 moved `Next -> In Progress -> Done` with inline board-lane task creation forms (column-local quick add in `/board`).
- ✅ Completed: task #43 moved `Next -> In Progress -> Done` with inline board-level column creation directly from the `/board` lane UI.
- ✅ Completed: task #44 moved `Next -> In Progress -> Done` with draggable task-card metadata (`draggable`, `data-task-id`, `data-task-state`) as the first atomic step toward optimistic cross-column drag/drop interactions.
- ✅ Completed: route-split extraction increment on `/projects` (real API-backed project list + coverage) aligned to task #41 scope.
- ✅ Completed: task #47 moved `Next -> In Progress -> Done` with `/board` default focus for active work assigned to Samwise.
- ✅ Completed: task #47 follow-through hardening in `_dashboard` for multi-state focus rendering (`next,scheduled`) with deterministic local filtering + explicit focus-mode pagination messaging.
- ✅ Completed: task #12 moved `Next -> In Progress -> Done` by expanding the SPA migration plan into phased deliverables with explicit acceptance criteria.
- ✅ Completed: task #13 moved `Next -> In Progress -> Done` with initial board inspector slice (`Board health` counters) and deterministic metric tests.
- ✅ Completed: task #13 follow-up increment shipped in autonomous loop; board inspector now includes `Due soon (24h)` visibility for non-done tasks plus regression coverage.
- ✅ Completed: task #1 moved `Next -> In Progress -> Done`; backend now returns empty paginated task lists as `items: []` and includes regression coverage for empty inbox queries.
- ✅ Completed: task #14 moved `Next -> In Progress -> Done` via initial unified client-state snapshot utility (`frontend/lib/app-store.ts`) plus ordering/indexing test coverage.
- ✅ Completed: task #15 moved `Next -> In Progress -> Done` by wiring frontend collection fetches to a configurable stale-while-revalidate policy (`TODO_APP_SWR_SECONDS`, default 30s) with explicit `no-store` fallback when set to `0`.
- ✅ Completed: task #45 moved `Next -> In Progress -> Done`; `/settings` now exposes an advanced configuration panel covering SWR cache policy, board focus defaults, and current roadmap scope.
- ✅ Completed: task #46 moved `Next -> In Progress -> Done`; nav now marks active route and exposes persistent `+ Quick create` jump-to-intake action.
- 🚧 Blocked this cycle: #52 moved to Blocked after focused validation confirmed worker-outcome dataset is unavailable (`.run/subagent-worker-results.json` missing) while subagent execution is disabled.
- ✅ Created unblock task #53 (priority=1) to capture one worker outcome sample via non-subagent runner or fixture import, then resume #52 threshold decision.
- ✅ Completed: task #53 moved `Next -> In Progress -> Done`; fanout sweep validator now falls back to a checked-in worker-outcome fixture with explicit provenance fields (`usedFixture`, `requestedPath`) when live worker output is missing.
- ▶ Next milestone:
  - #52 Unblock: define timeout threshold for fanout lane using captured outcome evidence.
  - #21 Auth: implement account + session schema and migration wiring.
  - #22 Auth: add login/logout flow with secure session cookies.
- ✅ Completed: task #50 moved `Next -> In Progress -> Done`; nav active-state regression coverage now explicitly spans non-board routes (`/tasks|/projects|/people|/settings`) in `frontend/tests/top-nav.test.tsx`.
- ✅ Completed: task #50 follow-up hardening shipped; active-route regression now asserts the current non-board route is the **only** `aria-current="page"` nav item.
- ✅ Completed: task #53 provenance follow-up hardening shipped; missing worker-results reports now preserve `requestedPath` even when no live/fixture file exists, with focused regression coverage in `ops/tests/test_validate_subagent_fanout_sweep.py`.
- ✅ Completed: task #51 moved `Next -> In Progress -> Done`; defined TODO App performance SLA baseline (API latency, board render, interaction latency, throughput, and CI regression gates).

- ✅ Completed: task #15 moved `Next -> In Progress -> Done` in this cycle; expanded offline-first cache strategy from single TTL to policy tiers (Hot/Warm/Cold), invalidation triggers, and rollout checkpoints in Phase 2.

- ✅ Completed: task #51 moved `Next -> In Progress -> Done`; added `ops/run/benchmark_task_board.py` lightweight read-endpoint benchmark runner (tasks/boards/columns) with JSON artifact output for SLA tracking.

- ✅ Completed: task #15 moved `Next -> In Progress -> Done`; implemented endpoint-tiered SWR controls in frontend fetch policy (`TODO_APP_SWR_HOT_SECONDS`, `TODO_APP_SWR_WARM_SECONDS`, `TODO_APP_SWR_COLD_SECONDS`) with deterministic fallback to `TODO_APP_SWR_SECONDS`.
- ✅ Completed: task #16 moved `Next -> In Progress -> Done`; benchmark runner now emits SLA evaluation status (`sla.allPassed` + endpoint target comparisons) alongside latency summaries for deterministic gate checks.

- ✅ Completed: task #54 moved `Next -> In Progress -> Done`; `Next` board lane cards are now sorted by `priority`, `dueAt`, then `id` during lane assembly, with focused regression coverage.
- ✅ Completed: task #17 moved `Next -> In Progress -> Done`; backend benchmark harness now emits per-endpoint throughput (`throughput_rps`) and run metadata (`_meta.elapsed_ms`, `_meta.delay_ms`, `_meta.total_requests`) for repeatable load-trend comparisons.
- ✅ Completed: task #55 moved `Next -> In Progress -> Done`; benchmark harness now accepts `--endpoints` for focused path-level latency checks while preserving SLA evaluation on selected targets.
- ✅ Completed: task #18 moved `Next -> In Progress -> Done`; shipped initial frontend interaction benchmark slice with reusable lane-assembly latency summarizer + focused regression test coverage.

- 2026-03-04 13:37 UTC: Completed task #19 slice: added historical trend tracking to CI telemetry regression gate (JSON/CSV outputs include history deltas; new threshold key `max_history_regression_percent`).

- ✅ Completed: task #26 moved `Next -> In Progress -> Done`; authored initial auth E2E matrix covering happy path, invalid credentials, and expired-session handling (`docs/auth/e2e-test-matrix.md`).
- ✅ Completed: task #21 moved `Next -> In Progress -> Done`; added auth schema migration baseline (`backend/migrations/003_auth_accounts_sessions.sql`) for accounts, account-principal roles, and sessions.
- ✅ Completed: task #22 moved `Next -> In Progress -> Done`; added secure auth session-cookie helpers (`newSessionCookie`/`clearSessionCookie`) with focused backend unit tests as the first atomic login/logout flow building block.

- ✅ Completed: task #23 moved `Next -> In Progress -> Done`; shipped initial auth role/permission domain model (`owner|agent|collaborator` + permission matrix helper) with focused regression tests (`backend/tests/auth_role_permissions_test.go`).
- ✅ Completed: task #24 moved `Next -> In Progress -> Done`; added account-principal link persistence helper with audit-event emission (`backend/internal/store/account_principal_links.go`) plus focused coverage (`backend/tests/account_principal_links_test.go`).

- ✅ Completed: task #25 moved `Next -> In Progress -> Done`; added auth hardening baseline checklist in `docs/auth/security-hardening-checklist.md` (password policy, login rate limits, CSRF, secure session handling, and audit events).
- ✅ Completed: task #26 moved `Next -> In Progress -> Done` in this cycle with explicit `samwise` ownership persisted in DB.
- ✅ Completed: board-first filter milestone increment; `/board` now exposes first-class `priority` + `due-window` filters and applies one shared matcher across board lanes + task explorer to avoid route-hopping/filter drift.
- ▶ Next milestone:
  - Board UX: promote due-window presets to reusable chips and persist filter presets in URL templates.
  - Board UX: add explicit lane-level filter summary badges so operators see active constraints at a glance.
  - Unblock #52/#34: record one live worker-outcome artifact and set timeout threshold gate.
