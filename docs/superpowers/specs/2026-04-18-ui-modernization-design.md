# Sprint 19 — UI Modernization Design Spec

## Goal

Polish all five key public surfaces — homepage (signed-out), homepage (signed-in), `/for-churches`, `/pray`, and `/praise-wall` — using the PrayerJar as the visual signature piece. Direction: warm and intimate (Direction A), amber palette, the jar as hero. No design-system overhaul; targeted, high-value changes only.

## Approach

**Jar-first, then page redesigns.** Upgrade the `PrayerJar` component with a `mode` prop and a `size` prop, then redesign each page around that anchor. The jar is the one visual asset that makes PrayerJar distinct — it earns its place as a signature hero piece on every surface.

## Tech Stack

- Next.js 15 App Router, Tailwind CSS, shadcn/ui (base-ui render prop pattern)
- Existing `PrayerJar` component upgraded in place — no new libraries
- CSS-only animations for slip-drop and light-escape sequences
- New data fetch for personal stats (data already in DB via `prayerInteractions` table)

---

## Part 1 — PrayerJar Component Upgrade

**File:** `src/components/prayer-jar.tsx`

### Changes

**`size` prop** — `'sm' | 'md' | 'lg'` (default: `'md'`)
- `sm`: ~100px wide — for use inside cards and nav contexts
- `md`: current default size — existing behavior
- `lg`: ~180px wide — hero placement; shows count label below jar

**`mode` prop** — `'lights' | 'slips'` (default: `'lights'`)
- `lights`: current behavior — animated golden orbs representing prayers held or answered
- `slips`: paper slips with faint ruled lines and slight random rotations — represents written prayer requests waiting for intercession

**Count label** — shown only when `size="lg"`. Displayed below the jar in amber text (e.g., "1,204 prayers held" or "847 requests waiting"). Accepts a `countLabel` string prop; when omitted, no label is shown.

