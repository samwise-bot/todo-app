# Todo-App Iteration Checklist

## Loop Protocol (every run)
1. Inspect this checklist and execute unchecked items immediately.
2. Review design/code completeness; identify gaps and improvements.
3. Implement current docket using Codex CLI in this repo.
4. Self-document + run tests/validation.
5. Rewrite this checklist for next iteration (clear, prioritized, actionable).
6. Report progress in Discord `#todo-app` with commit hash, changed files/areas, tests, and functionality status.

## Current Docket (next run)
- [ ] Build frontend principals + assignment UI (create principal, assign/unassign task).
- [ ] Build frontend board/column CRUD UI against new APIs.
- [ ] Add backend tests for validation edge cases (invalid handles, bad IDs, missing required fields) across principals/boards/columns endpoints.
- [ ] Add weekly-review endpoint scaffold (`/api/reviews/weekly`) with initial stale-task query.
- [ ] Add frontend `lint` and `test` scripts (plus minimal baseline tests) so CI/dev checks exist.
- [ ] Add API docs examples for new routes (request/response snippets).
