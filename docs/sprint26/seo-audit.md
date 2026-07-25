# Sprint 26 — SEO & Discoverability Audit (pj-s26-04)

**Agent:** Growth · **Date:** 2026-07-24/25 · **Live site:** prayerjar.org
**Prod baseline:** 6 users, 1 church, 11 prayers, 0 testimonies (2026-07-22)

Everything below was checked against the **live production site** with `curl`, not read out of
source. Where a claim rests on source only, it says so.

---

## Two corrections to the task brief

**1. "108 static pages and a dynamic sitemap already exist" — the sitemap is not dynamic.**
`src/app/sitemap.ts` is `async` but issues zero DB queries. It was a hardcoded 26-URL array. No
church, prayer, testimony, campaign or category URL was ever derived from data. This matters because
the brief treats sitemap coverage as a solved problem, and it was not.

**2. Three of those 26 URLs were hard 404s in production.** Verified 2026-07-24:

```
404  /testimony
404  /campaigns
404  /wrapped
```

There is no index route for any of the three — only `/testimony/[id]`, `/campaigns/[slug]` and
`/wrapped/[year]`. 11.5% of the URLs submitted to Google were dead.

---

## Findings, ranked by realistic impact

Ranking criterion, per the brief: *what plausibly brings a human to the site.*

### 1. Every shared prayer link renders a broken social card — `/api/og/card/*` 500s in production

**FIXED (needs post-deploy verification).** This is the highest-impact defect found in either task.

At n=6 the only acquisition channel that costs nothing and scales through existing users is a user
sharing a prayer link. `/p/[id]` sets `openGraph.images` to `/api/og/card/prayer?...`. That endpoint
returns a **hard 500** in production, deterministically:

```
GET /opengraph-image                                     status=200 type=image/png size=39571
GET /api/og/card/prayer?text=test&category=Health&count=1 status=500 type=text/html size=9387
GET /api/og/card/answered?text=test&category=Health       status=500 type=text/html size=9387
GET /api/og/card/category?category=Health&count=3         status=500 type=text/html size=9387
GET /api/og/card/milestone?count=100                      status=500 type=text/html size=9387
GET /api/og/card/bogus                                    status=404 type=text/plain
```

Five consecutive GETs, plus three with cache-busted query strings: 500 every time. `bogus` correctly
404s, so the handler *runs* — `new ImageResponse(...)` itself throws.

Every prayer link pasted into WhatsApp, iMessage, Facebook or X currently renders with no image.

