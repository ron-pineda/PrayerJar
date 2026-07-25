# pj-s26-09-church-claims-honesty-pass — change detail

**Agent:** Copywriter + Frontend · **Date:** 2026-07-25 · **Status:** review (→ QA)

Ron's direction: *"stop selling it, then fix it."* This is the stop-selling half.
**No feature was built.** No `church_id` write, no `events/new` route, no
`flagPrayer` wiring — all of that stays with pj-s26-10.

---

## Corrections to the task brief

Verified read-only against prod (`DATABASE_URL` from `.env.local`) and against code.

### 1. The hero line was worse than the brief said

The brief quotes the hero as **"11 prayers held across 1 churches"**. It does not
render that. `getTrustStats` counts only `status in ('active','answered')`, and
**all 11 prod prayers are `status='expired'`** (`unexpired = 0`). The live values
are `churches=1, prayers=0, members=1`, so the page actually rendered:

- hero: **`0 prayers held across 1 churches`**
- strip: **`Churches 1 | Prayers Held 0 | Members Prayed For 1`**

This matters for the fix, not just the record: **the hero `countLabel` was not
inside the `trust.churches > 0` gate.** Raising that threshold alone would have
hidden the strip and left a jar captioned "0 prayers held across 1 churches".
Both now read one predicate.

### 2. "No analytics CSV exists" is imprecise

The event report CSV is real and tested
(`src/app/api/v1/church/[slug]/events/[eventId]/report.csv/route.ts`). It is not
missing — it is **behind a door that cannot be opened**, because no event can be
created. Relabelled as unreachable rather than absent.

### 3. Planning Center is NOT a false claim — left alone

Flagged as suspect, then cleared. `syncMember`/`syncGroup` are implemented
(`PlanningCenterAdapter.ts:442,512`) and both sync crons are registered in
`vercel.json` (`chms-sync-runner` daily 04:00, `chms-full-sync-scheduler` daily
03:00). "New members sync overnight" is backed. Only added that no church has
connected one in production yet.

Note: `syncGroup` writes the **`chmsGroups`** mirror table, not `groups` — so it
does not contradict the brief's finding that `groups.church_id` is never written.

### 4. `limits.groups` / `limits.admins` — confirmed unenforced, deliberately NOT relabelled

Only `limits.members` (`church-platform.service.ts:173`) and `limits.events`
(`event.service.ts:30`) are enforced. An unenforced *cap* is generous, not
overselling — the buyer gets more than promised. Reported, not changed. The real
problem on that card is that church-owned groups cannot exist at all.

---

## New false claims found that the brief did not list

1. **`/for-churches:222` — "Every feature below is available now — no waitlist,
   no setup fees."** A blanket guarantee sitting on top of nine cards, six of
   which are unreachable. Removed.
2. **The page's own headline and `metadata.description`** asserted "PrayerJar
   **is** the private prayer wall your congregation already wanted" — the single
   most prominent claim on the page, for the feature that does not work. Rewritten.
3. **Testimony approval queue is contradicted, not merely empty.**
   `markAnsweredAction` (`lifecycle.actions.ts:43`) writes the testimony straight
   to `prayers.testimony` and revalidates `/praise-wall`. It **never** inserts
   into `testimonyApprovals`; nothing in the app POSTs
   `/api/v1/church/[slug]/testimony`. So the card's promise — "it waits in your
   approval queue before going live … you decide what belongs on the wall" — is
   the opposite of what happens. This is a **moderation/safety** claim on a $49
   tier, so the card now says so in the first sentence.
4. **"Privacy levels: Public / Church Only / Private (pastoral staff only)"** on
   `/docs/features:34` and `/docs/churches:67` describes a feature that has no
   backing column at all — the `prayers` table (schema 101-128) has no
   `visibility` field. Fabricated, present tense, on two pages. Relabelled.
5. **Pastoral care inbox is misdescribed.** It renders `getPastoralNotes` — notes
   the team typed itself. It is not "a list of people waiting" and never fills on
   its own.
6. **`/church/join`** told invitees "Joining lets you view and post to this
   church's private prayer wall." Members cannot post to it.
7. **The church wall empty state** said "Be the first!" and linked to `/pray` —
   which posts to the public wall and can never land on that page.

---

## Trust strip / hero — before and after

Gate is now one predicate (`isPublishableTrust`) read by **both** the hero label
and the strip: `churches >= 5 && prayers >= 25 && members >= 50`.

