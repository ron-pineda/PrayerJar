# Sprint 15 Retrospective — Stability & Quality Hardening

**Date closed:** 2026-04-16
**Duration:** 1 day (single-session sprint)
**Reviewer sign-off:** all 6 archaeology buckets verified / limitation-noted

---

## What Was Shipped

### Workstream A — Bug Archaeology (Architect)
- 96 `fix:` commits analyzed, tagged into 6 in-scope failure buckets + 26 out-of-scope.
- Matrix committed at `docs/superpowers/specs/2026-04-16-sprint-15-bug-archaeology.md`.
- Every bucket mapped to an owning Sprint 15 task. No test/tool/gate added without a real past bug behind it.

### Workstream B — Observability (Backend Engineer)
- `@sentry/nextjs@10.49.0` installed; client, server, edge configs committed.
- `instrumentation.ts` dispatches by `NEXT_RUNTIME`.
- `next.config.ts` wrapped with `withSentryConfig` — security headers preserved.
- Synthetic error endpoint `/api/debug/sentry`, bearer-token gated.
- Runbooks: `docs/superpowers/runbooks/better-stack-setup.md`, `sentry-alerts.md`.

### Workstream C — Playwright E2E (Frontend Engineer)
- `playwright.config.ts` — 4-project matrix (chromium-desktop, mobile-safari, messenger-webview, instagram-webview).
- 8 specs: oauth-redirect, magic-link, add-prayer-homepage, add-prayer-my-prayers, pray-for, share-prayer, prayer-card-overflow, global-setup fixture.
- Debug endpoints: `/api/debug/magic-link`, `/api/debug/seed-prayer` (both 404-in-prod-without-token).
- `authedPage` fixture via `e2e/fixtures/auth.ts` + `e2e/global-setup.ts`.

### Workstream D — Integration Tests (Backend + Database Engineer)
- `.github/workflows/neon-branch.yml` spins a Neon preview branch per PR.
- `src/test/integration/setup.ts` — integration harness (requires `DATABASE_URL`).
- Three integration specs: `driver-quirks`, `interaction.single-fire`, `prayer.authz`.

### Workstream E — CI Pipeline (Backend Engineer)
- `.github/workflows/ci.yml` — 4 jobs: unit/typecheck/lint, integration, e2e, lighthouse.
- `lighthouserc.json` — Lighthouse performance + a11y budget.
- `scripts/post-deploy-smoke.mjs` — 18 routes, runs on every deploy + every 6h via `.github/workflows/post-deploy-smoke.yml`.
- Sentry release registration wired into `.github/workflows/deploy.yml`.

---

## Bucket Verification Results

