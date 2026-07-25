# Sprint 26 — Share / Invite Path Review (pj-s26-05)

**Agent:** Growth · **Date:** 2026-07-24/25 · **Type:** review, not a feature build
**Prod baseline:** 6 users, 1 church, 11 prayers, 0 testimonies

The question this answers: *what can a real signed-in user actually do today to bring a second person
in, and where does that path break?*

Findings are ranked. One fix was landed because it belongs to the SEO task's blast radius anyway
(pj-s26-04, finding 1); everything else is written up as a recommendation with the change spelled
out, per the brief's "review task, not a feature build".

---

## The four paths that exist

Enumerated from source, not assumed. `ShareButtons` appears in exactly three places
(`guided-prayer.tsx`, `praise-card.tsx`, `p/[id]/page.tsx`); `invite` appears in church and group
contexts only.

| # | Path | Entry point | Status |
|---|---|---|---|
| 1 | Share one prayer | `/my-prayers` or `/browse` card → copy `/p/[id]` | **Works, but the social card is broken and the copy button gives no visible feedback** |
| 2 | Share the year recap | `/wrapped/[year]` → "Share on X" | **Broken as an acquisition path** — sends people to a raw PNG |
| 3 | Church invite | church admin → `/dashboard/team` → copy `/church/join?code=<slug>` | **Works end to end.** One design question below |
| 4 | Group invite | `/groups/[id]` → join code → `/api/v1/groups/join` | Works; private by nature, not an acquisition path |

**There is no "invite a friend" for an ordinary user.** Paths 3 and 4 both require you to be a church
admin or a group owner. A plain signed-in member — which is 5 of the 6 people on the platform — has
exactly one way to bring someone in: share a single prayer link. That path is path 1, and its social
card is currently broken. See finding 1.

---

## Finding 1 — Every shared prayer link renders with no image. **FIXED**

Path 1 is the only viral surface available to a normal user, and it has been silently degraded in
production.

`/p/[id]` sets `openGraph.images` and `twitter.images` to `/api/og/card/prayer?...` (or
`/api/og/card/answered` for answered prayers). Both 500 in production, deterministically across eight
consecutive requests including cache-busted ones:

```
GET /api/og/card/prayer?text=test&category=Health&count=1  → 500 text/html
GET /api/og/card/answered?text=test&category=Health        → 500 text/html
GET /opengraph-image                                       → 200 image/png
```

So the link works — it resolves, the prayer renders, the "Will you stand with them?" page is good —
but in WhatsApp, iMessage, Facebook and X it unfurls as a bare grey link. That is the difference
between a share someone taps and a share someone scrolls past.

Root cause and the fix are documented in full in `seo-audit.md` finding 1: the four OG route
handlers imported `ImageResponse` from `@vercel/og`; Next 16's shipped docs specify `next/og` for
route handlers, and Next's bundler only traces the Satori/Resvg WASM assets for `next/og`. Changed in
all four handlers.

**This does not reproduce locally** (`next start` returns `200 image/png` before and after) and
therefore **must be re-curled against production after deploy**. Flagged to QA for the pj-s26-07 gate.

**Verify all four OG routes, not just the card route.** `/api/og/prayer/[id]` and
`/api/og/wrapped/[userId]` resolve real IDs against the DB and can fail for reasons unrelated to the
import — they were exercised here only with a fabricated all-zeros UUID, which 500s regardless. A
tester who checks `/api/og/card/prayer` alone could declare this fixed while finding 2's route is
still broken. Exact commands are in `seo-audit.md` finding 1.

---

## Finding 2 — `/wrapped/[year]`'s share button sends people to a PNG, and leaks the user's ID

**Not fixed — recommended.** This is the single clearest broken acquisition step in the product.

`src/app/(public)/wrapped/[year]/page.tsx`:

