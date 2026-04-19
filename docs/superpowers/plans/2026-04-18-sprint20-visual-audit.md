# Sprint 20 — Full Visual Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and refresh every public/pre-login page not touched in Sprint 19 to match the Sprint 19 design direction — amber palette, Lucide icons, no emoji, brand-guide voice.

**Architecture:** Per-page tasks, paired Copywriter → Frontend flow. Copywriter produces all 8 copy briefs first as a single task; Frontend implements each page against its brief. QA and Reviewer gate the sprint.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS (amber palette), Lucide React icons, Shadcn/base-ui components, Drizzle ORM (only on read-side of /know-jesus), Vitest (where tests exist).

**Spec:** `docs/superpowers/specs/2026-04-18-sprint20-visual-audit-design.md`
**Brand source of truth:** `docs/brand/brand-guide.md`

---

## File Structure

### New files

| Path | Purpose |
|------|---------|
| `docs/sprint20/copy-briefs/know-jesus.md` | Copy brief for /know-jesus |
| `docs/sprint20/copy-briefs/give.md` | Copy brief for /give |
| `docs/sprint20/copy-briefs/about.md` | Copy brief for /about |
| `docs/sprint20/copy-briefs/browse.md` | Copy brief for /browse |
| `docs/sprint20/copy-briefs/find-a-church.md` | Copy brief for /find-a-church |
| `docs/sprint20/copy-briefs/world-prayer.md` | Copy brief for /world-prayer |
| `docs/sprint20/copy-briefs/contact.md` | Copy brief for /contact |
| `docs/sprint20/copy-briefs/help.md` | Copy brief for /help (incl. FAQ reorganization notes) |

### Modified files

| Path | Treatment |
|------|-----------|
| `src/app/(public)/know-jesus/page.tsx` | Full (visual + content) |
| `src/app/(public)/give/page.tsx` | Full |
| `src/app/(public)/about/page.tsx` | Full |
| `src/app/(public)/browse/page.tsx` | Full |
| `src/app/(public)/find-a-church/page.tsx` | Full |
| `src/app/(public)/world-prayer/page.tsx` | Full |
| `src/app/(public)/contact/page.tsx` | Full |
| `src/app/(public)/help/page.tsx` | Full + accordion anchor links |
| `src/app/(auth)/sign-in/page.tsx` | Light (visual only) |
| `src/app/(public)/docs/page.tsx` | Light (visual only) |
| `src/components/salvation-client.tsx` | Visual-only (if /know-jesus brief requires) |
| `.agent-state/tasks.json` | Status tracking per task |
| `.agent-state/handoffs.md` | Handoff log per handoff |
| `.agent-state/sprints.json` | Sprint 20 added as `active`, closed at end |

### Task dependency graph

```
Task 0 (branch setup)
    ↓
Task 1 (Copywriter: all 8 briefs)
    ↓
Tasks 2–9 (Frontend: full-treatment pages, parallelizable)
    ↓
Tasks 10–11 (Frontend: light pass, parallelizable with 2–9)
    ↓
Task 12 (QA sign-off across all pages)
    ↓
Task 13 (Reviewer approval)
    ↓
Task 14 (PM: close Sprint 20)
```

---

## Testing Approach

These pages are primarily content/visual surfaces — they have no existing unit tests, and the meaningful validation is visual + brand-compliance. The pattern for each Frontend task:

1. Apply code changes
2. Run `pnpm dev` and load the page (desktop + mobile viewport)
3. Verify: no emoji visible, Lucide icons render, amber palette applied, copy matches brief, no console errors
4. Run `pnpm typecheck` (catches import/type issues from new Lucide imports)
5. Commit

QA (Task 12) aggregates visual-regression + brand-compliance across all pages.

---

## Global Conventions (apply to all Frontend tasks)

**Lucide imports** use named imports from `lucide-react`:
```tsx
import { Globe, Heart, Shield, Settings, Church, Cross, HandHelping } from 'lucide-react';
```

**Amber emphasis pattern** (for emphasized text like region names, section headings):
```tsx
<span className="text-amber-600 dark:text-amber-400">{text}</span>
```

**Sacred strip pattern** (for special callouts, use sparingly — at most once per page):
```tsx
<div className="rounded-xl border border-amber-900/20 bg-amber-950/10 dark:bg-amber-950/20 p-6">
  {/* content */}
</div>
```

**ScrollReveal pattern** (wrap all below-fold sections):
```tsx
import { ScrollReveal } from '@/components/scroll-reveal';

<ScrollReveal delay={80}>
  <section>…</section>
</ScrollReveal>
```

Never wrap the hero (above the fold). Stagger siblings with `delay={n * 80}` (0, 80, 160, 240ms…).

**PrayerJar component** (import path):
```tsx
import { PrayerJar } from '@/components/prayer-jar';
```
Props: `count: number`, `size?: 'sm'|'md'|'lg'`, `mode?: 'lights'|'slips'`, `countLabel?: string`.

**Verse strip pattern** (for pages that warrant a scripture — at most one per page):
```tsx
<div className="border-t border-b py-4 mb-8 max-w-md mx-auto px-4">
  <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
    &ldquo;{verse.text}&rdquo;
  </p>
  <p className="text-xs text-primary mt-2 text-center">{verse.reference}</p>
</div>
```

---

## Task 0: Sprint 20 Kickoff (PM)

**Agent:** PM
**Files:**
- Modify: `.agent-state/sprints.json`
- Modify: `.agent-state/tasks.json`

- [ ] **Step 1: Add Sprint 20 to sprints.json**

Open `.agent-state/sprints.json` and add this entry at the end of the array:

```json
{
  "id": "20",
  "phase": 20,
  "name": "Full Visual Audit (Public Pages)",
  "features": 13,
  "size": "M",
  "status": "active"
}
```

- [ ] **Step 2: Create all 14 tasks in tasks.json as `proposed`**

Add entries for `pj-s20-01` through `pj-s20-14` to `.agent-state/tasks.json`. Each entry:

```json
{
  "id": "pj-s20-XX",
  "sprint": "20",
  "title": "<from plan>",
  "agent": "<from plan>",
  "status": "proposed",
  "created": "2026-04-18",
  "last_touched": "2026-04-18",
  "notes": []
}
```

