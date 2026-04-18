# /for-churches — SEO & Conversion Funnel Audit

**Date:** 2026-04-17
**Author:** Growth agent
**Target page:** `src/app/(public)/for-churches/page.tsx` (live at https://prayerjar.org/for-churches)
**Context:** Pre–Sprint 17 audit to anchor the forthcoming rework of the churches marketing/pricing page.

---

## TL;DR (the biggest finding, first)

**The `/for-churches` page has no page-specific SEO metadata at all.** The file is a `'use client'` React component, and in the Next.js App Router a client component cannot export `const metadata`. Google sees the root layout's generic title (`"Prayer Jar"`) and description (`"A global prayer jar — share your heart, intercede for others."`) — neither contains the words "church," "prayer wall," "pastoral care," or anything a pastor would search for. Until this is fixed, the page cannot rank for anything. Everything else in this audit — keyword strategy, CRO changes, funnel instrumentation — is downstream of getting this right.

---

## Section 1 — SEO Audit (current state)

### 1.1 Indexability

- **robots.ts:** `src/app/robots.ts` allows `/` and disallows `/api/`, `/admin/`, `/church/`. `/for-churches` is allowed. Good.
- **sitemap entry:** Present. `src/app/sitemap.ts` line 18: `{ url: ${baseUrl}/for-churches, changeFrequency: 'monthly', priority: 0.7 }`. Good.
- **Meta robots on the page:** Not set — inherits defaults (indexable). Good.
- **Side finding (not /for-churches, but germane):** `robots.ts` disallows `/church/` while `sitemap.ts` emits a `${baseUrl}/church/${slug}` entry for every registered church (sitemap.ts lines 41–50). Every public church profile page is being submitted to Google and then blocked by robots.txt. This is a bug — either the public church profiles should be crawlable (remove `/church/` from disallow), or the sitemap should not emit them. File a separate ticket.

### 1.2 Title tag & meta description (quoted)

The file does **not** export `metadata` or `generateMetadata`. It cannot — `'use client'` is declared on line 1. The page inherits the root layout (`src/app/layout.tsx` lines 21–41) verbatim:

- **Title:** `"Prayer Jar"`
- **Description:** `"A global prayer jar — share your heart, intercede for others."`
- **Open Graph title:** `"Prayer Jar"`
- **Open Graph description:** `"A global prayer jar — share your heart, intercede for others."`
- **Twitter card:** `summary_large_image` with the same generic title/description
- **OG image:** `/opengraph-image` (generic site card, not churches-specific)

None of those strings contain "church," "prayer wall," "pastoral," "congregation," "ministry," or any keyword a decision-making pastor would type into Google. Google has nothing to rank this page on beyond body copy.

### 1.3 Keyword targeting (from H1/H2 structure)

- **H1 (line 64):** "Bring your church's prayer life online"
- **H2s:** "Everything your church needs," "Plans," "Common questions"
- **Eyebrow (line 62):** "For churches & ministries"

The H1 is emotionally resonant but **keyword-thin**. "Prayer life online" is not a query anyone searches. A pastor researching options types phrases like "church prayer wall software," "prayer request app for churches," "private prayer wall," or "pastoral care software." The H1 does not contain any of those exact-match phrases.

### 1.4 Open Graph / social share

Inherited generic root OG only. No page-specific OG image, OG title, or OG description for `/for-churches`. A pastor sharing the link in a Slack/Discord for church staff sees a generic prayer-jar unfurl, not a churches-specific card.

### 1.5 Internal linking to /for-churches

Grep results: only three internal entry points to `/for-churches`:
- `src/app/layout.tsx` line 121 — **footer link** (sitewide)
- `src/app/(public)/docs/paid/page.tsx` lines 324, 439 — from the paid-docs article
- `src/app/(public)/docs/churches/page.tsx` line 440 — from the churches-docs card grid

**The homepage (`src/app/(public)/page.tsx`) has no link to `/for-churches`.** The page's only site-chrome backlink is from the footer. For a page that's meant to drive Starter/Pro conversions, that is underpowered internal linking — Google's PageRank flows through anchor text and context, and a single sitewide footer link tells the crawler this is low-priority boilerplate.

---

## Section 2 — Keyword opportunity

### 2.1 Candidate keyword list (15 terms)

Anchored against competitors visible in search today: CareNote, Notebird, Breeze, PrayerLoft, ChurchHarmony, Uplift, Blackbaud, iPrayerCenter, PrayerMate. Volume/intent are informed by SERP signals — Ron should verify with Ahrefs/SEMrush or Google Keyword Planner before committing.

| # | Keyword | Intent | Notes |
|---|---------|--------|-------|
| 1 | church prayer wall software | transactional | Direct feature match. High intent. |
| 2 | private prayer wall for church | transactional | Matches PrayerJar's core pitch precisely. |
| 3 | church prayer request app | transactional | Broad, competitive (ChurchTrac, Uplift rank here). |
| 4 | prayer request management software | transactional | B2B phrasing pastors use in ChMS evaluations. |
| 5 | online prayer wall for church | transactional | Very close to #1; keep as variant. |
| 6 | pastoral care software | transactional | CareNote and Notebird own this term. Hard. |
| 7 | prayer app for church congregation | transactional | Long-tail, lower competition. |
| 8 | live prayer wall display for church service | informational/transactional | **PrayerJar differentiator** — Pro tier has this. Few competitors do. |
| 9 | AI prayer request triage church | informational | New category PrayerJar could claim (AI-flagged care). |
| 10 | church prayer chain software | transactional | Older phrasing, still searched. Prayer Chain Online ranks. |
| 11 | digital prayer wall church | transactional | Variant of #1. |
| 12 | prayer team management software | transactional | Buyer-persona match (pastoral care leads). |
| 13 | free prayer wall for church | transactional | Matches free-tier positioning. Price-sensitive intent. |
| 14 | private prayer group app church | transactional | Small-church angle. |
| 15 | church prayer tracking software | transactional | ChMS overlap territory. |

### 2.2 Recommended primary + secondaries

- **Primary:** `church prayer wall software` — exact feature match, transactional, less dominated by ChMS incumbents than "pastoral care software."
- **Secondary 1:** `private prayer wall for church` — PrayerJar's core differentiator (private feed, not public) is right there in the phrase.
- **Secondary 2:** `live prayer wall display for church service` — long-tail, lower volume, but PrayerJar has a genuine feature moat here (Pro tier's event wall + moderation console). This is the one keyword PrayerJar could realistically rank #1 for in 60 days.
- **Secondary 3:** `church prayer request app` — broader funnel, feeds the Starter tier audience.

### 2.3 Quick win (single content change)

**Rewrite the H1 to:** `"Private Prayer Wall Software for Your Church"` — and make the page title `"Church Prayer Wall Software — PrayerJar"` (once metadata is unblocked, see Section 4). That one change captures both the primary keyword and the top secondary in the two highest-weight SEO elements, without changing the design.

---

## Section 3 — Conversion funnel (current state)

### 3.1 Analytics tool installed

- **Vercel Analytics** is installed and mounted at the root. `src/app/layout.tsx` line 15 imports `@vercel/analytics/next`; line 135 renders `<Analytics />`. This gives pageviews and Web Vitals out of the box.
- **Custom event wrapper** exists at `src/lib/analytics.ts` — exports `track()` plus three thin helpers.
- **No other analytics platforms detected.** No PostHog, Plausible, Mixpanel, Fathom, GA4, GTM, Segment, or Amplitude. (Grep for all of the above returned only `src/services/export.service.test.ts`, which is unrelated.)

### 3.2 Tracked events (complete inventory)

From `src/lib/analytics.ts`:

```ts
track('prayer_submitted', { category })   // free user flow
track('testimony_shared')                 // free user flow
track('partner_matched')                  // free user flow
```

Three events. **All three are on the free-user prayer flow. Zero events exist for the paid-church funnel.**

### 3.3 Can we measure free → paid conversion today?

**No.** The following have no instrumentation:

| Funnel step | Instrumented? |
|---|---|
| `/for-churches` pageview | Only via Vercel Analytics auto-pageview (no custom props, no segment) |
| "Get Started Free" CTA click (hero) | No |
| Plan card selection (Starter / Pro / Enterprise) | No |
| Billing toggle interaction (monthly/yearly) | No |
| `/church/create` form submit | No |
| `/api/v1/checkout` call (subscription) | No |
| Stripe `checkout.session.completed` webhook → subscription created | No (server handler exists at `src/app/api/webhooks/stripe/route.ts` but does not emit an analytics event) |

Ron cannot answer questions like "How many /for-churches visitors clicked Starter?" or "What's our visit → subscription conversion rate?" today. Any Sprint 17 CRO work will ship blind without a baseline.

### 3.4 Smallest change to get baseline instrumented

Add **five events**, tier 0 priority, before any CRO changes land:

1. `for_churches_viewed` — fire client-side on mount of `/for-churches` with prop `{ referrer }`
2. `for_churches_cta_clicked` — fire on each "Get Started Free" / "Create Your Church" button, prop `{ location: 'hero' | 'plan_card' | 'bottom' }`
3. `plan_card_clicked` — fire on plan CTA click, props `{ tier, billing }`
4. `checkout_session_created` — fire server-side at `src/app/actions/billing.actions.ts` line ~60 when the Stripe URL is successfully returned, props `{ tier, billing }`
5. `subscription_created` — fire server-side in the `checkout.session.completed` branch of `src/app/api/webhooks/stripe/route.ts`, props `{ tier, billing, churchId }`

That's the whole funnel. Five events. Vercel Analytics custom events are free on the Pro plan — no extra tooling needed. S-sized task, Backend engineer.

---

## Section 4 — Landing page CRO gaps

Concrete issues with the current `/for-churches` page, ranked by likely impact on conversion. "Impact" and "Effort" are S / M / L.

### 4.1 Metadata is missing (Impact: L, Effort: S)

As covered in Section 1. The page is client-side, so it inherits the site's generic SEO metadata. Fix: split into a server-component page (exports `metadata`) that imports a client-component child holding the billing-toggle state. Standard Next.js App Router pattern.

### 4.2 "Get Started Free" likely bounces anonymous visitors to sign-in (Impact: L, Effort: S)

Both primary CTAs point to `/church/create`. That page (`src/app/(church)/church/create/page.tsx`) lives under the `(church)` route group and calls `POST /api/v1/church`, which requires auth. An anonymous pastor clicks "Get Started Free," and before they can fill out a church name, they're bounced to sign-in. This is a classic top-of-funnel leak.

Fix options, cheapest first:
- Add interstitial copy on `/church/create` that explains "You'll sign in first, then create your church — takes 90 seconds." Sets expectation.
- Better: allow the name field to be filled anonymously, persist in `sessionStorage`, sign in, finish create. M effort.
- Best: a true guided onboarding wizard. L effort.

### 4.3 No social proof (Impact: L, Effort: M)

Page has zero testimonials, zero logos, zero "X churches trust PrayerJar" stat. Pastors buy in community. They want to see another pastor said yes first. Even one real quote from a pilot church above the pricing block would change the conversion rate meaningfully. If there are no paying churches yet, use a beta-pilot testimonial, but say so honestly.

### 4.4 Pricing block has no comparison table (Impact: M, Effort: M)

The four tiers show as independent cards with bullet lists. Pastors comparing Starter vs Pro have to read two bullet lists and mentally diff. A three-column comparison table (feature rows × tier columns, checkmarks where included) lets them scan in 5 seconds. This is a known CRO lift pattern.

### 4.5 No urgency, no concrete next step on the "Pro" card (Impact: M, Effort: S)

"Most Popular" badge is good. But the Pro card has no "14-day trial," no "Cancel anytime," no "Includes onboarding call" — nothing that makes the $49/mo commitment feel small. Add one risk-reversal line under the CTA. The FAQ does say "Cancel anytime," but that's below the fold — surface it on the card.

### 4.6 No SEO-optimized body content (Impact: M, Effort: M)

The page's body is marketing copy, not SEO content. It doesn't answer "What is a church prayer wall?" or "How does a private prayer wall work?" Google rewards pages that explain the category, not just the product. A 150–200 word section mid-page ("What is a private prayer wall for churches?") would pick up informational search traffic and feed visitors into the pricing block.

### 4.7 No link from the homepage (Impact: M, Effort: S)

Covered in §1.5. Add a hero-strip or mid-page CTA on `/` pointing to `/for-churches` with clear anchor text ("For churches and ministries — see plans"). This concentrates PageRank on the money page and gives human visitors a path to it besides the footer.

### Top 5, prioritized (impact × ease):

1. **Fix page metadata** (L impact, S effort)
2. **Instrument the five funnel events** (L impact long-term, S effort)
3. **Fix "Get Started Free" anonymous bounce** (L impact, S–M effort)
4. **Add one real testimonial + a comparison table** (L+M impact, M effort)
5. **Homepage link to /for-churches** (M impact, S effort)

---

## Section 5 — Sprint 17 recommendations for Growth

Three concrete tickets for PM to add to Sprint 17. Each has a named owner, a success metric, and sizing.

### Ticket G-1: Server-component metadata + on-page SEO rewrite for /for-churches

**Owner:** Frontend Engineer (with Growth for copy approval)
**Size:** S
**Description:**
- Split `src/app/(public)/for-churches/page.tsx` into a server component that exports `metadata` and a client child (`ForChurchesPricing.tsx`) that holds the billing-toggle state.
- Set `title: "Church Prayer Wall Software — PrayerJar"`, `description: "Private prayer wall, pastoral dashboard, and AI-flagged care for your church. Free tier, no credit card."`, and a dedicated OG image at `/for-churches/opengraph-image`.
- Update H1 to `"Private Prayer Wall Software for Your Church"`.
- Add one mid-page 150–200 word "What is a private prayer wall?" content block for informational search capture.
**Success metric:** Google Search Console shows `/for-churches` indexed with the new title within 14 days of deploy; impressions > 0 for primary or secondary keywords within 30 days.
**Ship gate:** Growth reviews final copy before merge.

### Ticket G-2: Instrument the five-event paid funnel baseline

**Owner:** Backend Engineer (with Frontend for client-side events)
**Size:** S
**Description:**
- Client-side: `for_churches_viewed`, `for_churches_cta_clicked`, `plan_card_clicked` (via existing `src/lib/analytics.ts` `track()`).
- Server-side: `checkout_session_created` in `src/app/actions/billing.actions.ts` and `subscription_created` in the `checkout.session.completed` branch of `src/app/api/webhooks/stripe/route.ts`.
- Verify all five fire in Vercel Analytics dashboard before merge.
**Success metric:** Within 7 days of deploy, all five events have non-zero counts in Vercel Analytics and a visible funnel can be charted. Baseline for all Sprint 18+ CRO work.
**Ship gate:** QA confirms events fire on staging with a synthetic checkout.

### Ticket G-3: Fix anonymous "Get Started Free" bounce + add homepage link

**Owner:** Frontend Engineer
**Size:** M
**Description:**
- On `/church/create`, persist the church-name input to `sessionStorage` before redirecting to sign-in, then prefill on return. Anonymous pastor no longer loses state.
- Add a small mid-page section on `/` (homepage, `src/app/(public)/page.tsx`) linking to `/for-churches` with keyword-rich anchor text ("Set up a private prayer wall for your church →").
**Success metric:** After G-2 ships, track `for_churches_viewed` from homepage-referrer vs footer-referrer. Expected 3–5× lift in /for-churches pageviews within 14 days.

---

## Appendix A — Files referenced

- `D:/Claude/projects/PrayerJar/src/app/(public)/for-churches/page.tsx` — the subject page (client component)
- `D:/Claude/projects/PrayerJar/src/app/layout.tsx` — root layout with generic metadata (lines 21–41)
- `D:/Claude/projects/PrayerJar/src/app/sitemap.ts` — includes /for-churches entry (line 18); also emits /church/{slug} entries that robots blocks (lines 41–50)
- `D:/Claude/projects/PrayerJar/src/app/robots.ts` — disallows /church/ (line 11)
- `D:/Claude/projects/PrayerJar/src/lib/analytics.ts` — three-event Vercel Analytics wrapper
- `D:/Claude/projects/PrayerJar/src/app/actions/billing.actions.ts` — server action returning Stripe checkout URL (no event fired)
- `D:/Claude/projects/PrayerJar/src/app/api/webhooks/stripe/route.ts` — handles `checkout.session.completed` (no event fired)
- `D:/Claude/projects/PrayerJar/src/app/(church)/church/create/page.tsx` — auth-gated form; CTA destination
- `D:/Claude/projects/PrayerJar/src/lib/plans.ts` — tier definitions: Free / Starter $19 / Pro $49 / Enterprise

## Appendix B — Sources (keyword research)

- [CareNote — Pastoral Care Software](https://www.carenote.app/)
- [Notebird — Pastoral Care App](https://www.notebird.app/)
- [Breeze — Pastoral Care](https://www.breezechms.com/lp/pastoral-care)
- [PrayerLoft](https://www.prayerloft.com/)
- [ChurchHarmony — Prayer Wall](https://churchharmony.com/features/prayer-wall)
- [Blackbaud Virtual Prayer Wall](https://www.blackbaud.com/newsroom/article/blackbaud-releases-virtual-prayer-wall-technology-for-churches)
- [Uplift — Free Prayer Request App](https://upliftprayer.com/)
- [ChurchTrac — How To Start An Online Prayer Wall](https://www.churchtrac.com/articles/how-to-start-an-online-prayer-wall)
- [iPrayerCenter](https://www.iprayercenter.com/)
- [The Prayer Engine](https://www.theprayerengine.com/)
- [FaithTime — Best Christian Community Apps 2026](https://www.faithtime.ai/content/general/hristian-community-apps/)
- [ActsSocial — Best Christian Prayer Apps 2026](https://actssocial.com/blog/best-christian-prayer-apps)

---

*End of report.*
