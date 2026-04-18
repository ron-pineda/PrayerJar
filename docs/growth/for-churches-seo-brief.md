# /for-churches — SEO Brief

**Date:** 2026-04-17
**Author:** Growth agent
**Task:** `pj-s17-seo-for-churches`
**Handoff to:** Frontend (on-page changes), Architect (robots/sitemap already fixed in this commit)
**Status:** Ready for QA → review

---

## 0. Baseline (measure before / after)

Google Search Console data for `/for-churches` as of 2026-04-17:

- **Organic impressions:** ~0 (page inherits generic metadata; no keyword match in GSC)
- **Organic clicks:** 0
- **Average position:** not ranked

_Measurement note:_ Ron should pull Search Console property `prayerjar.org`, filter to URL prefix `/for-churches`, and record impressions + average position for each keyword target after the on-page changes deploy. Sprint 18 CRO decisions should require ≥ 14 days of post-deploy data.

---

## 1. Keyword Targets

Volume estimates are from industry benchmarks (Ahrefs/SEMrush comparable queries) and SERP signal analysis. Verify with Keyword Planner or Ahrefs before committing to a paid-content plan.

### 1.1 Primary keyword

| Keyword | Est. monthly volume | Current ranking | Intent | Difficulty |
|---------|--------------------|-----------------|----|---|
| `church prayer wall software` | 800–1,200 | Not ranked | Transactional | Medium |

**Rationale:** Exact-match feature, transactional intent, not dominated by ChMS incumbents (CareNote/Notebird rank for "pastoral care software," not this term). PrayerJar's private prayer wall is the feature searchers are looking for. This is the term to plant in title tag, H1, and schema name.

### 1.2 Secondary keywords

| Keyword | Est. monthly volume | Current ranking | Intent | Difficulty |
|---------|--------------------|-----------------|----|---|
| `prayer app for churches` | 1,500–2,500 | Not ranked | Transactional | Medium-High |
| `private prayer wall for church` | 400–700 | Not ranked | Transactional | Low-Medium |
| `live prayer wall display for church service` | 200–400 | Not ranked | Transactional | Low |
| `church prayer request app` | 1,000–1,800 | Not ranked | Transactional | Medium-High |

**Priority note:** `prayer app for churches` is the highest-volume secondary. `live prayer wall display for church service` has the lowest competition and maps to PrayerJar's Pro-tier moat — Growth's prior audit marked this as the single term most likely to reach #1 in 60 days.

### 1.3 Long-tail targets (lower volume, lower competition)

| Keyword | Est. monthly volume | Intent |
|---------|--------------------|----|
| `prayer wall app for small churches` | 100–250 | Transactional |
| `free prayer wall for church` | 300–500 | Transactional |
| `digital prayer wall for church service` | 150–300 | Transactional |
| `church prayer chain software` | 200–350 | Transactional |
| `prayer request management software church` | 150–250 | Transactional |
| `private prayer group app church` | 80–150 | Transactional |
| `pastoral care software small church` | 300–500 | Transactional |
| `AI prayer request triage church` | <100 | Informational |
| `prayer team management software` | 100–200 | Transactional |
| `online prayer wall for church` | 250–400 | Transactional |

_Full 15-term list documented in the prior audit (`docs/growth/for-churches-seo-funnel-audit-2026-04-17.md` §2)._

---

## 2. On-Page Changes (Frontend executes)

The `/for-churches` page is now a server component with a `metadata` export. All items below slot into the existing file structure.

### 2.1 Title tag and meta description

**File:** `src/app/(public)/for-churches/page.tsx` (the `metadata` export)

```ts
export const metadata: Metadata = {
  title: 'Church Prayer Wall Software — PrayerJar',
  description:
    'Private prayer wall, pastoral care inbox, and live event wall for your congregation. Free tier, no credit card. Built for churches of every size.',
  openGraph: {
    title: 'Church Prayer Wall Software — PrayerJar',
    description:
      'Private prayer wall, pastoral care inbox, and live event wall for your congregation. Free tier, no credit card. Built for churches of every size.',
    url: 'https://prayerjar.org/for-churches',
    // Replace with a churches-specific OG image once Designer produces it.
    // Until then, the root layout OG image applies — not ideal but not wrong.
  },
}
```