Task list (id, title, agent):
- `pj-s20-01` — Copywriter briefs for all 8 full-treatment pages — Copywriter
- `pj-s20-02` — /know-jesus refresh (HIGH) — Frontend
- `pj-s20-03` — /give refresh (HIGH) — Frontend
- `pj-s20-04` — /about refresh — Frontend
- `pj-s20-05` — /browse refresh — Frontend
- `pj-s20-06` — /find-a-church refresh — Frontend
- `pj-s20-07` — /world-prayer refresh — Frontend
- `pj-s20-08` — /contact refresh — Frontend
- `pj-s20-09` — /help refresh + accordion anchors — Frontend
- `pj-s20-10` — /sign-in light pass — Frontend
- `pj-s20-11` — /docs light pass — Frontend
- `pj-s20-12` — QA sign-off across all pages — QA
- `pj-s20-13` — Reviewer final approval — Reviewer
- `pj-s20-14` — PM closes Sprint 20 — PM

- [ ] **Step 3: Approve all 14 tasks**

Set `status: "approved"` on tasks pj-s20-01 through pj-s20-14. Update `last_touched` to today.

- [ ] **Step 4: Commit**

```bash
git add .agent-state/sprints.json .agent-state/tasks.json
git commit -m "chore: kick off Sprint 20 (Full Visual Audit) — 13 tasks proposed and approved"
```

---

## Task 1: Copywriter Briefs for All 8 Pages

**Agent:** Copywriter
**Files:**
- Create: `docs/sprint20/copy-briefs/know-jesus.md`
- Create: `docs/sprint20/copy-briefs/give.md`
- Create: `docs/sprint20/copy-briefs/about.md`
- Create: `docs/sprint20/copy-briefs/browse.md`
- Create: `docs/sprint20/copy-briefs/find-a-church.md`
- Create: `docs/sprint20/copy-briefs/world-prayer.md`
- Create: `docs/sprint20/copy-briefs/contact.md`
- Create: `docs/sprint20/copy-briefs/help.md`

- [ ] **Step 1: Read the brand guide**

Read `docs/brand/brand-guide.md` in full. Pay attention to:
- §3 Voice attributes (Warm, Reverent, Specific, Faith-confident, Plainspoken)
- §7 Banned phrases table (16 items)
- §8.1 Usage by context (marketing pages)
- §9 Reference copy examples (headline + subhead, feature description)

- [ ] **Step 2: Read each current page**

Read each of these files to understand what currently exists:
- `src/app/(public)/know-jesus/page.tsx`
- `src/app/(public)/give/page.tsx`
- `src/app/(public)/about/page.tsx`
- `src/app/(public)/browse/page.tsx`
- `src/app/(public)/find-a-church/page.tsx`
- `src/app/(public)/world-prayer/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/help/page.tsx`

- [ ] **Step 3: Write each brief using this exact template**

Each brief is saved at `docs/sprint20/copy-briefs/<page>.md` and contains:

```markdown
# Copy Brief: /<page-name>

**Page purpose:** <one sentence>
**Audience:** <primary audience from brand guide §2>
**Brand guide sections to honor:** <specific section numbers, e.g., §3.1, §3.4, §7>

---

## Replacement copy

### Hero
**Current:**
> <quote current copy verbatim>

**New:**
> <final copy — exact text to render>

### Section: <name>
**Current:**
> <quote>

**New:**
> <final copy>

<repeat per section>

---

## Emoji → icon notes

For each emoji on this page, map it to the intended Lucide icon (Frontend will implement):

| Emoji | Location | Lucide icon | Rationale |
|-------|----------|-------------|-----------|
| 🙏 | success banner | Heart | Warmth without performativity |

(Leave this section empty if the page has no emoji.)

---

## Banned-phrase audit

List any phrases from `brand-guide.md §7` that currently appear on this page and their replacements:

| Current phrase | Location | Replacement |
|----------------|----------|-------------|

(Leave empty if clean.)

---

## Explicitly out of scope

List anything the Copywriter considered but deliberately left alone (form field labels, legal microcopy, etc.).
```

- [ ] **Step 4: Page-specific requirements per brief**

For **know-jesus.md**: honor §3.4 (faith-confident, not preachy). The page is for seekers — warm, direct, no Christian insider jargon. Do NOT propose a jar motif (spec §"What This Sprint Is NOT"). The PrayerJar product appears only as a first-step CTA ("When you're ready, one way forward is to ask for prayer").

For **give.md**: honor §3.3 (specific) and §8.1 (marketing page voice). Current copy uses "platform" twice (`"free for everyone — no ads, no paywalls, no data brokers"` is actually good; `"keeping this platform free"` in the not-configured state is not). Rewrite to name what the product IS, not "platform."

For **about.md**: the current page is already close to brand voice. Primary work: audit for any banned phrases, tighten, ensure one-verse-strip and jar-motif-once are honored.

For **browse.md**: focus on empty states and filter labels. Current empty state copy is acceptable but can be warmer. Category labels currently have emoji — this brief specifies category-to-icon mapping.

For **find-a-church.md**: mostly empty-state copy and error messages (geolocation failure, zero results).

For **world-prayer.md**: full rewrite of region prompts to be more specific (§3.3). Current prompts like "Pray for peace and reconciliation" are fine for Middle East; "Pray for open doors and persecuted believers" is also good for Asia. Review each of the 8 regions and sharpen where generic.

For **contact.md**: form labels to be plain-language per brand guide §3.5 ("Subject" stays but subtitles/placeholders warm up). Change placeholder "How can we help?" is acceptable; the "Get in Touch" heading is acceptable.

For **help.md**: this brief ADDITIONALLY specifies the **FAQ section ordering and anchor IDs** for the Frontend's UX fix. Propose:
- `#getting-started`
- `#praying-for-others`
- `#community-safety`
- `#account-settings`
- `#for-churches`

Keep the 5 existing sections; only add anchor IDs for jump navigation.

- [ ] **Step 5: Commit**

```bash
git add docs/sprint20/copy-briefs/
git commit -m "docs: Sprint 20 copy briefs for 8 public pages"
```

- [ ] **Step 6: Handoff to Frontend**

Update `.agent-state/tasks.json`: set `pj-s20-01` to `status: "done"`, add note with commit SHA. Append handoff line to `.agent-state/handoffs.md`:

```
[2026-04-18 HH:MM] Copywriter → Frontend: pj-s20-01 → pj-s20-02..09 — copy briefs committed, Frontend unblocked
```

---

