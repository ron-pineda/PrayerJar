# pj-s26-03 — Funnel Instrumentation

**Agent:** Analytics · **Date:** 2026-07-24 · **Sprint 26** · **Gates 04/05/06**
**Status for PM to record:** `review`

---

## Headline correction — the Sprint 17 funnel has never collected a single data point

Vercel Web Analytics **Custom Events are not included on the Hobby plan**
(<https://vercel.com/docs/analytics/limits-and-pricing>, fetched 2026-07-24). The twelve `track()`
wrappers in `src/lib/analytics.ts` and `src/lib/analytics.server.ts` — the entire church
acquisition funnel built in Sprint 17 (`pj-s17-funnel-instrumentation`, Reviewer-**approved**,
marked `done`) and extended in Sprint 18 — are **no-ops in production**. The code is correct. The
plan does not collect it.

Two further facts from the same pricing table:

- **UTM parameters are not collected on Hobby *or* Pro** — they are a "Web Analytics Plus"
  $10/mo add-on. Even upgrading to Pro would not answer "which campaign produced this signup."
  This independently vindicates the decision to put attribution in our own DB.
- **Properties per custom event cap at 2 on Pro** (8 on Plus). `trackPlanUpgraded` passes 7 and
  `trackSignupComplete` 4. Latent defect, left in place — out of Sprint 26 scope, but it must be
  resolved before anyone pays for Pro expecting those events to work.

**Consequence for the sprint:** kickoff gate "Instrumentation — events verified in the destination
from a real browser session" is **unsatisfiable as written** on this plan. Custom events are not
collected, so there is no destination to verify them in. Recommend PM restate the gate as
*"pageview redaction and attribution capture verified from a real browser session"* — which is
satisfied, with evidence below.

## Also wrong in the brief (minor)

- "add `@vercel/analytics` to the app" — it was already there since Sprint 17.
  `@vercel/analytics@2.0.1` in `package.json`, `<Analytics />` mounted at `src/app/layout.tsx:15`.
  Nothing to install.
- "follow the `apply-NNNN-runner.mjs` pattern used by previous migrations (e.g. 0030)" — the
  latest migration is **0032**, not 0030. Runners exist for 0030, 0031 and 0032. This migration is
  **0033**, patterned on `scripts/apply-0032-runner.mjs`.

## A real PII leak, found and closed

`@vercel/analytics/next` sends **both** a `route` (`/p/[id]`) **and** a raw `path` (`/p/<uuid>`)
on every pageview — `useRoute()` in `node_modules/@vercel/analytics/dist/next/index.mjs` passes
`usePathname()` through untouched. Captured from a real browser before the fix:

```json
{ "route": "/p/[id]", "path": "/p/8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8" }
```

So prayer and testimony IDs **were** leaving the browser. Closed with a `beforeSend` hook
(`src/lib/analytics-redact.ts`), which also strips `?q=` search terms and the `?text=` prayer
content that OG-card URLs carry.

## What was built

| File | Purpose |
|---|---|
| `src/lib/analytics-redact.ts` | Pure PII redaction for pageview URLs |
| `src/components/web-analytics.tsx` | Client boundary — `beforeSend` is a function prop, so it cannot be passed from the server layout |
| `src/app/layout.tsx` | `<Analytics />` → `<WebAnalytics />` |
| `src/lib/attribution.ts` | First-touch derivation, channel classification, cookie codec |
| `src/proxy.ts` | Stamps the `pj_attr` first-touch cookie |
| `src/services/attribution.service.ts` | Writes attribution onto the users row |
| `src/lib/auth.ts` | Calls it from `events.createUser` |
| `src/db/schema.ts` + `0033_user_signup_attribution.sql` + journal | 6 nullable columns + partial index |
| `scripts/apply-0033-runner.mjs` | **Staged, NOT run** |
| `docs/analytics/events.md` | Schema, plan reality, privacy rules, the reporting query |

**Design notes.** NextAuth v5's `createUser` receives only `{ user }` — no request object
(`node_modules/@auth/core/index.d.ts:367`), which is why a cookie carries the context. First-touch
is enforced twice: the proxy never overwrites an existing cookie, and the UPDATE is guarded by
`acquisition_source IS NULL`. Column names mirror `churches.*` for one shared vocabulary. The
attribution write is wrapped in its own try/catch — an analytics failure must never block a signup,
same reasoning as the welcome-email guard directly below it.

## Gate output (verbatim)

```
$ npx tsc --noEmit
EXIT=0 (0 errors)

$ npx vitest run
 Test Files  64 passed (64)
      Tests  513 passed (513)

$ npx next build
✓ Compiled successfully in 8.5s
✓ Generating static pages using 31 workers (108/108) in 470ms
```

459 → **513** passing (+54 new tests). tsc holds at 0. Build holds at 108/108.

## Evidence that it fires

**1. Redaction — real Chromium session against the dev server, observing only (no patching of
`window.va`; the library's queue and the real Vercel collection script left untouched). These are
the lines the Vercel script itself logged:**

```
browser URL: http://localhost:3000/p/8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8
  [Vercel Web Analytics] [view] http://localhost:3000/p/[id]  ...  /_vercel/insights/view

browser URL: http://localhost:3000/browse?q=cancer
  [Vercel Web Analytics] [view] http://localhost:3000/browse  ...  /_vercel/insights/view

browser URL: http://localhost:3000/for-churches?utm_source=facebook&utm_medium=social
  [Vercel Web Analytics] [view] http://localhost:3000/for-churches?utm_source=facebook&utm_medium=social
```

Prayer UUID redacted, search query dropped, campaign params preserved.

**2. Attribution cookie — live `next dev` server, real `Set-Cookie` headers:**

| Request | Stamped value |
|---|---|
| `/` | `{"acquisitionSource":"direct",...,"landingPath":"/"}` |
| `/for-churches?utm_source=bulletin&utm_medium=email&utm_campaign=advent` | `{"acquisitionSource":"email","utmSource":"bulletin","utmMedium":"email","utmCampaign":"advent","landingPath":"/for-churches"}` |
| referer `https://www.google.com/search?q=prayer+for+my+dying+father` | `{"acquisitionSource":"organic_search","referrer":"https://www.google.com/search",...}` — **search terms dropped** |
| referer `https://m.facebook.com/groups/123` | `{"acquisitionSource":"social",...}` |
| `/p/<uuid>` | `{"landingPath":"/p/[id]"}` — **prayer ID redacted** |
| repeat visit with cookie present | *no cookie set* (first touch wins) |
| `accept: image/avif` | *no cookie set* |

## Not verified — stated plainly

The final hop (real signup → INSERT → attribution UPDATE) was **not** run end-to-end, because
`.env.local` `DATABASE_URL` points at `ep-sparkling-frog-an55oepf-pooler...neon.tech/neondb`,
which appears to be the production branch. Writing a test user there would violate both the brief
and the Analytics role's read-only-on-production rule. The write path is covered by 6 unit tests
asserting the exact drizzle payload. **Ron should confirm with one real signup after applying 0033.**

## For Ron — the migration command

Not run. Staged only.

```
1. Put the prod DATABASE_URL into .env.production.tmp at the repo root
2. node scripts/apply-0033-runner.mjs
```

Additive only (6 nullable `text` columns + 1 partial index), every statement `IF NOT EXISTS`, safe
to re-run. The runner verifies each column and the index by name post-apply, prints the unchanged
`users` row count, aborts if `users` is missing, redacts connection strings from errors, and
deletes `.env.production.tmp` on exit pass or fail.

**Deploy ordering:** apply 0033 **before** deploying this branch. `recordSignupAttribution()` runs
on every new signup, and while its try/catch means a missing column cannot break signup, any
signup between deploy and migration loses its attribution permanently.

## Commit bookkeeping — a parallel-agent collision the PM should know about

All of this work landed in commit **`c386164`**, whose message is
*"fix(seo): repair OG cards, close open category slugs, correct the sitemap"* — the Growth agent's.

Cause: three agents share one working tree and one git index. The Growth agent ran `git add` and
`git commit` in the window between my `git add` and my `git commit`, so their commit swept in
every staged file, mine included. My commit then found nothing left to commit.

**Nothing is lost** — verified every pj-s26-03 file and every edit to shared files is present at
`HEAD`. I deliberately did **not** rewrite history to split the commits: two other agents have work
in flight on this branch, and a rebase would risk destroying it. The commit message is wrong; the
tree is correct.

**Process fix for future sprints:** parallel agents must not share a git index. Either give each
agent a worktree, or serialise commits through the PM. `git add` + `git commit` is not atomic
across agents.

## Recommendation

Attribution is now a database question, not a vendor question — the right shape for this product.
Do **not** upgrade to Pro for the funnel events: UTM breakdown still would not be included, and the
2-property cap would silently truncate the existing events. The DB columns answer the channel
question better and cost nothing.

At n=6 this instrumentation cannot yet tell a working channel from a broken one — it earns its keep
at n≈100. It is a prerequisite for tasks 04/05/06, not a result.
