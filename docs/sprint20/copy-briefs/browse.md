# Copy Brief: /browse

**Priority:** Standard
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Server page with title + one-line subtitle, a search bar, two conditional sections (Collections, Browse by Category), and a prayer results list with empty-state. Single Lucide icon already in use (`BookMarked` next to "Collections"). **Heavy emoji usage** via the `CATEGORY_EMOJIS` record (lines 18–29): 🩺 👨‍👩‍👧 💰 🕊️ 🙏 🧭 ❤️ 💼 ✨ ⭐ applied to the Category grid tiles. Plus 📚 as the default collection cover emoji (line 88) and 🙏 as the category fallback (line 121). No banned-phrase hits in visible copy. Empty-state copy is functional but cold.

## Voice notes for this page
- This is a discovery surface — warm but quiet. The copy should disappear so the prayers are what users notice.
- Empty states must never leave the user stranded. Name the next action.
- Category tiles should feel like labels, not like a Slack reaction panel. Lucide icons, one amber accent per tile.
- No jar motif (per brand guide §4.2, once per page, and this page isn't the right home for it — `/` owns the hero jar).

## Hero
**Headline:** Browse Prayers
**Subheadline:** Find a prayer to stand with someone who needs it right now.
**Primary CTA:** (none — search bar IS the CTA)
**Secondary CTA:** (none)

## Section copy

### Collections section header
**Heading:** Collections
**Subheading (optional, only if Frontend wants one):** Grouped prayers curated by our team.
*(Current page has no subheading; adding one is optional and should only ship if it fits the layout. Otherwise leave just the heading.)*

### Collection card — metadata line
**Prayer count pattern:** `{n} prayer` / `{n} prayers` (unchanged from current — singular/plural logic is correct).

### Category grid section header
**Heading:** Browse by category
*(Sentence-case — change from current "Browse by Category" title-case.)*

### Category tile
**Category name:** (unchanged — uses `cat.label` from `PRAYER_CATEGORIES`)
**Count line:** `{n} prayer` / `{n} prayers` (unchanged)

### Results count line (when filtering)
**Query results:** `{n} results for "{query}"` (unchanged; truncation to 60 chars unchanged)
**Category results:** `{n} prayer` / `{n} prayers` in {category}

### "Clear" button
**Label:** Clear filters
*(Change from current "Clear" to "Clear filters" — specific beats generic, per role spec.)*

### Recent Prayers sub-header (when no filter active)
**Label:** Recent prayers
*(Sentence-case.)*

### Prayer result card — CTA
**Primary CTA on each card:** Pray for a request like this → `/pray/{category}`
*(Change from current "Pray for someone like this →" — "a request like this" is slightly more specific, and drops the ambiguous "someone" that might imply the card author specifically.)*

### Empty state — search returned nothing
**Heading (above current muted line):** No prayers match that search yet.
**Body line 1:** `We couldn't find anything for "{query}".`
**Body line 2:** `Try a shorter search, or browse a category below.`
**CTA:** Clear filters → `/browse`

### Empty state — filter returned nothing
**Heading:** Nothing here yet in {category}.
**Body:** No prayers have been posted in this category recently. Try another, or check back soon.
**CTA:** Clear filters → `/browse`

## Verse strip (if used)
No verse strip on this page. Reason: `/browse` is a utility discovery page. A verse would make it feel ceremonial when the job is to help a user scan and pray. Per brand guide §4.3, one verse max and only "where a mission statement would go" — not applicable here.

## Lucide icon suggestions
- **"Collections" heading:** keep existing `BookMarked` (h-5 w-5). Already on-brand.
- **"Browse by category" heading:** `LayoutGrid` (h-5 w-5 text-muted-foreground) inline before heading. Optional — Frontend's call.
- **Category tiles — replace all 10 emoji with Lucide icons (`h-6 w-6`, centered, `text-amber-600`):**
  - `health` (🩺): `HeartPulse`
  - `family` (👨‍👩‍👧): `Users`
  - `financial` (💰): `Wallet`
  - `grief` (🕊️): `Feather`
  - `gratitude` (🙏): `Sparkles`
  - `guidance` (🧭): `Compass`
  - `relationships` (❤️): `Heart`
  - `work_career` (💼): `Briefcase`
  - `spiritual_growth` (✨): `Leaf`
  - `other` (⭐): `Star`
- **Fallback (when a category has no icon mapping):** `Circle` (h-6 w-6).
- **Collection card default cover (📚 fallback):** `BookMarked` (h-6 w-6 text-amber-600) — same icon as the section header.
- **Result card "Pray for a request like this" CTA:** `ArrowRight` (h-3.5 w-3.5) trailing — replacing the current literal `→` arrow character for icon consistency.
- **Urgent badge:** no icon change. The destructive-variant Badge reads fine without.

## Empty states (if applicable)
See "Section copy" above — both empty states (search-no-match, filter-no-match) are rewritten. Current copy: *"No prayers found for '{q}'."* and *"No prayers found with these filters."* — these are factually correct but cold. Replace with the warmer versions above.

## Banned-phrase audit
- All 16 banned phrases searched against current page source.
- **None found.**

## Jar motif
**No.** The homepage (`/`) owns the hero jar. `/browse` is a utility page — adding a jar here would dilute the motif and violate brand guide §4.2 ("once per page at most; it's a seal, not a pattern" — and the product's overall usage of the jar is "one page is its home, not sprinkled across every route").

## Notes for Frontend
- **Delete the `CATEGORY_EMOJIS` record entirely** (lines 18–29). Replace with a Lucide icon map. Recommended shape:
  ```ts
  const CATEGORY_ICONS: Record<string, LucideIcon> = {
    health: HeartPulse, family: Users, financial: Wallet, grief: Feather,
    gratitude: Sparkles, guidance: Compass, relationships: Heart,
    work_career: Briefcase, spiritual_growth: Leaf, other: Star,
  };
  ```
- **Replace `col.coverEmoji ?? "📚"`** on line 88 with a Lucide icon. Note: `coverEmoji` is a DB column on the `collections` table — do NOT delete the column. Just stop rendering the emoji visually; render `BookMarked` (or a Lucide icon chosen by the collection's content) instead. If the design requires honoring `coverEmoji`, that's a DB-side content decision — out of scope here, and flag to Architect.
- **Replace `CATEGORY_EMOJIS[cat.value] ?? "🙏"`** on line 121 with the Lucide icon lookup + `Circle` fallback.
- **Wrap the 3 content blocks in `<ScrollReveal delay={n * 80} />`:** Collections section, Category grid, Results list. Do not wrap the hero or search bar.
- **Sentence-case headings:** change "Browse by Category" → "Browse by category" and "Recent Prayers" → "Recent prayers". Consistent with the rest of the page (`prayer` / `prayers` is lowercase in body).
- **Character limits:** All headings ≤ 20 chars. CTA button "Pray for a request like this" is 32 chars — confirm mobile breakpoint wrap doesn't look awkward; if it does, shorten to "Pray like this" (14 chars).
- **The CTA link target `/pray/{category}`** is unchanged — Frontend only needs to update the visible button text.