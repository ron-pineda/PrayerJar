# QA Sign-Off — Sprint 18 ChMS Integration

**Date:** 2026-04-18
**Status:** PENDING — sandbox credentials required
**Task:** pj-s18-13-qa-pco-integration-tests
**Test file:** `src/lib/chms/adapters/PlanningCenterAdapter.integration.test.ts`

---

## Prerequisites

To run integration tests, the following must be completed by a human:

1. Create a free Planning Center organization at [planningcenter.com](https://planningcenter.com)
2. Register an OAuth app at [api.planningcenteronline.com/oauth/applications](https://api.planningcenteronline.com/oauth/applications)
   - Redirect URI: `http://localhost:3000/api/auth/chms/callback/planning-center`
   - Required scopes: `people groups`
3. Run the OAuth authorization flow manually (or via curl) to obtain access and refresh tokens
4. Set the following env vars in `.env.local` (never commit these):

```
PCO_SANDBOX_CLIENT_ID=<your-oauth-app-client-id>
PCO_SANDBOX_CLIENT_SECRET=<your-oauth-app-client-secret>
PCO_SANDBOX_ACCESS_TOKEN=<manually-obtained-access-token>
PCO_SANDBOX_REFRESH_TOKEN=<manually-obtained-refresh-token>
PCO_SANDBOX_CHURCH_ID=sandbox-church            # optional, any string
NEXT_PUBLIC_APP_URL=http://localhost:3000       # for test 6 (CSRF)
```

5. Run the integration tests:
   ```
   npx vitest run src/lib/chms/adapters/PlanningCenterAdapter.integration.test.ts
   ```

**Note:** Without `PCO_SANDBOX_CLIENT_ID` set, all 8 tests are automatically skipped (the suite uses `describe.skipIf`). Unit tests in `PlanningCenterAdapter.test.ts` remain unaffected.

---

## Test Results

| # | Scenario | Status | Notes |
|---|---|---|---|
| 1 | OAuth token validity — GET /people/v2/me → 200 + Person type | PENDING | |
| 2 | listMembers happy path — ≥1 ChmsMember with valid shape | PENDING | |
| 3 | listMembers pagination — all pages fetched (requires >100 sandbox members) | PENDING | |
| 4 | listGroups happy path, or graceful 403 if Groups not licensed | PENDING | |
| 5 | syncMember upsert — completes without error (DB mocked) | PENDING | |
| 6 | OAuth CSRF protection — mismatched state → 400 (requires running app) | PENDING | |
| 7 | Rate limiter pacing — 3 sequential calls, no 429 received | PENDING | |
| 8 | Token refresh — expired tokenExpiresAt, adapter auto-refreshes on 401 | PENDING | |

---

## Known Limitations / Conditional Tests

- **Test 3 (pagination):** Requires >100 members in the sandbox org. If the org has ≤100 members, the test logs a skip reason and passes vacuously. To exercise this path, add >100 people to the PCO sandbox org.
- **Test 6 (CSRF):** Requires `NEXT_PUBLIC_APP_URL` pointing to a running app instance (local or staging). Without it, the test logs a skip reason and passes vacuously.
- **Test 8 (token refresh):** The adapter refreshes on PCO's 401 signal (server-side), not on client-side `tokenExpiresAt`. A past `tokenExpiresAt` is passed to document intent; the actual refresh is triggered only if PCO returns 401.

---

## Blocker

Sandbox credentials must be obtained manually. This task is blocked on:

> **Human action required:** Set up a PCO free org + register OAuth app + obtain access/refresh tokens, then set the env vars listed above.

Store credentials in the team password manager (do not commit to `.env.local` or any tracked file).

---

## Sign-Off Decision

Fill in when running against the real sandbox:

- [ ] All 8 scenarios pass → **APPROVED** — Sprint 18 PCO integration work is complete
- [ ] Issues found → See Notes column above for specific failures and remediation steps

**QA Agent signature:** _______________
**Date completed:** _______________
