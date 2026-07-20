# Sprint 24 — QA Report

**Task:** pj-s24-10-qa-pass · **Date:** 2026-07-20 · **Result: PASS**

Sprint 24 covered production readiness and a signed-in UI/UX polish pass, resumed after the
project sat idle from late April. Verification below was run against the working tree, a clean
production build, and the live deployment.

## Automated gates

| Gate | Baseline (HEAD at sprint start) | After sprint | Verdict |
|---|---|---|---|
| Vitest | 455 passing, 5 failing | **459 passing, 0 failing** | PASS |
| `tsc --noEmit`, app code | 0 errors | **0 errors** | PASS |
| `tsc --noEmit`, test fixtures | 193 errors | 193 errors | No regression (pre-existing) |
| ESLint | 138 errors, 93 warnings | **137 errors, 88 warnings** | PASS (net improvement) |
| `next build` | **failed** | **passes** — compiles ~10s, TS ~13s, 108/108 pages | PASS |

The five original test failures were stale mocks trailing intentional Sprint 21–23 service
changes, not product regressions; four new tests were added while fixing them. One further test
(`auth.test.ts`) was a latent flake — it imports the entire auth graph against a 5s default and
failed only under full-suite parallel load — and now carries an explicit timeout.

The remaining 193 type errors are all in `.test.ts` fixtures (mock objects missing schema fields
added in later sprints). They pre-date this sprint and are unchanged by it. Worth a dedicated
task; they are not a product risk.

## Live verification (production)

- `/api/health` returns `{"status":"ok","db":true,"email":true}`.
- Twelve public pages return 200 and render **zero emoji**, with Lucide icons in their place
  (homepage 22 icons, /pray 34, /browse 11, /praise-wall 10, /find-a-church 13, /sign-in/verify 12).
- Signed-in routes correctly 307 to sign-in when unauthenticated.
- `/sign-in/verify` resolves with a single query string, and the legacy `/sign-in?verify=1`
  redirects to it.
- Magic-link sign-in works on apex and subdomain (verified during the outage fix; Ron confirmed
  the browser-side cookie scoping and session isolation).

## Scope notes

Three items went beyond the literal task descriptions, each recorded in `tasks.json`:

1. **Arrow chrome swept app-wide** (34 sites) rather than the audit's two pages. A half-swept
   convention — Lucide arrows on the dashboard, text arrows on its own subpages — would have read
   worse than either consistent state. Prose arrows ("Settings → Integrations") and email
   templates were deliberately left alone; email HTML cannot render React icons.
2. **Emoji stragglers outside the audited nine pages** were caught only because local rendering
   was restored mid-sprint, which turned a source audit into an actual render check. The
   feedback widget is fixed-position on every page and was the most visible violation left.
3. **Perf P1 declined.** See `perf-audit.md` — find-a-church has no static content to hoist, so
   the recommended refactor would move an empty wrapper at real risk. The genuine gap it pointed
   at, SEO metadata, was filled instead.

## Open items for a future sprint

- 193 type errors in test fixtures.
- `docs/guide` drives section identity from an `emoji` field in a data structure — a Designer
  decision, not a mechanical swap.
- Three `<img>` tags remain by design (object-URL preview, Google avatar needing
  `referrerPolicy`, embed widget that must not pull the Next image loader).
- Bundle-analyzer run, now unblocked by the restored local build.