```tsx
const ogUrl = `/api/og/wrapped/${userId}?year=${year}`;
// ...
href={`https://twitter.com/intent/tweet?text=My+${year}+Year+in+Prayer+on+%40PrayerJar+%F0%9F%99%8F&url=${encodeURIComponent(`https://prayerjar.org${ogUrl}`)}`}
```

The URL posted to X is the **image endpoint**, not a page. Three consequences:

1. **Zero acquisition value.** Someone who clicks lands on a bare PNG. No nav, no header, no CTA, no
   way to reach PrayerJar except editing the URL. The one feature explicitly built to be shared
   cannot convert anyone.
2. **It publishes the user's internal ID.** `userId` is a database primary key, posted in public to
   X, permanently. It also makes anyone's wrapped image enumerable by ID.
3. **No card either way.** `/wrapped/[year]`'s metadata is `{ title: 'Year in Prayer | The Prayer Jar' }`
   with no `openGraph.images`, so even sharing the page URL produces no preview.

**Recommended change** (Owner: Frontend — this is a user-facing behaviour change on their surface,
and 05 is a review task):

```tsx
// share the page, not the image
const shareUrl = `https://prayerjar.org/wrapped/${year}`;
// and give that page a card:
export const metadata: Metadata = {
  title: 'Year in Prayer | The Prayer Jar',
  openGraph: { images: [{ url: `/api/og/wrapped/${userId}?year=${year}`, width: 1200, height: 630 }] },
};
```

Note the metadata change requires moving to `generateMetadata` since `userId` comes from the session.
Keep the "Download Image" button pointing at `ogUrl` — that one is correct as-is.

**Effort: 45 min.** Depends on finding 1 landing first, since `/api/og/wrapped/[userId]` is one of
the four 500ing routes.

**Also flag to Ron:** the tweet text hardcodes **`@PrayerJar`**. I could not verify that this handle
exists or is controlled by PrayerJar. If it is not yours, every share mentions a stranger. One-minute
check, worth doing before this path gets any traffic.

---

## Finding 3 — The share button on your own prayer gives no visible feedback

**Not fixed — recommended.** Path 1's actual entry point is the `Share2` button on `PrayerCard`
(`src/components/prayer-card.tsx`), which is what a user taps on `/my-prayers` right after posting a
prayer. It does this:

```tsx
<Button size="sm" variant="ghost" onClick={handleCopyLink} className="px-2">
  <Share2 className="h-4 w-4" />
  <span className="sr-only">{copied ? 'Copied!' : 'Share Link'}</span>