## Task 2: /know-jesus Refresh (HIGH)

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/know-jesus/page.tsx`
- Read: `docs/sprint20/copy-briefs/know-jesus.md`
- Read (if needed): `src/components/salvation-client.tsx`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-02` → `status: "in-progress"`, update `last_touched`.

- [ ] **Step 2: Read the copy brief**

Read `docs/sprint20/copy-briefs/know-jesus.md`. This is the source of truth for all prose.

- [ ] **Step 3: Read current page + SalvationClient**

```bash
cat src/app/(public)/know-jesus/page.tsx
cat src/components/salvation-client.tsx
```

Current page is 29 lines. No emoji, no banned phrases. Main work: apply brief copy, wrap non-hero content in ScrollReveal, apply amber emphasis on emotionally-charged phrases per brief.

- [ ] **Step 4: Update page.tsx**

Edit `src/app/(public)/know-jesus/page.tsx`. Keep the data-fetching logic and SalvationClient render. Replace the heading block with the brief's copy. Wrap anything below the heading + subhead in `<ScrollReveal>`. Add amber emphasis where the brief calls for it (e.g., the name "Jesus" or a key phrase).

Example shape (prose to come from brief):

```tsx
import { db } from '@/db';
import { salvationDecisions } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { getDailyVerse } from '@/lib/daily-verse';
import { SalvationClient } from '@/components/salvation-client';
import { ScrollReveal } from '@/components/scroll-reveal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Know Jesus | The Prayer Jar' };

export default async function KnowJesusPage() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salvationDecisions);

  const verse = getDailyVerse();

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {/* COPY FROM BRIEF: hero headline; apply amber emphasis to key phrase per brief */}
        </h1>
        <p className="text-muted-foreground">
          {/* COPY FROM BRIEF: subhead */}
        </p>
      </div>

      <ScrollReveal>
        <SalvationClient initialCount={Number(count)} verse={verse} />
      </ScrollReveal>
    </main>
  );
}
```

If the brief requires changes inside `SalvationClient`, apply them. Read the client component first to understand its props and copy surfaces.

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS (no new errors from your changes).

- [ ] **Step 6: Dev server visual check**

```bash
pnpm dev
```

Load `http://localhost:3000/know-jesus`. Verify:
- Copy matches brief verbatim
- No emoji visible
- Amber emphasis renders where brief calls for it
- Below-fold sections fade/slide in on scroll
- Mobile viewport (375px) layout is clean

- [ ] **Step 7: Commit**

```bash
git add src/app/\(public\)/know-jesus/page.tsx
# and SalvationClient if modified
git commit -m "feat(know-jesus): refresh copy + amber emphasis + ScrollReveal per Sprint 20 brief"
```

- [ ] **Step 8: Handoff to QA (batched later)**

Update `.agent-state/tasks.json`: `pj-s20-02` → `status: "review"`, add note with commit SHA. Append handoff line:

```
[2026-04-18 HH:MM] Frontend → QA (batched): pj-s20-02 /know-jesus ready for review
```

---

## Task 3: /give Refresh (HIGH)

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/give/page.tsx`
- Read: `docs/sprint20/copy-briefs/give.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-03` → `status: "in-progress"`.

- [ ] **Step 2: Read the copy brief**

Read `docs/sprint20/copy-briefs/give.md`.

- [ ] **Step 3: Apply changes**

Edit `src/app/(public)/give/page.tsx`. Specific structural changes (copy from brief):

**a.** Replace the success-banner emoji (🙏 on line 73) with a Lucide `Heart` icon:

```tsx
import { Heart } from 'lucide-react';
// …
{success && (
  <div className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-amber-700 dark:text-amber-300">
    <div className="flex items-center justify-center gap-2">
      <Heart className="h-5 w-5" aria-hidden="true" />
      <p className="text-lg font-medium">{/* COPY FROM BRIEF */}</p>
    </div>
    <p className="text-sm mt-1 text-muted-foreground">
      {/* COPY FROM BRIEF */}
    </p>
  </div>
)}
```

**b.** Replace the "Donations coming soon" emoji (🙏 on line 83) with a Lucide `Heart` icon:

```tsx
{!stripeConfigured ? (
  <div className="rounded-xl border border-border bg-muted/30 px-8 py-10 text-center">
    <Heart className="h-6 w-6 mx-auto mb-3 text-amber-500" aria-hidden="true" />
    <p className="font-medium text-foreground mb-2">{/* COPY FROM BRIEF */}</p>
    <p className="text-sm text-muted-foreground">
      {/* COPY FROM BRIEF — do NOT use "platform" */}
    </p>
  </div>
) : /* … */}
```

**c.** Replace the hero block copy per brief (currently "Support The Prayer Jar"). Apply amber emphasis where brief specifies.

**d.** Wrap the preset-amounts fieldset and below in `<ScrollReveal delay={80}>`:

```tsx
import { ScrollReveal } from '@/components/scroll-reveal';
// …
<ScrollReveal delay={80}>
  <fieldset className="w-full">
    {/* existing amounts */}
  </fieldset>
  {/* error, CTA, secure-payment line */}
</ScrollReveal>
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Dev server visual check**

```bash
pnpm dev
```

Load `http://localhost:3000/give`. Verify:
- No 🙏 emoji anywhere
- Heart icon renders in success banner and "coming soon" state
- No "platform" appears on page
- Copy matches brief
- Amber palette preserved on preset buttons + success banner
- Mobile viewport clean

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/give/page.tsx
git commit -m "feat(give): strip emoji, remove 'platform', refresh copy per Sprint 20 brief"
```

- [ ] **Step 7: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-03` → `status: "review"`.

---

## Task 4: /about Refresh

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/about/page.tsx`
- Read: `docs/sprint20/copy-briefs/about.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-04` → `status: "in-progress"`.

- [ ] **Step 2: Read brief + current page**

```bash
cat docs/sprint20/copy-briefs/about.md
cat src/app/\(public\)/about/page.tsx
```

- [ ] **Step 3: Apply changes**

Edit `src/app/(public)/about/page.tsx`. Specific work:

**a.** Apply all copy replacements from the brief (verbatim).

**b.** Add PrayerJar motif to the hero. The page currently has no jar — per brand guide §4.2, the jar belongs on top-level pages as hero anchor. Import and render once:

```tsx
import { PrayerJar } from '@/components/prayer-jar';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { eq, and, gt, isNull, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getActiveCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayers)
    .where(and(
      eq(prayers.status, 'active'),
      gt(prayers.expiresAt, new Date()),
      isNull(prayers.groupId),
    ));
  return Number(row?.count ?? 0);
}