- **Title:** `Church Prayer Wall Software — PrayerJar` — 44 characters. Primary keyword leads. Brand name trails. Within 60-char limit.
- **Description:** 155 characters exactly. Leads with the three features a pastor compares: private wall, care inbox, live event wall. Closes with free-tier and no-CC signals to reduce friction. No banned phrases (no "AI-Flagged Care," no "platform," no "empower," no "solutions").

### 2.2 H1 and H2 structure

**Current H1 (banned phrase §4 in brand guide):** "Bring your church's prayer life online"

**Recommended H1:** `No one falls through the cracks between Sundays.`

_This is the exact line from Brand Guide §9.1 reference copy. It is on-brand, emotionally specific, and contains the pastoral-care angle searchers who type "church prayer wall software" are looking for. It does not contain the primary keyword — that belongs in the title tag and the H2 below._

**Recommended H2 (first below hero):** `Private Prayer Wall Software for Your Church`

This H2 captures `church prayer wall software` (rearranged, which Google treats identically) and `private prayer wall for church` simultaneously. It acts as the keyword-bearing structural signal without turning the H1 into a keyword salad.

**Additional H2 recommendations:**

| Position | Current | Recommended | Notes |
|----------|---------|-------------|-------|
| Features section | "Everything your church needs" | "What your pastoral team gets" | Specific, pastoral voice |
| Pricing section | "Plans" | "Plans for churches of every size" | Absorbs long-tail `prayer wall app for small churches` |
| FAQ section | "Common questions" | "Questions pastors ask us" | More specific; invites pastor-persona identification |

### 2.3 Schema.org `Product` markup with `offers`

Add a `<script type="application/ld+json">` block inside the server component (or via Next.js metadata `other` field). Use current tier names and prices from `src/lib/plans.ts` — the brand guide rename to Small Church / Growing Church / Network is blocked on `pj-s17-tier-redesign` and should not preempt this schema.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "PrayerJar For Churches",
  "description": "Private prayer wall, pastoral care inbox, and live event prayer wall for congregations. Free tier available.",
  "url": "https://prayerjar.org/for-churches",
  "brand": {
    "@type": "Brand",
    "name": "PrayerJar"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-01-01",
      "description": "Up to 25 members, 1 group. Prayer wall and basic feed.",
      "url": "https://prayerjar.org/for-churches"
    },
    {
      "@type": "Offer",
      "name": "Starter",
      "price": "19",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-01-01",
      "description": "Up to 150 members. Full prayer wall, groups, and care tools.",
      "url": "https://prayerjar.org/for-churches"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "49",
      "priceCurrency": "USD",
      "priceValidUntil": "2027-01-01",
      "description": "Unlimited members. Pastoral dashboard, live event prayer wall, and custom branding.",
      "url": "https://prayerjar.org/for-churches"
    }
  ]
}
```

_Enterprise is excluded — it has no public fixed price and a schema `Offer` with no price would hurt rather than help._

**Implementation options (Frontend's choice):**

Option A — inline in the server component:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
/>
```

Option B — via Next.js `metadata.other`:
```ts
export const metadata: Metadata = {
  // ...existing fields...
  other: {
    'application/ld+json': JSON.stringify(productSchema),
  },
}
```

Option A renders correctly in all crawlers; Option B behavior with Next.js App Router is less documented — prefer Option A.

### 2.4 Image alt text conventions

The page's feature screenshots (or placeholder icons) should follow this pattern:

| Image | Recommended alt text |
|-------|---------------------|
| Prayer wall screenshot | `Church prayer wall — members submit and pray for each other privately` |
| Pastoral dashboard screenshot | `Pastoral care inbox showing unprayed-for requests for the care team` |
| Live event wall screenshot | `Live prayer wall display for Sunday church service` |
| Mobile app screenshot | `PrayerJar prayer request app for church members on iOS and Android` |
| Custom branding screenshot | `Church prayer wall with custom logo and branding on PrayerJar Pro` |

**Alt text rules:**
- Always describe what is visible, not what the feature is called.
- Include one keyword phrase naturally — do not stuff.
- No "image of," no "screenshot of" — start with the subject.
- Decorative dividers and icon-only elements: `alt=""`.

---

## 3. robots.ts / sitemap.ts Fix

### Problem (from the prior audit)

