# Auth E2E Test Matrix

Scope: single-user TODO App auth rollout.
Owner: samwise.

## Scenarios
1. **AUTH-E2E-001 Happy path login/logout**
   - Given a valid account
   - When login is submitted with valid credentials
   - Then app issues secure session cookie, protected routes load, and logout clears session.

2. **AUTH-E2E-002 Invalid credentials rejected**
   - Given an existing account
   - When login is submitted with wrong password
   - Then API returns auth error, no session cookie is issued, and UI shows non-leaky error copy.

3. **AUTH-E2E-003 Expired session handling**
   - Given an expired/invalidated session cookie
   - When user requests a protected endpoint
   - Then API returns unauthorized, UI redirects to login, and post-login redirect resumes prior intent.

## Acceptance
- Every scenario mapped to one automated E2E spec before auth epic closure.
- Failures emit structured log markers for CI triage (`auth_e2e_case`, `status`).