export default async function AboutPage() {
  const activeCount = await getActiveCount();
  // …
  return (
    <main className="…">
      <div className="flex justify-center mb-6">
        <PrayerJar count={activeCount} size="md" />
      </div>
      {/* rest of page */}
    </main>
  );
}
```

If the page is currently a sync server component or client component, convert it to `async` as shown above.

**c.** Wrap all sections below the hero+jar in `<ScrollReveal delay={n * 80}>` with staggered delays. Never wrap the hero.

**d.** Apply amber emphasis where brief calls for it.

**e.** Check for any banned phrases the brief flagged; replace.

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Dev server visual check**

```bash
pnpm dev
```

Load `http://localhost:3000/about`. Verify:
- PrayerJar renders in hero with live count
- No emoji visible
- No banned phrases
- ScrollReveal stagger plays
- Mobile viewport clean

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/about/page.tsx
git commit -m "feat(about): add jar motif, ScrollReveal, amber emphasis, brief copy"
```

- [ ] **Step 7: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-04` → `status: "review"`.

---

## Task 5: /browse Refresh

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/browse/page.tsx`
- Read: `docs/sprint20/copy-briefs/browse.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-05` → `status: "in-progress"`.

- [ ] **Step 2: Read brief + current page**

```bash
cat docs/sprint20/copy-briefs/browse.md
cat src/app/\(public\)/browse/page.tsx
```

- [ ] **Step 3: Replace CATEGORY_EMOJIS with Lucide icon map**

Current file has a `CATEGORY_EMOJIS` object mapping categories to emoji (🩺 🏡 💰 🕊️ 🙏 🧭 ❤️ 💼 ✨ ⭐ 📚). Replace with a Lucide icon map. Use these mappings:

```tsx
import {
  Heart,          // health, healing
  Home,           // family, home
  Wallet,         // finances, provision
  Dove as Peace,  // peace (Lucide doesn't have Dove — use HandHelping or Sparkles)
  HandHelping,    // prayer, intercession
  Compass,        // direction, guidance
  HeartHandshake, // relationships
  Briefcase,      // work, career
  Sparkles,       // gratitude, testimony
  Star,           // featured / urgent
  BookOpen,       // scripture, study
} from 'lucide-react';
```

Note: Lucide has no `Dove`. Substitute by choosing an on-brand Lucide icon that best expresses the category. Proposed mapping (Copywriter brief may override):

```tsx
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  health: Heart,
  family: Home,
  finances: Wallet,
  peace: HandHelping,     // substituting for 🕊️
  prayer: HandHelping,
  direction: Compass,
  relationships: HeartHandshake,
  work: Briefcase,
  gratitude: Sparkles,
  featured: Star,
  scripture: BookOpen,
};
```

Import the `LucideIcon` type:
```tsx
import type { LucideIcon } from 'lucide-react';
```

Render:
```tsx
const Icon = CATEGORY_ICONS[category] ?? HandHelping;
// …
<Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
```

- [ ] **Step 4: Apply brief copy for headers and empty states**

Replace any hero, filter-bar, and empty-state copy per brief.

- [ ] **Step 5: Apply amber palette to active filter states**

If a filter pill indicates "active," use the amber palette:
```tsx
className={isActive
  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
  : 'border-border bg-background text-foreground hover:bg-muted'
}
```

- [ ] **Step 6: Wrap below-fold sections in ScrollReveal**

Wrap the category grid and collections grid (not the search bar or hero). Stagger with `delay={80}`, `delay={160}`.

- [ ] **Step 7: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS. If a Lucide icon name is wrong (e.g., `Dove` doesn't exist), typecheck fails — adjust the icon choice.

- [ ] **Step 8: Dev server visual check**

```bash
pnpm dev
```

Load `http://localhost:3000/browse`. Verify:
- No emoji anywhere (category badges, empty states, labels)
- Lucide icons render in amber
- Active filter pill uses amber palette
- Mobile viewport clean

- [ ] **Step 9: Commit**

```bash
git add src/app/\(public\)/browse/page.tsx
git commit -m "feat(browse): replace emoji with Lucide icons, amber active-filter, brief copy"
```

- [ ] **Step 10: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-05` → `status: "review"`.

---

## Task 6: /find-a-church Refresh

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/find-a-church/page.tsx`
- Possibly modify: child components (`ChurchSearchBar`, `ChurchCard`) if brief specifies
- Read: `docs/sprint20/copy-briefs/find-a-church.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-06` → `status: "in-progress"`.

- [ ] **Step 2: Read brief + current page**

```bash
cat docs/sprint20/copy-briefs/find-a-church.md
cat src/app/\(public\)/find-a-church/page.tsx
```

- [ ] **Step 3: Add Lucide icons for search + filter UI**

Current page uses `ChurchSearchBar` — read that component and see if it has a visible search icon. If not, add:

```tsx
import { Search, MapPin, Filter } from 'lucide-react';
```

Use `Search` in the search-bar input (if missing), `MapPin` on the geolocation button, `Filter` on the filter dropdown trigger.

- [ ] **Step 4: Apply brief copy for empty state + geolocation error**

Replace:
- Zero-results empty state
- Geolocation-denied copy
- "Show more" button label (only if brief changes it)

- [ ] **Step 5: Apply amber palette to primary CTA + active sort/filter**

- [ ] **Step 6: Wrap the church list in ScrollReveal**

Not the search bar or toggle — just the list.

- [ ] **Step 7: Run typecheck + dev server check**

```bash
pnpm typecheck
pnpm dev
```

Load `http://localhost:3000/find-a-church`. Verify:
- Search icon, MapPin, Filter icons render
- Empty state copy matches brief
- Amber palette on active sort
- Mobile viewport clean
- Geolocation flow still works (grant permission, deny permission — both show the right copy)

- [ ] **Step 8: Commit**

```bash
git add src/app/\(public\)/find-a-church/page.tsx
# plus any modified child components
git commit -m "feat(find-a-church): Lucide icons, amber palette, warmer empty states"
```

- [ ] **Step 9: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-06` → `status: "review"`.

---

## Task 7: /world-prayer Refresh

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/world-prayer/page.tsx`
- Read: `docs/sprint20/copy-briefs/world-prayer.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-07` → `status: "in-progress"`.

- [ ] **Step 2: Read brief + current page**

- [ ] **Step 3: Replace all region emoji with Lucide icons**