| state | before (hero) | after (hero) | before (strip) | after (strip) |
|---|---|---|---|---|
| prod today `(1, 0, 1)` | `0 prayers held across 1 churches` | *(no label — jar only)* | `Churches 1 \| Prayers Held 0 \| Members 1` | *not rendered* |
| after test-church deletion `(0, 0, 0)` | `0 prayers held across 0 churches` | *(no label — jar only)* | *not rendered* | *not rendered* |
| singular edge `(1, 1, 1)` | `1 prayers held across 1 churches` | *(no label — jar only)* | rendered | *not rendered* |
| real scale `(7, 340, 900)` | `340 prayers held across 7 churches` | `340 prayers held across 7 churches` | rendered | rendered |

**pj-s26-12 is now non-load-bearing:** deleting the Test Church row moves prod
from `(1,0,1)` to `(0,0,0)`, and neither surface renders in either state.
(`church_members.church_id` is `notNull … onDelete cascade`, so the member count
goes to 0 with it.)

`pluralize()` is currently unreachable at the singular branch, because the gate
floors are above 1. That is intentional, not an oversight: it keeps the
`1 churches` bug from returning if the thresholds are ever lowered.

---

## Files changed

**Marketing / public**
- `src/app/(public)/for-churches/page.tsx` — trust gate + hero label + H1 +
  subhead + status banner + `metadata.description`; all nine FEATURE cards
  rewritten with a `notYet` strip (Clock icon) where unreachable; Network
  section's present-tense custom-subdomain claim.
- `src/lib/plans.ts` — `(coming soon)` on starter private wall; pro testimony
  queue, live event wall, advanced analytics; enterprise custom subdomain
  (aligning with `docs/paid:94`, which already said coming soon). Split starter
  "Basic analytics" into real `Member growth analytics` +
  `Prayer analytics (coming soon)`. Added `isComingSoonFeature()`.
- `src/components/tier-cards-section.tsx` — `(coming soon)` rows render a Clock,
  not a ✓. A checkmark beside "coming soon" still reads as included.
- `src/app/(public)/docs/paid/page.tsx` — same Clock treatment on plan cards;
  FEATURE_COMPARISON rows split into real vs Roadmap; three deep-dive bodies.
- `src/app/(public)/docs/churches/page.tsx` — private wall, groups, events and
  analytics sections; the 404 instruction; roles line; plan summary.
- `src/app/(public)/docs/features/page.tsx` — privacy levels; nine church rows.
- `src/app/(public)/docs/page.tsx` — two private-wall claims.
- `src/app/(public)/help/page.tsx` — three church FAQ answers.
- `src/app/(public)/church/join/page.tsx` — three invitee-facing wall promises.

**In-app (stopped pointing pastors at dead ends — no feature added)**
- `src/app/(church)/church/[slug]/(admin)/events/page.tsx` — the "+ Create Event"
  **link to the 404** replaced with a non-link notice, plus a banner explaining
  the state.
- `src/app/(church)/church/[slug]/(admin)/events/setup/page.tsx` — step 1 no
  longer instructs the pastor to click the 404; banner added.
- `src/app/(church)/church/[slug]/wall/page.tsx` — empty state no longer says
  "Be the first!".

---

## Conventions followed

- pj-s26-01 honest-label convention: `(coming soon)` in the label + `'Roadmap'`
  in the plan cell; `CellIcon` renders any string verbatim, so no type change.
- Brand guide §7 banned phrases: scanned every changed file — clean. (Remaining
  `unlock` hits in `plans.ts` are pre-existing **code comments**, not copy.)
- Sentence-case CTAs. Nothing fabricated — no invented prayers, churches,
  testimonies or numbers anywhere.

---

## Reported, deliberately NOT fixed (pre-existing drift, out of scope)

- `docs/paid` FEATURE_COMPARISON: free members `'25'` vs `plans.ts` 75; free
  groups `'1'` vs 3; plan cards say "save ~20%" vs `ANNUAL_DISCOUNT_PERCENT` 15.
- `docs/paid:88` lists Pastoral dashboard as Pro-only, contradicting
  `PASTORAL_DASHBOARD_TIER = 'starter'`. Understates — opposite direction.
- `docs/paid` "Most Popular" badge — §7 #12 scopes that ban to `/for-churches`;
  this is `/docs/paid`. Flagged, left.
- **The analytics page has no tier gate at all** — only a role check
  (`dashboard/analytics/page.tsx:31`). The sidebar hides the link below `pro`,
  but any admin or pastor on any plan can open the URL. That is a gating bug for
  Backend/Security, not a copy fix.
- `docs/churches` / `docs/features` still use emoji in their section data
  (§7 #14 scopes the emoji ban to the `/for-churches` FEATURES array).

---

## Gates

- `npx tsc --noEmit` → **0 errors**
- `npx vitest run` → **64 files, 513/513 passing**
- `npx next build` → **108/108 pages**
