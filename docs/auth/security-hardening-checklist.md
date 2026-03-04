# Auth Security Hardening Checklist

## Scope
Initial implementation checklist for TODO App auth hardening (single-user now, multi-user ready).

## Checklist
- [ ] Password policy enforced server-side (minimum length, breachable/common-password guard, normalization).
- [ ] Login rate limiting per IP + per account identifier with bounded retry window.
- [ ] CSRF protections enabled for cookie-authenticated state-changing routes.
- [ ] Session cookies set with `HttpOnly`, `Secure`, and `SameSite=Lax` (or stricter where compatible).
- [ ] Session fixation protection (rotate session id on login and privilege changes).
- [ ] Logout invalidates server-side session state and clears cookie.
- [ ] Failed auth attempts produce generic error responses (no account enumeration leaks).
- [ ] Auth events audited (`login.success`, `login.failed`, `logout`, `session.revoked`) with actor/account context.
- [ ] Sensitive secrets/config sourced from environment and never committed.
- [ ] Baseline auth threat model documented and linked from ADRs.

## Verification Targets
- Focused backend tests for cookie/security headers and login throttling behavior.
- Manual browser verification for CSRF/session-cookie semantics.
- CI regression gate for auth unit tests before merge.

## Ownership
- Project: TODO App
- Principal: samwise