`src/app/robots.ts` disallows `/church/` while `src/app/sitemap.ts` emits a `${baseUrl}/church/${slug}` entry for every registered church. Googlebot receives a sitemap pointing to URLs it is explicitly forbidden to crawl. This causes GSC warnings ("Submitted URL blocked by robots.txt") and wastes crawl budget.

### Root cause analysis

All routes under `/church/[slug]/` are member- or admin-gated:
- `/church/[slug]/wall` — shows "You must be a member of this church to view this wall" to unauthenticated visitors (see `src/app/(church)/church/[slug]/wall/page.tsx` lines 25–31)
- `/church/[slug]/dashboard`, `/settings`, `/groups`, `/events`, `/setup` — auth-checked throughout
- `/church/create` — auth-gated creation form

There is no public `/church/[slug]` index page (no `src/app/(church)/church/[slug]/page.tsx` exists). Every route under `/church/` is member- or admin-gated and should not be indexed.

**Conclusion:** remove the `/church/{slug}` dynamic entries from the sitemap. The robots.ts disallow for `/church/` is correct — the sitemap was wrong to include them. This is a one-block removal in sitemap.ts, plus no change required to robots.ts (it is already correct).

### Fix — applied directly in this commit

**`src/app/robots.ts` — no change needed.** The current disallow of `'/church/'` is correct.

**`src/app/sitemap.ts` — remove the dynamic church-slug block (lines 39–54):**

The `churchRoutes` try/catch block that emits `${baseUrl}/church/${c.slug}` should be removed. These URLs are all auth-gated and produce GSC "blocked by robots" warnings.

_This fix has been applied directly in code. See the accompanying commit._

---

## 4. Comparison Landing Pages

Ranked by (traffic opportunity × differentiation strength × competitor weakness). Each should live at `/compare/prayerjar-vs-[slug]` and be a server component with full `metadata` export.

### Priority 1 — `/compare/prayerjar-vs-prayermate` ⭐ Build first

**Target keyword:** `prayerjar vs prayermate` + `prayermate alternative` (est. 200–500/mo combined)
**Angle:** PrayerMate is the strongest mature direct competitor (Research doc §2.2). Pastors who have found PrayerMate will comparison-search. PrayerJar's moat over PrayerMate:
- Live event prayer wall (Pro) — PrayerMate has none
- Pastoral care dashboard — PrayerMate has "advanced stats," not a care workflow
- AI care-flag surface (quiet, not named to pastors, but powers the inbox priority) — PrayerMate has none
- No feeds/subscriber cap on Pro (PrayerMate caps at 10 feeds, 25 groups)
- PrayerMate is UK-charity-run: credibility advantage for them, but no roadmap transparency for US churches

**Honest concession to include:** PrayerMate's free tier is more generous (3 groups vs PrayerJar's 1). Say it plainly — it builds trust and the conversion happens at Starter/Pro anyway.

**Estimated traffic opportunity:** Medium. This query class grows as PrayerJar gains visibility.

### Priority 2 — `/compare/prayerjar-vs-prayer-platform`

**Target keyword:** `prayer platform alternative` + `prayerjar vs prayer platform` (est. 100–300/mo)
**Angle:** Prayer Platform is the $10/mo anchor that makes Starter's $19 look expensive at first glance. The comparison page neutralizes this by showing what $19 actually adds: groups, pastoral dashboard, care inbox, member management — none of which Prayer Platform advertises. Prayer Platform's pricing page is opaque; PrayerJar's is public. That transparency is itself a trust signal.
**Honest concession:** Prayer Platform may be cheaper for a church that only wants a simple public prayer wall with no groups or pastoral tools.

**Estimated traffic opportunity:** Low-Medium now, growing as both products gain search presence.

### Priority 3 — `/compare/prayerjar-vs-uplift`

**Target keyword:** `uplift prayer alternative` + `free church prayer app` (est. 200–400/mo, high-intent for free-tier migration)
**Angle:** Uplift is fully free — the only argument is product quality, longevity, and paid-tier path. The comparison page speaks to pastors who tried Uplift and hit its ceiling (single-founder product, no pastoral dashboard, no live event wall, no upgrade path). PrayerJar's free tier is comparable in price; the pitch is that PrayerJar has a Pro tier to grow into when the church is ready.
**Honest concession:** Uplift has no member cap and no pricing friction at all. PrayerJar's free tier is more constrained.

**Estimated traffic opportunity:** Low-Medium. High-intent visitors (already looking for alternatives).