**Slip drop animation** — exported separately as `SlipDropAnimation` — a CSS-only animation of a paper slip falling into the jar, triggered in `PrayerDialog` after a prayer is successfully submitted (the dialog's success state). This is the moment a user's own prayer enters the jar.

**Light escape animation** — exported separately as `LightEscapeAnimation` — a CSS-only animation of a golden orb rising and floating upward, triggered after marking a prayer answered on `/praise-wall`.

### What stays the same

All existing float, pulse, and glow animation logic. The amber `rgba(212,168,67,…)` palette. The glass-shine highlights. The neck + body structure.

---

## Part 2 — Homepage (Signed Out)

**File:** `src/app/(public)/page.tsx`

### Section changes

| Section | Action | Detail |
|---|---|---|
| Hero | Modify | Jar at `size="lg"` with `countLabel`. Headline changes from "The Prayer Jar" to "Where every prayer finds a witness." Stats ("X prayers waiting · X answered") displayed as amber inline text below the jar — not separate stat boxes. CTAs unchanged. |
| Daily Verse | Keep | No change. |
| How It Works | Keep | Content unchanged. Swap emoji circle icons for thin Lucide SVG icons matching existing icon set. |
| Stats Strip | Remove | Stats are now inline in the hero. The standalone stats strip is redundant and removed. |
| Secondary CTAs | Modify | Replace emoji pill links with clean icon cards. Destinations unchanged: Know Jesus, Answered Prayers, Find a Church. Style to match the `/for-churches` card visual language. |

---

## Part 3 — Homepage (Signed In)

**File:** `src/app/(public)/page.tsx`

### Section changes

| Section | Action | Detail |
|---|---|---|
| Greeting + Jar | Modify | Jar stays at top at `md` size. First name displayed in larger type. Prayed-for count gets visual prominence: "3 people prayed for you this week" as a distinct line rather than muted inline text. |
| PrayerDialog + two cards | Keep | Content is correct. Minor border/spacing polish on the card pair. |
| Daily Verse | Keep | No change. |
| Stats Strip | Replace | **Remove** platform-wide stats. **Add** personal stats strip: "X prayers submitted · X times interceded · X answered." Data fetched in `getHomepageData` from the existing `prayerInteractions` table. Three new DB queries added to `src/services/homepage.service.ts`. |
| Secondary CTAs | Modify | Replace "Know Jesus / Find a Church" (signed-out framing) with: **Pray for Someone** (`/pray`), **Praise Wall** (`/praise-wall`), **My Church** (link to `/church/[slug]` if the user belongs to a church, or `/find-a-church` if not). Church membership check is already available in the session/DB. |

---

## Part 4 — /for-churches

**File:** `src/app/(public)/for-churches/page.tsx`

### Section changes

| Section | Action | Detail |
|---|---|---|
| Hero | Modify | Add jar at `size="lg"` above the headline. Headline, sub-copy, and CTAs unchanged — they're strong. Currently the hero is text-only except for a small jar. |
| Verse Strip | Keep | No change. |
| Features Grid | Keep | All 9 feature cards, content unchanged. Minor padding/spacing polish. |
| Pricing Calculator | Keep | No change. |
| Tier Cards | Keep | No change. |
| FAQ | Keep | No change. |
| Testimonials (3 placeholders) | **Remove** | Three explicit `[PLACEHOLDER]` quotes with red badges. Removed entirely. |
| Trust Strip | **New** | Replaces testimonials. Real numbers fetched from the DB at render time: "X churches using PrayerJar · Y prayers held · Z members prayed for." Three aggregate queries. Honest and compelling — live data beats placeholder quotes. |
| Enterprise Section | Keep | No change. |
| Bottom CTA | Keep | No change. |

### New DB queries for trust strip

In `src/app/(public)/for-churches/page.tsx` (server component):
- Count of churches with at least one member: `SELECT COUNT(DISTINCT church_id) FROM church_members`
- Total active + answered prayers: already available from homepage stats pattern
- Total church members across all churches: `SELECT COUNT(*) FROM church_members`

---

## Part 5 — /pray (Prayer Wall)

**File:** `src/app/(public)/pray/page.tsx`

### Section changes

| Section | Action | Detail |
|---|---|---|
| Page Header | Modify | Replace bare headline + one-liner with a proper hero: slips-mode jar at `size="md"` centered above the heading. Headline changes to "Someone wrote this for you." Sub-copy: "Choose a category and intercede for a real request from the community." |
| CategoryPicker | Keep | No change. |
| Browse link | Keep | No change. |
| Slip drop animation | **New** | `SlipDropAnimation` plays in `PrayerDialog` after a user successfully adds their own prayer — the slip falls into the jar before the success message renders. CSS-only. Not triggered here; the animation is wired in `PrayerDialog`, which is already rendered on the homepage. |

---

## Part 6 — /praise-wall (Lights Released)

**File:** `src/app/(public)/praise-wall/page.tsx`

### Section changes

| Section | Action | Detail |
|---|---|---|
| Page Header | Modify | Larger, more celebratory treatment. Add lights-mode jar at `size="md"` above the headline. Answered prayer count displayed: "X lights released." Headline "Lights Released" gains visual weight — larger type, more vertical space. |
| Daily Verse | Keep | No change. |
| Category Filter | Keep | No change. |
| LightsReleasedClient | Keep | No change. |
| Light escape animation | **New** | `LightEscapeAnimation` plays as each answered prayer card enters the viewport in `LightsReleasedClient` — an orb rises from the card and floats upward. CSS-only entry animation, plays once per card. No changes to the prayer-answering flow required. |

---

## Data Work Summary

| Query | Surface | Where |
|---|---|---|
| Personal stats (submitted, interceded, answered) | Signed-in homepage | `src/services/homepage.service.ts` |
| Church count, prayer count, member count | /for-churches trust strip | `src/app/(public)/for-churches/page.tsx` |
| Church membership check for signed-in CTAs | Signed-in homepage | Already available in session/existing DB queries |

---

## Out of Scope for Sprint 19

- Design system tokens or shared component library abstractions
- Changes to any page not listed above (Sprint 20 covers full-site audit)
- Real testimonial copy collection (no fake quotes; stat strip is the solution)
- New page routes or navigation changes
- Mobile-specific layout changes beyond what Tailwind responsive classes already handle

---

## Testing

- Visual regression: manually verify all 5 surfaces at mobile (375px), tablet (768px), and desktop (1280px) breakpoints
- Data queries: verify personal stats fetch returns correct counts against known test data
- Animations: verify slip-drop and light-escape play once, don't loop, and don't block interaction
- Signed-in CTAs: verify "My Church" links correctly for users in a church and shows "Find a Church" for users not in one
- /for-churches trust strip: verify counts are non-zero against production data before ship