Current page has 8 regions with emoji. Replace the `WORLD_REGIONS` array to use Lucide icons:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/scroll-reveal';
import { PrayerJar } from '@/components/prayer-jar';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { eq, and, gt, isNull, sql } from 'drizzle-orm';
import {
  HandHelping,   // Middle East — peace, reconciliation (no Dove in Lucide)
  Globe,         // Africa — global context
  Users,         // Asia — people, open doors
  Church,        // Europe — spiritual awakening
  Scale,         // Americas — unity, justice
  Leaf,          // Oceania — indigenous
  Landmark,      // Global leaders
  Cross,         // Persecuted Church
  type LucideIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pray for the World | The Prayer Jar' };

const WORLD_REGIONS: { region: string; Icon: LucideIcon; prompt: string }[] = [
  { region: 'Middle East',       Icon: HandHelping, prompt: /* FROM BRIEF */ '' },
  { region: 'Africa',            Icon: Globe,       prompt: /* FROM BRIEF */ '' },
  { region: 'Asia',              Icon: Users,       prompt: /* FROM BRIEF */ '' },
  { region: 'Europe',            Icon: Church,      prompt: /* FROM BRIEF */ '' },
  { region: 'Americas',          Icon: Scale,       prompt: /* FROM BRIEF */ '' },
  { region: 'Oceania',           Icon: Leaf,        prompt: /* FROM BRIEF */ '' },
  { region: 'Global Leaders',    Icon: Landmark,    prompt: /* FROM BRIEF */ '' },
  { region: 'Persecuted Church', Icon: Cross,       prompt: /* FROM BRIEF */ '' },
];

async function getActiveCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayers)
    .where(and(
      eq(prayers.status, 'active'),
      gt(prayers.expiresAt, new Date()),
      isNull(prayers.groupId),
    ));
  return Number(row?.count ?? 0);
}