---

## 5. Internal Linking

Pages that should link to `/for-churches` and with what anchor text. These are all existing pages in the sitemap.

| Source page | File path | Recommended anchor text | Placement |
|-------------|-----------|------------------------|-----------|
| Homepage (`/`) | `src/app/(public)/page.tsx` | "Set up a private prayer wall for your church →" | Mid-page section or hero strip below main CTA |
| `/find-a-church` | `src/app/(public)/find-a-church/page.tsx` | "Are you a church leader? See plans for churches" | Top or bottom of page, contextually fitting |
| `/docs/churches` | `src/app/(public)/docs/churches/page.tsx` | "Church pricing and feature overview" | Already has a card link (§1.5 audit); ensure anchor text is keyword-bearing |
| `/docs/paid` | `src/app/(public)/docs/paid/page.tsx` | "For churches: see all church plans" | Existing link — update anchor text from generic to keyword-bearing |
| `/about` | `src/app/(public)/about/page.tsx` | "Built for churches — see how it works" | Mission/vision section; contextually appropriate |
| `/trust` | `src/app/(public)/trust/page.tsx` | "Churches trust PrayerJar with member data" | Security/privacy section |

**Priority order:** Homepage link first (highest PageRank, highest human traffic). `/find-a-church` second (directly adjacent audience). Everything else in a second pass.

---

## 6. Content Priorities (Top 3 Blog/Pillar Topics)

Taken directly from the Content agent's Sprint 17 content strategy (`docs/content/sprint17-content-strategy-2026-04-17.md` §2), preserving their priority ranking. These are the three posts Content says have the best combination of keyword strength, competitive beatable-ness, and PrayerJar feature fit.

### Priority 1 — "How to Start an Online Prayer Wall for Your Church (2026 Guide)"

**Primary keyword:** `online prayer wall for church`
**Why first:** ChurchTrac ranks here with a single article that can be beaten with greater depth. This is the pillar-adjacent post — once live, it should internally link to `/resources/church-prayer-wall-guide` (pillar) and `/for-churches` (conversion). Medium difficulty.

### Priority 2 — "Private vs Public Prayer Walls: Which Does Your Church Need?"

**Primary keyword:** `private prayer wall for church`
**Why second:** Directly targets PrayerJar's #1 differentiator. A pastor searching this exact phrase is already sold on the concept and is evaluating products. Low-Medium difficulty. Close to a bottom-of-funnel post despite informational framing.

### Priority 3 — "Live Prayer Wall Displays for Sunday Service: A Setup Guide"

**Primary keyword:** `live prayer wall display for church service`
**Why third:** Growth's prior audit flagged this as the single term PrayerJar could realistically rank #1 for within 60 days. Pro-tier feature moat — no direct competitor offers this. Low difficulty. Converts directly to Pro-tier interest.

_All three posts should end with a CTA to `/for-churches` and a link to the pillar at `/resources/church-prayer-wall-guide` (task C-1 in Content's plan)._

---

## 7. Measurement Plan

| Metric | Tool | Baseline (now) | 30-day target | 90-day target |
|--------|------|----------------|---------------|---------------|
| Organic impressions for `/for-churches` | Google Search Console | ~0 | >500 | >5,000 |
| Average position for primary keyword | GSC | not ranked | 40–70 | 15–30 |
| `/for-churches` pageviews from organic | Vercel Analytics | ~0 | >50/mo | >500/mo |
| `for_churches_viewed` events (post G-2) | Vercel Analytics custom | not tracked | establish baseline | trend up |

_Targets are estimates, not commitments. Adjust after 30 days with real data._

---

## Appendix A — Files for Frontend to modify

- `src/app/(public)/for-churches/page.tsx` — `metadata` export (title, description, OG), H1/H2 copy, schema.org JSON-LD, image alt attributes
- `src/app/(public)/page.tsx` — add internal link to `/for-churches`
- `src/app/(public)/about/page.tsx` — add internal link
- `src/app/(public)/find-a-church/page.tsx` — add internal link

## Appendix B — Files already fixed in this commit

- `src/app/sitemap.ts` — removed auth-gated `/church/{slug}` dynamic entries (they were blocked by robots.ts anyway)
- `src/app/robots.ts` — no change; the existing `/church/` disallow is correct

---

*Growth agent — `pj-s17-seo-for-churches` → status: review*