| # | Bucket | Control | Result |
|---|--------|---------|--------|
| 1 | oauth-cookie | `e2e/sign-in-oauth-redirect.spec.ts` | **VERIFIED** — assertion fails if `__Secure-` prefix returns or cookie-dependent `checks: ['state']` re-added |
| 2 | driver-data | `src/test/integration/driver-quirks.integration.test.ts` | **VERIFIED** — AST guard regex matches historical bug pattern `sql`...= ANY(...)`; inArray integration test covers happy path |
| 3 | prod-drift | `scripts/post-deploy-smoke.mjs` | **VERIFIED** — 18/18 routes green in live run; 404-injection simulation exits non-zero |
| 4 | dialog-state | `e2e/add-prayer-homepage.spec.ts` + `e2e/add-prayer-my-prayers.spec.ts` | **VERIFIED** — both assert dialog visibility and URL preservation; regressions from a31b05c / c990752 would fail |
| 5 | interaction-side-effect | `e2e/pray-for.spec.ts` (primary) + `interaction.single-fire.integration.test.ts` (doc-only) | **LIMITATION NOTED** — see below |
| 6 | authz-moderation | `src/services/prayer.authz.integration.test.ts` | **VERIFIED** — non-owner `updatePrayer`→null, `deletePrayer`→false asserted; removing WHERE authorId clause would break tests |

### Bucket #5 Limitation

`prayerInteractions` has **no unique constraint** on `(prayerId, userId)`. The integration test `interaction.single-fire.integration.test.ts` explicitly documents this in a comment — a double-fire call creates two rows, and the test currently asserts only `rows.length >= 1`. The test will PASS whether the system single-fires or double-fires.

The real safety net for bucket #5 is `e2e/pray-for.spec.ts`, which instruments `page.on('request')` to count POST requests fired by the pray action and asserts `prayRequests <= 1`. Any UI regression that double-submits will be caught there, not at the DB integration layer.

**Sprint 16 should address:** add a unique partial index on `(prayerId, userId) WHERE is_anonymous = false` (or an app-layer idempotency key) so that DB-level duplicates are prevented and the integration test can tighten its assertion to `rows.length === 1`.

---

## Unit Test Results

- 30 test files pass / 5 pre-existing files fail (30 pass + 5 fail = 35 total).
- 190 tests pass / 6 tests fail (190 pass + 6 fail = 196 total).
- **All 6 failing tests pre-date Sprint 15** — they stem from `db.select(...).from(...).leftJoin is not a function` mocking issues in:
  - `src/services/church-platform.service.test.ts` (commit 09b1f6d, Sprint 5.1)
  - `src/services/__tests__/event.service.test.ts` (commit 35fd48e, Sprint 5.4)
  - `src/app/api/v1/checkout/route.test.ts` (pre-existing Stripe mock drift)
  - `src/app/api/webhooks/stripe/route.test.ts` (pre-existing Stripe mock drift)

**Not a Sprint 15 regression**, but should be cleaned up in a future housekeeping pass.

---

## Smoke Test Results

```
200  /
200  /pray
200  /browse
200  /praise-wall
200  /find-a-church
200  /know-jesus
200  /about
200  /privacy
200  /terms
200  /contact
200  /sign-in
200  /docs
200  /for-churches
200  /give
200  /press
200  /partners
200  /help
200  /map

OK: all 18 routes reachable
```

Simulated failure (injected non-existent route): exit=1, "Smoke FAILED" output — confirms failure path works.

---

## Human Actions Required (blocking full CI benefit)

Before the CI pipeline + observability stack can function end-to-end, a human must:

1. **Add 7 GitHub repo secrets:**
   - `NEON_INTEGRATION_DB_URL` (preview branch connection string)
   - `NEON_PROJECT_ID` + `NEON_API_KEY` (for the Neon branch workflow)
   - `E2E_BASE_URL` (Playwright target)
   - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (for sourcemap + release upload)
   - `SENTRY_DEBUG_TOKEN` (for magic-link e2e + debug endpoints)

2. **Add Vercel env vars:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_DEBUG_TOKEN`.

3. **Install Better Stack Vercel integration** — see `docs/superpowers/runbooks/better-stack-setup.md`.

4. **Create Sentry auth-error-rate alert rule** — see `docs/superpowers/runbooks/sentry-alerts.md`.

Until these are configured, Sentry reports nothing, the Neon-branch PR preview can't connect, and the integration job in ci.yml will skip.

---

## What Sprint 16 Should Address

1. **Close Bucket #5 at the DB level.** Add a unique partial index on `prayer_interactions (prayer_id, user_id)` so duplicate-submit regressions fail at the write, not just at the e2e POST count. Tighten the integration test assertion from `>= 1` to `=== 1`.

2. **Clean up the 6 pre-existing unit test failures.** They spam the test output and mask real regressions. Either fix the Drizzle mocks or delete the tests and rely on integration coverage.

3. **Exercise the full CI pipeline on a real PR** once GitHub secrets are in place. The first real run will flush out any workflow-config bugs we couldn't verify locally (Neon branch provisioning, Playwright sharding, Lighthouse budget thresholds).

4. **Add a second-language e2e run** (if/when i18n lands) — the current specs are English-only.

5. **Consider promoting the AST guard** from a test into a lint rule (ESLint custom rule or ban-plugin) so violations surface at typecheck time instead of test time.