export default async function WorldPrayerPage() {
  const activeCount = await getActiveCount();
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <div className="flex justify-center mb-6">
          <PrayerJar count={activeCount} size="md" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          {/* COPY FROM BRIEF: hero headline */}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {/* COPY FROM BRIEF: hero subhead — do NOT use "join the movement" */}
        </p>
      </div>

      <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {WORLD_REGIONS.map(({ region, Icon, prompt }) => (
            <Card key={region} className="group hover:border-primary/50 transition-colors">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-start gap-4">
                  <Icon className="h-6 w-6 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold mb-1">{region}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{prompt}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      render={<Link href="/pray" aria-label={`Pray for ${region}`} />}
                    >
                      Pray Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <div className="border-t pt-10 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {/* COPY FROM BRIEF: bottom CTA prompt */}
          </p>
          <Button size="lg" render={<Link href="/pray" />}>
            {/* COPY FROM BRIEF: CTA label */}
          </Button>
        </div>
      </ScrollReveal>
    </main>
  );
}
```

The 🌐 hero emoji is replaced by the PrayerJar component. Each region now uses a specific Lucide icon colored `text-amber-600`.

- [ ] **Step 4: Fill in copy from brief**

Replace each `/* COPY FROM BRIEF */` comment with the verbatim text from `docs/sprint20/copy-briefs/world-prayer.md`.

- [ ] **Step 5: Typecheck + dev server check**

```bash
pnpm typecheck
pnpm dev
```

Load `http://localhost:3000/world-prayer`. Verify:
- No emoji anywhere (hero or region cards)
- Each region card has a Lucide icon in amber
- Jar renders with live count
- ScrollReveal stagger plays
- Mobile viewport clean

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/world-prayer/page.tsx
git commit -m "feat(world-prayer): strip 8 region emoji, add jar + Lucide icons, ScrollReveal"
```

- [ ] **Step 7: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-07` → `status: "review"`.

---

## Task 8: /contact Refresh

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/contact/page.tsx`
- Read: `docs/sprint20/copy-briefs/contact.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-08` → `status: "in-progress"`.

- [ ] **Step 2: Read brief + current page**

- [ ] **Step 3: Replace the ✉️ emoji with Lucide Mail icon**

Current page has `<span className="text-5xl">&#x2709;&#xFE0F;</span>` on line 58. Replace:

```tsx
import { Mail } from 'lucide-react';
// …
<Mail className="h-10 w-10 mx-auto text-amber-600 dark:text-amber-400" aria-hidden="true" />
```

- [ ] **Step 4: Apply brief copy**

Replace hero heading + subhead with brief copy. Adjust form labels only if brief specifies (plain-language preference per brand guide §3.5).

- [ ] **Step 5: Wrap the form in ScrollReveal**

```tsx
import { ScrollReveal } from '@/components/scroll-reveal';
// …
<ScrollReveal>
  <form onSubmit={handleSubmit} className="space-y-5">
    {/* fields */}
  </form>
</ScrollReveal>
```

Do NOT wrap the hero (heading + Mail icon).

- [ ] **Step 6: Typecheck + dev server check**

```bash
pnpm typecheck
pnpm dev
```

Load `http://localhost:3000/contact`. Verify:
- Mail icon renders in amber
- No ✉️ emoji
- Copy matches brief
- Form still submits (test with real values, observe toast)
- Mobile viewport clean

- [ ] **Step 7: Commit**

```bash
git add src/app/\(public\)/contact/page.tsx
git commit -m "feat(contact): Mail icon, amber palette, refreshed copy per brief"
```

- [ ] **Step 8: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-08` → `status: "review"`.

---

## Task 9: /help Refresh + Accordion Anchors

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/help/page.tsx`
- Read: `docs/sprint20/copy-briefs/help.md`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-09` → `status: "in-progress"`.

- [ ] **Step 2: Read brief + current page**

The brief includes the full anchor-id list for each section.

- [ ] **Step 3: Replace the 5 section emoji with Lucide icons**

Current `SECTIONS` array has `icon: '🙏'`, `'✝️'`, `'🛡️'`, `'⚙️'`, `'⛪'`. Replace with Lucide components. Proposed mapping (Copywriter brief may override — honor the brief if it differs):

```tsx
import {
  HandHelping,  // Getting Started       (was 🙏)
  Cross,        // Praying for Others    (was ✝️)
  Shield,       // Community & Safety    (was 🛡️)
  Settings,     // Account & Settings    (was ⚙️)
  Church,       // For Churches          (was ⛪)
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

const SECTIONS: { title: string; id: string; Icon: LucideIcon; faqs: { q: string; a: string }[] }[] = [
  { title: 'Getting Started',      id: 'getting-started',     Icon: HandHelping, faqs: [/* existing */] },
  { title: 'Praying for Others',   id: 'praying-for-others',  Icon: Cross,       faqs: [/* existing */] },
  { title: 'Community & Safety',   id: 'community-safety',    Icon: Shield,      faqs: [/* existing */] },
  { title: 'Account & Settings',   id: 'account-settings',    Icon: Settings,    faqs: [/* existing */] },
  { title: 'For Churches',         id: 'for-churches',        Icon: Church,      faqs: [/* existing */] },
];
```

- [ ] **Step 4: Add anchor IDs + jump-nav to each section heading**

Change the section heading to accept an `id` and include an anchor affordance:

```tsx
<section key={section.title} id={section.id} className="scroll-mt-20">
  <h2 className="flex items-center gap-2 text-base font-semibold mb-2">
    <section.Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
    {section.title}
    <a
      href={`#${section.id}`}
      className="ml-2 text-xs text-muted-foreground hover:text-primary"
      aria-label={`Link to ${section.title}`}
    >
      #
    </a>
  </h2>
  {/* accordion */}
</section>
```

The `scroll-mt-20` class offsets the sticky header when scrolling to anchor.

- [ ] **Step 5: Add a jump-nav above the accordion list**

Above `<div className="space-y-8">…</div>`, add:

```tsx
<nav aria-label="Jump to section" className="mb-8 flex flex-wrap justify-center gap-2">
  {SECTIONS.map(({ title, id }) => (
    <a
      key={id}
      href={`#${id}`}
      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
    >
      {title}
    </a>
  ))}
</nav>
```

- [ ] **Step 6: Apply brief copy changes**

If brief rewrites any Q or A text, update the `faqs` arrays.

- [ ] **Step 7: Typecheck + dev server check**

```bash
pnpm typecheck
pnpm dev
```

Load `http://localhost:3000/help`. Verify:
- No section emoji; Lucide icons render in amber
- Jump-nav pills render at top
- Clicking a pill scrolls to that section with offset (sticky header not obscuring heading)
- Direct URL hash (`/help#community-safety`) scrolls to that section on load
- Accordion still opens/closes
- Mobile viewport clean

- [ ] **Step 8: Commit**

```bash
git add src/app/\(public\)/help/page.tsx
git commit -m "feat(help): Lucide section icons, jump-nav, anchor IDs, amber palette"
```

- [ ] **Step 9: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-09` → `status: "review"`.

---

## Task 10: /sign-in Light Pass

**Agent:** Frontend
**Files:**
- Modify: `src/app/(auth)/sign-in/page.tsx`

No copy brief — this is a visual-only light pass.

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-10` → `status: "in-progress"`.

- [ ] **Step 2: Read current page**

```bash
cat src/app/\(auth\)/sign-in/page.tsx
```

- [ ] **Step 3: Replace 🫙 jar emoji with a small PrayerJar component**

Current page uses 🫙 on line 44 as the branding mark. Replace with the actual component at `size="sm"`:

```tsx
import { PrayerJar } from '@/components/prayer-jar';
// …
<div className="flex justify-center mb-6">
  <PrayerJar count={0} size="sm" />
</div>
```

Using `count={0}` keeps the jar iconic (empty) without hitting the DB for sign-in. The jar's empty state is still recognizable.

If the brief or brand guide specifically requires a live count here, add a server-side fetch (but this page is `(auth)` route — the current file is likely a client component; if so, leave `count={0}`).

- [ ] **Step 4: Replace 📬 envelope emoji with Lucide Mail icon**

Current page uses 📬 in the "Check your email" verify state. Replace:

```tsx
import { Mail } from 'lucide-react';
// …
<Mail className="h-12 w-12 mx-auto text-amber-600 dark:text-amber-400" aria-hidden="true" />
```

- [ ] **Step 5: Apply amber palette to branding header**

If the page has a page title or header, ensure it uses `text-amber-600 dark:text-amber-400` for emphasis where the Sprint 19 pages use it.

- [ ] **Step 6: Typecheck + dev server check**

```bash
pnpm typecheck
pnpm dev
```

Load `http://localhost:3000/sign-in`. Verify:
- PrayerJar component renders (small) instead of 🫙
- No 📬 emoji; Mail icon renders
- OAuth button still works (click-through to Google — don't complete, just verify redirect starts)
- Email magic-link flow still works (submit email, check-your-email state shows Mail icon)
- Mobile viewport clean

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/sign-in/page.tsx
git commit -m "feat(sign-in): replace emoji with PrayerJar + Mail icon, amber palette"
```

- [ ] **Step 8: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-10` → `status: "review"`.

---

## Task 11: /docs Light Pass

**Agent:** Frontend
**Files:**
- Modify: `src/app/(public)/docs/page.tsx`

No copy brief — visual-only. This page has the most emoji of any in scope (26+ emoji across 253 lines).

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-11` → `status: "in-progress"`.

- [ ] **Step 2: Read current page**

```bash
cat src/app/\(public\)/docs/page.tsx
```

- [ ] **Step 3: Inventory every emoji usage site**

List every emoji and where it's used:
- Live stats cards: 🙏 ✍️ 🤝 (3)
- "How It Works" flow: 👥 ⚡ 🤲 ☀️ (4)
- "Who It's For": 💛 🙋 ⛪ 🌱 (4)
- "Our Commitments" grid: ✨ 🛡️ 🚫 🔒 💚 🥷 🤖 🗑️ 🌐 (9)
- Documentation nav grid: 📚 📖 👑 ✅ ✉️ ❓ (6)

Total: ~26 emoji. Each must be replaced with a Lucide icon colored `text-amber-600 dark:text-amber-400` or removed if purely decorative.

- [ ] **Step 4: Propose the Lucide replacement map**

Proposed mapping (mechanical — does not require copy changes):

| Section | Emoji | Lucide icon |
|---------|-------|-------------|
| Stats — Prayers | 🙏 | `HandHelping` |
| Stats — Interactions | ✍️ | `MessageCircle` |
| Stats — Users | 🤝 | `Users` |
| How It Works — step 1 | 👥 | `UserPlus` |
| How It Works — step 2 | ⚡ | `Zap` |
| How It Works — step 3 | 🤲 | `HandHelping` |
| How It Works — step 4 | ☀️ | `Sparkles` |
| Who It's For — Individuals | 💛 | `Heart` |
| Who It's For — Seekers | 🙋 | `HandHelping` |
| Who It's For — Churches | ⛪ | `Church` |
| Who It's For — New | 🌱 | `Sprout` |
| Commitments — Free | ✨ | `Gift` |
| Commitments — Privacy | 🛡️ | `Shield` |
| Commitments — No ads | 🚫 | `Ban` |
| Commitments — HTTPS | 🔒 | `Lock` |
| Commitments — Anonymous | 💚 | `Eye` (with slash) — use `EyeOff` |
| Commitments — No tracking | 🥷 | `EyeOff` |
| Commitments — AI safety | 🤖 | `Bot` |
| Commitments — Deletion | 🗑️ | `Trash2` |
| Commitments — Web | 🌐 | `Globe` |
| Docs nav — Privacy | 📚 | `BookOpen` |
| Docs nav — Terms | 📖 | `FileText` |
| Docs nav — Premium | 👑 | `Crown` |
| Docs nav — Acceptable Use | ✅ | `CheckCircle2` |
| Docs nav — Contact | ✉️ | `Mail` |
| Docs nav — Help | ❓ | `HelpCircle` |

- [ ] **Step 5: Apply the replacements**

For each emoji site, replace with the Lucide import and render:

```tsx
import {
  HandHelping, MessageCircle, Users, UserPlus, Zap, Sparkles,
  Heart, Church, Sprout, Gift, Shield, Ban, Lock, EyeOff, Bot,
  Trash2, Globe, BookOpen, FileText, Crown, CheckCircle2, Mail,
  HelpCircle, ChevronRight,
} from 'lucide-react';
```

Each icon site:
```tsx
<Icon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
```

For larger feature icons (stats cards, how-it-works steps), use `h-6 w-6` or `h-8 w-8`.

Keep `ChevronRight` (already Lucide) as-is.

- [ ] **Step 6: Wrap non-hero sections in ScrollReveal**

The page has several distinct sections (Stats, How It Works, Who It's For, Commitments, Docs Nav). Wrap each in `<ScrollReveal delay={n * 80}>` with staggered delays. The stats section can stay un-wrapped if it's above the fold on desktop.

- [ ] **Step 7: Typecheck + dev server check**

```bash
pnpm typecheck
pnpm dev
```

Load `http://localhost:3000/docs`. Verify:
- Zero emoji on page (check carefully — 26 sites)
- Each section renders with Lucide icons in amber
- ScrollReveal stagger plays
- Docs nav links still work (click each)
- Mobile viewport clean

- [ ] **Step 8: Commit**

```bash
git add src/app/\(public\)/docs/page.tsx
git commit -m "feat(docs): strip 26 emoji, replace with Lucide icons in amber, ScrollReveal"
```

- [ ] **Step 9: Handoff**

Update `.agent-state/tasks.json`: `pj-s20-11` → `status: "review"`.

---

## Task 12: QA Sign-Off Across All Pages

**Agent:** QA
**Files:**
- Read all modified pages
- Modify: `.agent-state/tasks.json`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-12` → `status: "in-progress"`.

- [ ] **Step 2: Run typecheck on whole repo**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test -- --run
```

Expected: No NEW failures (pre-existing failures documented in `.agent-state/` notes are allowed).

- [ ] **Step 4: Per-page manual visual check**

Start dev server once:
```bash
pnpm dev
```

Then walk through each URL on desktop (1440px) and mobile (375px) viewport:

- `/know-jesus`
- `/give`
- `/about`
- `/browse`
- `/find-a-church`
- `/world-prayer`
- `/contact`
- `/help`
- `/sign-in`
- `/docs`

Per page, verify ALL of the following:

1. **No emoji** in any visible text (headings, body, labels, buttons, empty states, alt text)
2. **Lucide icons** render where emoji used to be — and they're colored amber (`text-amber-600`/`text-amber-400`)
3. **Copy matches the brief verbatim** (for full-treatment pages)
4. **Banned phrases** cleared — Ctrl+F for: `platform`, `empower`, `empowers`, `leverage`, `solutions`, `unlock`, `seamless`, `streamlined`, `robust`, `best-in-class`, `join the movement`, `join the community`, `Amen!`, `most popular`, `recommended`, `best value`
5. **ScrollReveal** animates below-fold sections (watch on slow scroll)
6. **Verse strip** appears at most once per page (Ctrl+F for italic scripture patterns)
7. **PrayerJar** appears at most once per page (only on pages where spec requires it: /about, /world-prayer; NOT on /know-jesus)
8. **Mobile layout** — no horizontal overflow, no broken grids, buttons are thumb-sized
9. **Console** — no errors, no warnings about missing Lucide icons or React key props

- [ ] **Step 5: Dark-mode spot-check**

Toggle dark mode and verify amber palette still reads correctly (amber-400 on dark background, amber-600 on light) on at least `/about`, `/give`, `/help`, `/docs`.

- [ ] **Step 6: Per-page QA note**

For each page, add a note to the corresponding task in `.agent-state/tasks.json` with either:
- `"QA pass: all checks clean"` → set task `status: "review"` (unchanged, hands to Reviewer)
- `"QA fail: <specific issue>"` → set task `status: "needs-rework"` and hand back to Frontend

- [ ] **Step 7: Overall sprint QA summary**

In `pj-s20-12` notes, record:
- Which pages passed
- Which (if any) were kicked back and why
- Any cross-page drift observed (e.g., inconsistent amber shade between two pages)

- [ ] **Step 8: Commit notes**

```bash
git add .agent-state/tasks.json .agent-state/handoffs.md
git commit -m "chore: Sprint 20 QA sign-off notes"
```

- [ ] **Step 9: Set QA task to done**

If all pages pass: update `pj-s20-12` → `status: "done"`. If some pages kicked back, keep `pj-s20-12` at `in-progress` and re-QA after Frontend rework.

---

## Task 13: Reviewer Final Approval

**Agent:** Reviewer
**Files:**
- Read all modified files in the sprint
- Modify: `.agent-state/tasks.json`

- [ ] **Step 1: Set task to in-progress**

Update `.agent-state/tasks.json`: `pj-s20-13` → `status: "in-progress"`.

- [ ] **Step 2: Review each page's diff**

For each task `pj-s20-02` through `pj-s20-11`:

```bash
git log --oneline feature/prayer-jar -- src/app/\(public\)/<page>/page.tsx
git show <commit-sha>
```

Check:
- Code quality (no dead imports, no unused state)
- Consistent patterns across pages (same amber class names, same ScrollReveal pattern)
- No regressions (existing features — Stripe donation, geolocation, accordion — still work per QA notes)
- Copy brief alignment (spot-check 2 pages by diffing brief ↔ page.tsx)

- [ ] **Step 3: Per-task verdict**

For each task `pj-s20-02` through `pj-s20-11`:
- **Approve:** update `.agent-state/tasks.json` → `status: "done"`, add note with commit SHA
- **Reject:** update → `status: "needs-rework"`, add note with specific issue, hand back to Frontend

- [ ] **Step 4: Sprint-level review**

Check the sprint meets ALL success criteria from the spec (`docs/superpowers/specs/2026-04-18-sprint20-visual-audit-design.md` §Success Criteria):

1. No emoji in any visible text — verified
2. Lucide icons replace former emoji — verified
3. Amber palette applied — verified
4. Banned phrases cleared — verified
5. Copy voice matches brand guide — verified via brief compliance
6. One verse strip per page max — verified
7. ScrollReveal wraps below-fold sections — verified
8. Mobile view passes — verified via QA
9. QA signed off — verified
10. Reviewer approved — in progress (this step)

- [ ] **Step 5: Commit**

```bash
git add .agent-state/tasks.json
git commit -m "chore: Sprint 20 Reviewer approvals"
```

- [ ] **Step 6: Set Reviewer task to done**

Update `.agent-state/tasks.json`: `pj-s20-13` → `status: "done"`, add note summarizing approvals.

---

## Task 14: PM Closes Sprint 20

**Agent:** PM
**Files:**
- Modify: `.agent-state/sprints.json`
- Modify: `.agent-state/tasks.json`

- [ ] **Step 1: Verify all tasks are done**

Check that `pj-s20-01` through `pj-s20-13` all have `status: "done"`.

If any are still `in-progress`, `review`, `needs-rework`, or `proposed`: STOP — the sprint can't close. Escalate to Architect or hand specific issues back.

- [ ] **Step 2: Update sprints.json**

Edit `.agent-state/sprints.json`. Change Sprint 20 entry:

```json
{
  "id": "20",
  "phase": 20,
  "name": "Full Visual Audit (Public Pages)",
  "features": 13,
  "size": "M",
  "status": "done",
  "notes": "CLOSED 2026-04-18. All 13 tasks done. 8 full-treatment pages (/know-jesus, /give, /about, /browse, /find-a-church, /world-prayer, /contact, /help) + 2 light-pass pages (/sign-in, /docs). ~40+ emoji removed, all banned phrases cleared. Spec: docs/superpowers/specs/2026-04-18-sprint20-visual-audit-design.md."
}
```

- [ ] **Step 3: Update pj-s20-14 task**

Update `.agent-state/tasks.json`: `pj-s20-14` → `status: "done"`.

- [ ] **Step 4: Update memory**

Update the `MEMORY.md` index to add a new memory file recording Sprint 20 completion:

Create `memory/project_sprint20_complete.md`:

```markdown
---
name: Sprint 20 Complete
description: Sprint 20 (Full Visual Audit of public pages) closed 2026-04-18 — 8 pages full-treatment, 2 light-pass
type: project
---

Sprint 20 closed 2026-04-18. All 13 tasks done and approved.

**Pages refreshed (full visual + content):**
- /know-jesus, /give, /about, /browse, /find-a-church, /world-prayer, /contact, /help

**Pages refreshed (visual-only light pass):**
- /sign-in, /docs

**Why:** Continuation of Sprint 19 UI modernization. Apply amber palette, Lucide icons, no-emoji rule, brand-guide voice to every public/pre-login page.

**How to apply:** If looking at any of these pages in future sprints, the Sprint 20 design is the new baseline. Do not revert to emoji or the old palette. Auth user pages (/my-prayers, /profile, /settings, etc.) are NOT yet refreshed — that's Sprint 21 scope.
```

Then update `memory/MEMORY.md` to add this line in the index:
```
- [Sprint 20 Complete](project_sprint20_complete.md) — public pages refreshed, auth pages still Sprint 21 scope
```

Also remove or update the `project_sprint20_intent.md` entry — the intent is now realized.

- [ ] **Step 5: Commit**

```bash
git add .agent-state/sprints.json .agent-state/tasks.json
git commit -m "chore: close Sprint 20 — full visual audit of public pages complete"
```

- [ ] **Step 6: Announce completion**

End the sprint with a summary message to the human (PM's final deliverable):

> Sprint 20 closed. 13/13 tasks done. 10 public pages refreshed to Sprint 19 design baseline. Next: Sprint 21 (authenticated user pages) is the natural follow-on.

---

## Self-Review Checklist (run before marking plan complete)

**1. Spec coverage:**

| Spec section | Implementing task |
|---|---|
| Full-treatment /know-jesus | Task 2 |
| Full-treatment /give | Task 3 |
| Full-treatment /about | Task 4 |
| Full-treatment /browse | Task 5 |
| Full-treatment /find-a-church | Task 6 |
| Full-treatment /world-prayer | Task 7 |
| Full-treatment /contact | Task 8 |
| Full-treatment /help + UX fix | Task 9 |
| Light pass /sign-in | Task 10 |
| Light pass /docs | Task 11 |
| Copy briefs drive content | Task 1 |
| QA sign-off | Task 12 |
| Reviewer approval | Task 13 |
| Sprint close | Task 14 |

All spec requirements have a task. ✅

**2. Placeholder scan:**
- `/* COPY FROM BRIEF */` comments in page code are NOT placeholders — they're concrete references to another task's output (Task 1 briefs). Each is a concrete dependency.
- No `TBD`, `TODO`, `implement later`, or "similar to Task N" language.

**3. Type consistency:**
- `LucideIcon` type imported consistently
- `WORLD_REGIONS` now has `Icon: LucideIcon` shape (Task 7)
- `SECTIONS` in /help has `Icon: LucideIcon` and `id: string` (Task 9)
- `CATEGORY_ICONS: Record<string, LucideIcon>` (Task 5)

All consistent. ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-18-sprint20-visual-audit.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Given the sprint has 14 tasks with clear per-page boundaries, this scales cleanly.

**2. Inline Execution** — Execute tasks in this session using executing-plans, with checkpoints between groups (after Task 1 copy briefs; after all Frontend pages; after QA).

**Which approach?**