</Button>
```

The `copied` state only ever reaches a **screen-reader-only** span. For a sighted user the icon does
not change, no toast fires, nothing moves. You tap Share and the interface does not acknowledge it.
The natural read is "that didn't work", and the natural next action is to tap again — or give up.

This is inconsistent with the rest of the same file, where every other action calls `toast(...)`
(`'Renewed — expires in 30 days'`, `'Added to your adopted prayers'`, `'Report submitted — thank you'`),
and with `ShareButtons`, which swaps the `Copy` icon for a green `Check`.

**Recommended change** (Owner: Frontend, **effort: 10 min**) — one line, matching the file's own
convention and `docs/brand/brand-guide.md` §8.2 on reverent confirmation copy:

```tsx
async function handleCopyLink() {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/p/${prayer.id}`);
    setCopied(true);
    toast('Link copied — send it to someone who will pray.');   // ← add
    setTimeout(() => setCopied(false), 2000);
  } catch {
    setError('Could not copy link. Try long-pressing Share.');
  }
}
```

Left unlanded because it is a UI behaviour change on Frontend's surface and this is a review task. It
is the cheapest real improvement in this document.

---

## Finding 4 — A malformed share link returns 500, not 404

**Not fixed — recommended.** Verified on production:

```
GET /p/nonexistent                              → 500
GET /p/00000000-0000-0000-0000-000000000000     → 404   (correct)
```

`getPrayerById` runs `eq(prayers.id, id)` against a `uuid` column, so a non-UUID string makes Postgres
raise `invalid input syntax for type uuid` and the page 500s. This happens whenever a share link gets
truncated by a messaging client, mangled by a link shortener, or hand-typed — exactly the population
of people arriving from a share. They get "A server error occurred" instead of a graceful miss.

**Not fixed deliberately.** The natural fix is a guard inside `getPrayerById` in
`src/services/prayer.service.ts` — shared code with existing test coverage, used by several callers.
Changing it to satisfy a Growth review is out of this task's blast radius and risks the suite.

**Recommended** (Owner: Backend, **effort: 20 min incl. a test**): guard in the page's own scope so
the service contract is untouched —

```tsx
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// in both generateMetadata and the page component:
if (!UUID_RE.test(id)) notFound();
```

Worth checking whether `/testimony/[id]`, `/campaigns/[slug]` and `/api/og/prayer/[id]` share the
shape. `/campaigns/nope` already 404s correctly, so this is not universal.

---

## Finding 5 — The church invite path works. One design question for Ron

Path 3 traced end to end, and it is the best-built share surface in the product:

1. Admin → `/church/[slug]/dashboard/team` → "Invite Members" → `CopyInviteLink` with
   `https://prayerjar.org/church/join?code=<slug>`. Real input, real copy button, real "Copied!"
   state — the affordance finding 3 is missing.
2. Recipient opens it. `/church/join` handles **four** states properly: no code, unknown code, signed
   out, already a member. Signed-out visitors see the church name, description and welcome message
   *before* being asked to sign in — the right order.
3. Sign-in preserves `callbackUrl` and returns them to the join page, with copy that says so.
4. `generateMetadata` resolves the church name, so the link previews as "Join <Church> | The Prayer Jar".

Nothing to fix. Two notes:

**(a) The invite "code" is the church's public slug.** `/church/join?code=<slug>` uses the same slug
as the public profile at `/church/[slug]`, which links to the join URL itself. So the invite link is
not a secret, cannot be rotated, and cannot be revoked. The UI is honest about the consequence
("Anyone with the link can join as a member"), but an admin reading "private prayer wall" may
reasonably assume the link is the gate. It is not — the wall is joinable by anyone who finds the
public profile. **This is arguably intended design** (the public profile is a join page), but it
should be a decision on the record rather than an accident. Owner: PM/Security to confirm intent;
**effort to add revocable codes if that is wanted: 3–4 h** (schema + rotation UI).

**(b) No church invite email.** Everything depends on the admin manually pasting the link somewhere.
Reasonable at one church; the obvious first automation when there are more.

---

## Finding 6 — There is no path for an ordinary member to invite anyone

Stated plainly because it is the structural answer to the brief's question.

The dashboard has no "invite a friend", no referral link, no "share PrayerJar" surface. `/badges`,
`/partner`, `/journal`, `/adopted`, `/prayed-for` — none of them offer a way to bring a second person
in. The only outward-facing action a member has is sharing a single prayer, which is inherently
limited: it requires having an active prayer you are willing to make public, and it shares *a
request*, not the product.

**Deliberately not designing a solution here.** The brief says reuse what exists, and inventing a
referral system at n=6 would be building instrumentation for traffic that does not exist. The honest
recommendation is the ordering:

1. Land finding 1 (verify in prod), then finding 3, then finding 2. Together they make the *existing*
   share path work properly. **Total effort: ~1.5 h.**
2. Only then consider a member-level invite surface — and only if pj-s26-03's funnel instrumentation
   shows people actually reaching the share buttons. Building it before that is optimising a step
   nobody has been observed taking.

---

## Guardrail compliance

No prayers, testimonies, screenshots or example content were fabricated for this review. Every
observation is from live production responses, the prod DB counts supplied in the kickoff, or source
in this repo. The walls are thin at n=6; nothing here pretends otherwise, and no recommendation
depends on them looking busier than they are.

---

## Summary for PM

| # | Finding | Status | Owner | Effort |
|---|---|---|---|---|
| 1 | Shared prayer links render no social card (`/api/og/card/*` 500s) | **Fixed** — needs prod re-curl | Growth → QA | done |
| 2 | `/wrapped` shares a raw PNG and leaks `userId`; `@PrayerJar` unverified | Recommended | Frontend | 45 min |
| 3 | Share button on own prayer gives no visible feedback | Recommended | Frontend | 10 min |
| 4 | Malformed `/p/[id]` returns 500 instead of 404 | Recommended | Backend | 20 min |
| 5 | Church invite works; invite code = public slug, unrevocable | Decision needed | PM/Security | 3–4 h if changed |
| 6 | No invite path for a non-admin member | Deferred by design | — | gate on pj-s26-03 |
