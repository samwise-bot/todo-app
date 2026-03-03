# Todo-App Iteration Checklist (Mirror from App)

_Source of truth is the app API. This file is an export snapshot for quick reference._

## Completed This Iteration
- [x] Re-validated principal/project/board/columns exist for TODO App (`samwise`, `TODO App`, canonical board columns).
- [x] Processed Inbox first (0 `inbox` tasks this cycle).
- [x] Mainline execution: task #12 delivery increment (SPA migration planning), assigned to `samwise`.
- [x] Implemented one atomic docs change: expanded Phase 2 roadmap into explicit migration slices + acceptance criteria in `docs/roadmap.md`.
- [x] Synced architecture delta notes with the roadmap change in `docs/architecture/overview.md`.

## Current App Task Board (Project: TODO App)
- [ ] #34 Ops blocker remains in **Blocked** (`state=waiting`, board `Blocked`) pending real worker completion/timeout evidence.
- [x] #12 Roadmap: SPA migration plan from current server-rendered flows to client-driven UX (**done**, priority=3).
- [ ] #13 Roadmap: Implement SPA shell with persistent board + inspector panels (**next**, priority=3).
- [ ] #14 Roadmap: Unified client state store for tasks/boards/columns/principals (**next**, priority=3).
- [ ] #15 Roadmap: Offline-first cache strategy for SPA (stale-while-revalidate) (**next**, priority=3).

## Verification
- `npm --prefix frontend test -- home-page-routing.test.tsx` ✅
