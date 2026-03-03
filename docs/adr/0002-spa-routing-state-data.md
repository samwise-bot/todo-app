# ADR 0002: SPA architecture baseline (routing, state, data fetching)

- Status: Accepted
- Date: 2026-03-03
- Deciders: samwise

## Context
The TODO App currently renders a single dashboard surface with server-driven actions. The roadmap requires a migration to a route-based SPA while preserving GTD board reliability and deterministic task ordering.

## Decision
Adopt an incremental SPA baseline with:

1. **Route split first**
   - `/board` as the default execution surface
   - Reserve `/tasks`, `/projects`, `/people`, `/settings` as dedicated route domains
   - Keep root (`/`) redirecting to `/board` during migration

2. **State model**
   - Use a normalized client cache keyed by entity type/id (`tasks`, `projects`, `boards`, `columns`, `principals`)
   - Derive board lanes from cached entities via selectors, not duplicated lane-local state
   - Persist only UI preferences locally (filters, collapsed panels, sort toggles)

3. **Data fetching policy**
   - Server remains source of truth
   - Use stale-while-revalidate semantics for lane reads
   - Route actions perform optimistic updates only for reversible mutations; rollback on API conflict

4. **Ordering guarantee**
   - `Next` ordering remains deterministic: `priority ASC`, then `dueAt ASC (nulls last)`, then `id ASC`
   - Client and server must share this comparator to avoid drift

## Consequences
- Enables low-risk decomposition from monolith dashboard to route-specific pages.
- Reduces future regressions by codifying state ownership and ordering contract.
- Requires follow-up implementation tasks for route extraction and shared selector utilities.

## Follow-ups
- Implement route extraction for `tasks/projects/people/settings`.
- Add selector unit tests for deterministic Next ordering in client state layer.
- Add API contract assertion to verify backend ordering matches comparator.
