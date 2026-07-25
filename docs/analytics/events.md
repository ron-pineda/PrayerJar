# PrayerJar Analytics — What Is Actually Collected

**Owner:** Analytics · **Created:** 2026-07-24 (pj-s26-03, Sprint 26)
**Supersedes the implementation assumptions in** `church-funnel-spec.md` (Sprint 17) — that
document's event *schema* is still the reference; its assumption that the events are being
collected is not. See §2.

---

## 1. The stack, and why

| Concern | Tool | Where |
|---|---|---|
| Traffic (pageviews, referrers, devices, Web Vitals) | Vercel Web Analytics | `src/components/web-analytics.tsx`, mounted in `src/app/layout.tsx` |
| **Signup-source attribution** | **Neon — `users` attribution columns** | `src/lib/attribution.ts`, `src/proxy.ts`, `src/services/attribution.service.ts` |

Ron's decision, 2026-07-24: no new third-party behavioural vendor. PostHog, Plausible and Fathom
were considered and explicitly rejected — PrayerJar handles deeply personal content and that data
is not leaving for a vendor whose business is behavioural analytics. Vercel is already a
sub-processor for hosting, so pageview collection adds no new party.

## 2. What the Vercel Hobby plan actually collects — read this before writing a `track()` call

From <https://vercel.com/docs/analytics/limits-and-pricing> (fetched 2026-07-24):

| | Hobby | Pro | Pro + Web Analytics Plus |
|---|---|---|---|
| Included events / month | 50,000 | metered | metered |
| Reporting window | **1 month** | 12 months | 24 months |
| **Custom Events** | **not included** | included | included |
| Properties per custom event | — | **2** | 8 |
| **UTM Parameters** | **not included** | **not included** | included |

Three consequences, all load-bearing:

1. **`track()` does nothing on this plan.** The twelve typed wrappers in `src/lib/analytics.ts` and
   `src/lib/analytics.server.ts` — the whole Sprint 17/18 church funnel — are no-ops in production
   and have never produced a data point. The code is correct; the plan does not collect it.
   **Do not add new `track()` calls expecting to see them.**
2. **UTM breakdown is not available even on Pro.** It is a Plus add-on. This is why signup
   attribution lives in our own database and not in Vercel.
3. **The property cap would bite even after an upgrade.** `trackPlanUpgraded` passes 7 properties
   and `trackSignupComplete` 4, against a Pro cap of 2. Latent, not fixed — out of scope for
   Sprint 26, but it must be resolved before anyone pays for Pro expecting those events to work.

**What Hobby does give us, free and working now:** pageviews by path, referrer, country, device,
browser, and Web Vitals, on a rolling 1-month window. At n=6 that is genuinely enough to see
whether an outreach push moved traffic.

## 3. PII rules — non-negotiable

Prayer content, prayer IDs, testimony text and user email must never reach an analytics
destination.

`@vercel/analytics/next` does **not** give this for free. Its `useRoute()` hook
(`node_modules/@vercel/analytics/dist/next/index.mjs`) sends **both** a `route` (`/p/[id]`) **and**
a raw `path` (`/p/<uuid>`) on every pageview. Verified in a real browser session, the pre-redaction
payload was:

```json
{ "route": "/p/[id]", "path": "/p/8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8" }
```

`src/lib/analytics-redact.ts` closes this via the `beforeSend` hook:

- any UUID-shaped path segment → `[id]`;
- any segment under a known ID parent (`/p`, `/testimony`, `/groups`, `/events`, `/chains`,
  `/prayer`, `/wrapped`) → `[id]`, so redaction survives a future ID-format change;
- query string reduced to an allowlist (`utm_*`, `ref`) — this drops `?q=` search terms and the
  `?text=` prayer content that OG card URLs carry;
- fragment stripped.

Events are rewritten, never dropped, so pageview counts stay accurate.

## 4. Signup-source attribution (the part that answers "which channel works")

Two steps, first-touch:

1. **`src/proxy.ts`** stamps a `pj_attr` cookie on the first HTML document an anonymous visitor
   requests. Skipped for: an existing cookie (first touch always wins), authenticated sessions,
   prefetches, non-document requests, and `/api/*`.
2. **`events.createUser`** in `src/lib/auth.ts` calls `recordSignupAttribution()`, which reads the
   cookie and writes it onto the new `users` row. The UPDATE is guarded by
   `acquisition_source IS NULL`, so it is idempotent and can never overwrite a recorded channel.

NextAuth v5's `createUser` event receives only `{ user }` — no request object (verified in
`node_modules/@auth/core/index.d.ts:367`). The cookie is what carries the request context across
that boundary.

### Columns (migration `0033_user_signup_attribution.sql`)

| Column | Meaning |
|---|---|
| `acquisition_source` | `direct` · `organic_search` · `social` · `email` · `paid` · `referral` · `campaign` |
| `utm_source`, `utm_medium`, `utm_campaign` | verbatim, length-capped at 128 |
| `signup_referrer` | referrer **origin + path only** — query string dropped |
| `signup_landing_path` | first page seen, **redacted** through §3's rules |

Names mirror `churches.acquisition_source` / `utm_*` so church-side and user-side acquisition
report with one vocabulary.

**Privacy:** `signup_referrer` drops the referrer query string because a search-engine referrer can
carry the user's search terms — for a prayer app those terms can be extraordinarily sensitive
(`?q=prayer for my dying father`). `signup_landing_path` stores `/p/[id]`, never a prayer ID.

The 6 pre-existing users predate this and stay `NULL`. **Do not backfill** — a guessed channel is
worse than a known gap at this sample size.

### The query this exists to answer

```sql
SELECT
  coalesce(acquisition_source, 'unknown') AS channel,
  utm_campaign,
  count(*) AS signups,
  min(created_at) AS first_signup
FROM users
WHERE created_at >= now() - interval '30 days'
GROUP BY 1, 2
ORDER BY signups DESC;
```

**Limitation to state every time this is reported:** first-touch only. A visitor who arrives via
search, leaves, and returns direct a week later is attributed to search. At n=6, treat any
breakdown as anecdote, not statistics — this instrumentation earns its keep at n=100, not n=6.

## 5. Event schema (Sprint 17/18) — retained, dormant

The twelve events specified in `church-funnel-spec.md` remain wired and correctly typed. They are
**not collected** on Hobby (§2). Leave them in place: they cost nothing, and the schema is the
thing that would take time to rebuild if the plan ever changes. Do not report on them, and do not
add more.

## 6. Schema change log

| Date | Change | Backward-compatibility impact |
|---|---|---|
| 2026-07-24 | `beforeSend` redaction added to Web Analytics | Pageview paths for `/p/[id]`, `/testimony/[id]`, `/groups/[id]` change shape from raw-ID to `[id]`. Pageviews collected before this deploy were recorded with raw IDs in the path; the Hobby reporting window is 1 month, so they age out of the reporting UI. |
| 2026-07-24 | `users` attribution columns added (migration 0033) | Additive, all nullable. No existing query affected. |

## 7. Migration convention note

`0033_user_signup_attribution.sql` has a `_journal.json` entry and **no** `meta/0033_snapshot.json`.
That is deliberate and matches the established pattern: `meta/` holds snapshots only through
`0028_snapshot.json`, and every hand-written migration since (0029-0032) is journalled without one.
`drizzle-kit generate` has not been the application path for this repo since 0029 — the
`scripts/apply-NNNN-runner.mjs` runners are. Do not run `generate` against prod expecting a clean
diff; prod Neon has drifted and it will emit unrelated statements.