**Root cause.** All four OG route handlers imported `ImageResponse` from `@vercel/og`. The Next 16.2.2
docs shipped in this repo (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md`)
document `next/og` as the import for route handlers, and the version history records the move out of
`@vercel/og` at v13/v14. Next's bundler special-cases `next/og` so the Satori/Resvg WASM assets are
traced into the serverless function; importing `@vercel/og` directly skips that handling. The one
surface that works in production — `/opengraph-image` — is a **file-convention** route, which Next
compiles through a different path, which is why it survives the same bad import.

**Fix landed:** `@vercel/og` → `next/og` in the four route handlers
(`api/og/card/[type]`, `api/og/prayer/[id]`, `api/og/testimony/[id]`, `api/og/wrapped/[userId]`).

**Honest caveat — read this.** The failure is Vercel-serverless-specific and **does not reproduce
under a local `next start`**: on localhost the endpoint returned `200 image/png` both before and
after the change. So local testing cannot prove the fix. The evidence is (a) the documented API for
this Next version, (b) the exact correlation between which surfaces use the file convention and
which work in production. **This must be re-curled against prod after deploy.** Suggested addition
to the pj-s26-07 gate:

```
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  'https://prayerjar.org/api/og/card/prayer?text=test&category=Health&count=1'
# expect: 200 image/png
```

If it still 500s after deploy, the next thing to check is the Vercel function log for that route —
the diagnosis is confident but not proven.

`src/app/opengraph-image.tsx` still imports `@vercel/og`. **Left alone deliberately** — it works in
production today, and changing a working surface for consistency is risk without upside. Follow-up,
not a fix.

---

### 2. `/pray/[category]` accepted any slug, reflected it into the page title, and returned 200

**FIXED.** Verified on prod before the fix:

```
200  /pray/foobar        <title>foobar Prayer Requests | PrayerJar</title>
200  /pray/cheap-viagra  <title>cheap-viagra Prayer Requests | PrayerJar</title>
200  /pray/health        <title>Health Prayer Requests | PrayerJar</title>
```

Only ten category values exist. Anything else fell through to `value.replace('_', ' ')` and rendered
a 200 page with the raw slug in the `<title>`, the `og:title`, the `twitter:title` and the H1. Two
problems: an unbounded soft-404 crawl space, and anyone could mint a PrayerJar-branded title
containing words of their choosing and submit or share that URL.

**Fix landed:** unknown slugs now resolve through `notFound()` in both `generateMetadata` and the
page component. `/pray/cheap-viagra` now serves the not-found page — `<title>Not Found | PrayerJar</title>`.
The attacker-controlled string no longer appears anywhere in the document.

**Known limitation, deliberately not fixed.** The response is a **soft** 404: status 200 with 404
content. Cause: `src/app/(public)/pray/[category]/loading.tsx` creates a Suspense boundary, so Next
begins streaming before `notFound()` throws and the status is already committed. Every other
`notFound()` route on the site — none of which has a `loading.tsx` — returns a true 404:

```
/p/00000000-0000-0000-0000-000000000000  -> 404
/church/no-such-church                   -> 404
/campaigns/nope                          -> 404
/definitely-not-a-route                  -> 404
/pray/cheap-viagra                       -> 200  (404 content)
```

**Recommendation (not landed):** `generateStaticParams()` over `PRAYER_CATEGORIES` plus
`export const dynamicParams = false` rejects unknown params at the routing layer and yields a true
404. Deliberately left out of scope: it converts ten live dynamic pages to prerendered, changes their
caching semantics, and moves the build count from 108 to 118. Google detects and de-indexes soft 404s
on its own, and at current crawl volume the practical cost is a GSC warning. **Effort: 30 min +
regression check on the category pages.** Owner: Frontend.

---

### 3. Sitemap rewritten — three dead URLs out, the ten pages most likely to rank in

**FIXED.** The `/pray/[category]` pages are the only routes on the site whose titles match a phrase a
real person types — "grief prayer requests", "prayer for financial help" — and the only ones carrying
JSON-LD. They were absent from the sitemap and reachable only by guessing the URL. Meanwhile three
404s were being actively submitted to Google.

Sitemap is now **33 URLs** (was 26): removed `/testimony`, `/campaigns`, `/wrapped`; added the ten
category pages at priority 0.8. Every URL verified to resolve:

```
/                                200      /docs                            200
/pray                            200      /docs/features                   200
/browse                          200      /docs/guide                      200
/praise-wall                     200      /docs/churches                   200
/find-a-church                   200      /docs/paid                       200
/know-jesus                      200      /pray/health                     200
/about                           200      /pray/family                     200
/for-churches                    200      /pray/financial                  200
/give                            200      /pray/grief                      200
/contact                         200      /pray/gratitude                  200
/help                            200      /pray/guidance                   200
/world-prayer                    200      /pray/relationships              200
/map                             200      /pray/work_career                200
/partners                        200      /pray/spiritual_growth           200
/press                           200      /pray/other                      200
/trust                           200
/privacy                         200
/terms                           200
```

33/33. A code comment now records why the three were removed, so they are not re-added without an
index page.

---

### 4. Unbacked "thousands" claims sat in Google-facing meta descriptions

**FIXED.** Same defect class as the pj-s26-01 gate task — a claim the product cannot back — except
these were in the text Google shows in the results list:

- `health`: *"Join **thousands** lifting health prayers on PrayerJar."*
- `relationships`: *"**Thousands** are believing for restored relationships on PrayerJar."*

At 6 users and 11 prayers this is false. Quantifiers removed; sentences otherwise untouched
("Join others lifting health prayers on PrayerJar", "People here are believing for restored
relationships").

**Referred to Copywriter, not fixed here.** The same file carries brand-voice debt against
`docs/brand/brand-guide.md` §7 #13 ("Join the community / movement"):
`grief` says *"Join a community that prays through grief together."* Copy tone is Copywriter's call,
not Growth's — flagging rather than rewriting. **Effort: 15 min.**

---

### 5. The home page had no metadata at all

**FIXED.** Verified on prod: `<title>Prayer Jar</title>` — eleven characters, no keyword, inherited
from the root layout, on the single page most likely to be someone's first result. Its description
was the generic root string shared with every other page.

Now: `Prayer Jar — Share a Prayer Request or Pray for Someone` (55 chars) with a description naming
the actual categories, plus matching `openGraph`/`twitter` titles (the root layout's OG block would
otherwise have kept overriding them).

The "no account needed to pray" claim in the new copy was verified against code before use —
`src/app/api/v1/prayers/[id]/pray/route.ts` passes `userId: session?.user?.id ?? null`, so praying
genuinely works signed-out.

---

### 6. Four ranking-relevant pages shared one generic description

**FIXED.** `/pray`, `/praise-wall`, `/know-jesus` and `/map` each exported a `title` and no
`description`, so all four served the root layout's *"A global prayer jar — share your heart,
intercede for others."* Verified live before the change. Each now has its own.

`/praise-wall`'s title was also **"Lights Released"** — the in-product name for the wall, which
nobody searches, and which contradicted the site's own nav label ("Answered Prayers"). Title is now
`Answered Prayers | The Prayer Jar`; the on-page H1 keeps "Lights Released".

Descriptions were written against the n=6 reality — no volume claims, nothing the empty walls
contradict.

---

## Verified healthy — no action

- **`robots.txt`** serves correctly; `disallow: /api/, /admin/, /church/`; sitemap declared.
- **No `noindex` leaks.** Grepped the whole of `src/` for `noindex` / `robots:` / `index: false` —
  zero matches. Nothing that should rank is suppressed.
- **`metadataBase`** is set on the root layout, so relative OG image URLs resolve.
- **`/opengraph-image`** returns `200 image/png` in production (39,571 bytes).
- **Security headers** present in production: HSTS with preload, `X-Content-Type-Options`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- **Sitemap correctly omits `/church/[slug]`** — see below; the existing code comment explaining
  this is right and should be left alone.

---

## Recommendations — not landed

Ordered by impact-per-hour. Each has an owner and a next action.

### R1 — Do **not** "fix" the robots.txt block on church profiles. Document it instead. (Owner: PM)

`(public)/church/[slug]` is a genuinely public page with full metadata, and `robots.txt` blocks it
via `disallow: /church/`. That looks like a bug. Allowing it is a **privacy hazard**, not a quick win:
`/church/` is a shared prefix covering `(church)/church/[slug]/wall`, `/dashboard/*`, `/admin/*`,
`/settings/*`, `/events/*`, `/groups`, `/setup`. Allowing the profile means enumerating every gated
sibling as an explicit `disallow`, and missing one exposes member prayer walls to crawlers. With one
church on the platform the upside is zero. **Revisit at ~10+ churches**, and only with per-path
`allow`/`disallow` rules written and reviewed together. **Effort: 2 h including review.** Corollary:
do not add church slugs to the sitemap while the block stands — that reproduces the GSC "submitted
URL blocked by robots.txt" error the existing comment was written to prevent.

### R2 — Add canonical URLs. (Owner: Frontend, effort: 1 h)

Zero `alternates.canonical` anywhere in `src/`. Low urgency today, but `/browse` and `/pray/[category]`
both accept query params (`?q=`, `?category=`, `?urgent=`) that generate crawlable duplicates of the
same content. Add `alternates: { canonical: ... }` to the root layout and to those two routes.

### R3 — Structured data, with a caveat. (Owner: Frontend, effort: 2–3 h)

- **`/find-a-church/[placeId]`** — the obvious `LocalBusiness`/`Church` candidate, but the data is
  **Google Places** (the page credits "Google Places" and builds Maps deep-links from `placeId`).
  Republishing Places data as your own structured markup has Google ToS constraints. **Do not ship
  this without checking the Places Terms first.** Not a blind recommendation.
- **`/help` and `/docs/guide`** — `FAQPage` markup on genuine Q&A content is uncontroversial and is
  the better first move.
- **`Organization` markup on the home page** — name, logo, URL, `sameAs`. Cheap, safe.

### R4 — Category slugs use underscores. (Owner: Frontend, effort: 1 h + redirects)

`/pray/work_career` and `/pray/spiritual_growth`. Search engines treat `-` as a word separator and
`_` as a joiner, so "work career" is weaker as a signal than it should be. Fixing means a slug map
plus 301s from the underscore forms; the enum value is used in the DB, so the URL slug and the stored
value have to be decoupled. Worth doing only if the category pages start showing impressions.

### R5 — `/embed/[churchSlug]/widget` can never be iframed. (Owner: Architect, effort: 30 min to decide)

`next.config.ts` sets `X-Frame-Options: DENY` on `source: "/(.*)"`, which covers the embed route.
**This is not currently a broken promise** — I checked, and no church-facing copy anywhere tells a
church to paste an iframe. The event setup guide presents the URL as something to "show on screen or
add to your program", which works fine. But the route is *named* `embed`, and the first church that
tries to actually embed it will silently get a blank frame. Either rename the concept or add a
`frame-ancestors` exception scoped to that path. Deciding is cheap; leaving it ambiguous is how a
false claim gets written later.

### R6 — Which pages could realistically rank

Honest read. Nothing here ranks on domain authority; these are the only surfaces with a plausible
long-tail path:

| Page | Query someone would actually type | Verdict |
|---|---|---|
| `/pray/grief`, `/pray/health`, `/pray/financial` | "prayer for grief", "prayer request for healing" | **Best odds.** Title matches the query, JSON-LD present, now in the sitemap. Thin on content — each is a client-rendered feed over 11 prayers. Adding 150–250 words of static, honest copy above the feed is the single highest-leverage SEO content task available. |
| `/know-jesus` | "how to become a christian", "who is jesus" | Real intent, brutal competition (GotQuestions, Billy Graham, every denomination). Will not rank without links. |
| `/find-a-church` | "churches near me" | Google answers this itself in the SERP. Structurally unwinnable. |
| `/for-churches` | "church prayer wall software", "prayer request app for churches" | Low volume, high intent, weak competition. **Best commercial-intent target.** Already has a prior brief at `docs/growth/for-churches-seo-brief.md`. |
| `/map`, `/world-prayer` | — | Nobody searches for these. They are retention surfaces, not acquisition surfaces. Correct to keep in the sitemap at low priority; wrong to invest SEO effort in. |

**The honest summary:** SEO is not going to be the channel that takes PrayerJar from 6 users to 60.
The fixes above stop the site actively wasting the crawls it gets and remove two false claims. The
thing that actually moves the number is Ron talking to churches — which is pj-s26-06, not this task.

---

## Gate output

Run after all changes, from `D:\Claude\projects\PrayerJar`.

```
$ npx tsc --noEmit
TSC_EXIT=0
```

```
$ npx vitest run
 RUN  v4.1.3 D:/Claude/projects/PrayerJar

 Test Files  63 passed (63)
      Tests  505 passed (505)
   Start at  00:03:55
   Duration  15.48s
```

```
$ npx next build
✓ Compiled successfully in 8.9s
✓ Completed runAfterProductionCompile in 378ms
✓ Generating static pages using 31 workers (108/108) in 467ms
```

Re-run after commit, with the other agents' work merged into the tree:

```
$ npx tsc --noEmit          → 0 errors
$ npx vitest run
 Test Files  64 passed (64)
      Tests  513 passed (513)
```

**`tsc` 0 errors ✓ · `next build` 108/108 ✓ · vitest all passing — see note on the count.**

### Note on the vitest count: 505 → 513, not the 459 in the brief. Not a regression.

The working tree is **shared with the Analytics agent (pj-s26-03)**, whose work is uncommitted and
therefore included in any test run made from this directory. Attribution, measured directly:

```
$ npx vitest run src/lib/analytics-redact.test.ts src/lib/attribution.test.ts
      Tests  39 passed (39)

$ git diff --stat src/proxy.test.ts
 src/proxy.test.ts | 117 +++++++++++++++++++-  (115 insertions, 2 deletions)   → +7 tests
```

39 + 7 = 46. 459 + 46 = 505. **The entire delta is theirs; this task added no tests and changed no
test file.** 505/505 pass.

The count moved again (505 → 513) between the first gate run and the post-commit re-run, as the
Analytics agent added `src/services/attribution.service.test.ts`. Any single "expected test count"
gate is unenforceable this sprint; QA should gate on **all passing + tsc 0 + build 108/108** instead
of a fixed number.

### Process note for PM — a teammate's files landed in this task's commit

Three agents are committing into **one shared working tree**, and it caused a real collision. This
task staged exactly its own 13 files and then ran `git commit`. The resulting commit `c386164`
contains **30** files: the Analytics agent (pj-s26-03) staged their work into the same index in the
window between the `git add` and the `git commit`, so 17 of their files — `attribution.ts`,
`analytics-redact.ts`, migration `0033`, `web-analytics.tsx`, their tests, and their edits to
`layout.tsx` / `proxy.ts` / `auth.ts` / `schema.ts` — were swept in under this task's commit message.

**Nothing is lost or damaged** — their work is committed and intact, and this task's own 13 files are
correct in the same commit. It was **deliberately not corrected by rewriting history**: another agent
(pj-s26-06) has since committed on top (`1f4dc8f`), so a reset would put their work at risk to fix a
misattributed commit message. Not a trade worth making.

**PM action:** treat `c386164` as jointly owned by pj-s26-04/05 and pj-s26-03 when reconciling
tasks.json, and give each agent its own `git worktree` next sprint. `git add` + `git commit` is not
atomic against a concurrent writer.

---

## Files changed

| File | Change |
|---|---|
| `src/app/api/og/card/[type]/route.tsx` | `@vercel/og` → `next/og` |
| `src/app/api/og/prayer/[id]/route.tsx` | `@vercel/og` → `next/og` |
| `src/app/api/og/testimony/[id]/route.tsx` | `@vercel/og` → `next/og` |
| `src/app/api/og/wrapped/[userId]/route.tsx` | `@vercel/og` → `next/og` |
| `src/app/sitemap.ts` | −3 dead URLs, +10 category URLs, comments |
| `src/app/(public)/pray/[category]/page.tsx` | `notFound()` on unknown slug; "thousands" claims removed |
| `src/app/(public)/page.tsx` | added `metadata` (was inheriting the root layout) |
| `src/app/(public)/praise-wall/page.tsx` | searchable title + description |
| `src/app/(public)/pray/page.tsx` | added description |
| `src/app/(public)/know-jesus/page.tsx` | added description |
| `src/app/(public)/map/page.tsx` | added description |

No pricing or feature claim was changed. No content was fabricated.
