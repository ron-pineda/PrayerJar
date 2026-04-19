# Copy Brief: /find-a-church

**Priority:** Standard
**Treatment:** Full (visual + content)
**Date:** 2026-04-18
**Brand voice:** per `docs/brand/brand-guide.md` §3

## Current state — what's there now
Client page with no hero block — goes straight into `<ChurchSearchBar>`. After a search: sort/filter bar, mobile list/map tabs, `<ChurchCard>` results + `<ChurchMap>`. Three user-facing copy surfaces beyond the search bar:
1. Pre-search idle state (line 186–188): *"Search for churches above to get started."*
2. Zero-results state (line 201–210): *"No churches found in this area. Try expanding to 30 miles."*
3. Sort/filter labels: *"Denomination: All"*, *"Sort: Distance"*, *"Sort: Community Verified First"*.

No emoji in the page itself, but the `<ChurchCard>` and `<ChurchSearchBar>` subcomponents may contain emoji — Frontend should audit those in-pass. No banned phrases in visible copy.

## Voice notes for this page
- This is a directory utility. Warm where it matters (empty states), functional everywhere else.
- The page has no traditional hero — do not force one. A small page-intro block above the search bar (if Frontend has space) is the substitute.
- Zero-results should never feel like a dead end. Always name a next action.
- No jar motif; no verse strip. This is a directory, not a devotional page.

## Hero
**No traditional hero on this page.** If Frontend wants to add an intro block above the `<ChurchSearchBar>`:
**Headline:** Find a church near you
**Subheadline:** A place to be known by name, prayed for in person, and grow with people who will show up.
**Primary CTA:** (the search bar IS the CTA)
**Secondary CTA:** (none)

If the page must ship without a hero block (to preserve the current straight-into-search layout), that is acceptable — the search bar has its own placeholder copy. In that case, use the headline above as the `<title>` metadata only.

## Section copy

### Pre-search idle state
**Current:** "Search for churches above to get started."
**Replacement:** Enter a city, zip, or address above. We'll show churches near you and how they serve their community.

### Sort/count bar
**Count line:** `{n} churches nearby` *(change from "churches found" — "nearby" is warmer and more specific)*
**Denomination select label:** Denomination
**Denomination options:** "All denominations" (change from "All"), then each denomination string unchanged
**Sort select label:** Sort by
**Sort options:** "Distance" (unchanged), "Community verified first" (unchanged wording; sentence-case)

### Mobile tabs
**Tab 1 label:** `List ({filtered.length})` *(unchanged)*
**Tab 2 label:** Map *(unchanged)*

### Zero-results state (0 churches in radius)
**Heading:** No churches in that radius yet.
**Body:** Try expanding the search to 30 miles, or search another city.
**Primary CTA:** Expand to 30 miles
**Secondary CTA:** (none — keep it simple; search bar above is always available)

### Error state (search call fails)
**Copy:** We couldn't complete that search. Check your connection and try again.
*(Change from current `e.message` fallback, which leaks raw error strings like "Search failed (500)" to users. Keep technical errors in the console.)*

### "Show more" pagination button
**Label:** Show more ({remaining} remaining) *(unchanged)*

### Missing-search-coords error (when user lands without params)
*(Already covered by pre-search idle state above.)*

## Verse strip (if used)
No verse strip. Reason: directory/utility page — not a devotional surface.

## Lucide icon suggestions
- **Page intro (if hero block lands):** `Church` (h-6 w-6 text-amber-600) inline before the H1.
- **Pre-search idle state:** `MapPin` (h-8 w-8 text-muted-foreground) centered above the copy. Or, if Frontend prefers minimal, no icon.
- **Sort/count bar:**
  - Denomination select: no icon (select trigger is clean enough).
  - Sort select: no icon.
- **List/Map mobile tabs:** `List` (h-4 w-4) and `Map` (h-4 w-4) leading each tab label. Optional.
- **Zero-results state:** `SearchX` (h-8 w-8 text-muted-foreground) centered above the heading.
- **Expand-to-30-miles CTA:** no icon (the wording is clear).
- **Error state:** `AlertCircle` (h-4 w-4) inline before the error text. Keep amber-destructive treatment (`text-destructive bg-destructive/10`).
- **"Show more" button:** `ChevronDown` (h-4 w-4) trailing.

## Empty states (if applicable)
Covered above — pre-search idle and zero-results. Both get warmer copy + an actionable next step.

## Banned-phrase audit
- All 16 banned phrases searched against `find-a-church/page.tsx`, `church-search-bar.tsx`, and `church-card.tsx`.
- **None found** in `find-a-church/page.tsx`.
- Frontend should also scan the imported subcomponents (`<ChurchSearchBar>`, `<ChurchCard>`, `<ChurchMap>`) for banned phrases during implementation. Any hits in those files are in scope for this page's refresh.

## Jar motif
**No.** Directory page, not a devotional or marketing surface. Brand guide §4.2 reserves the jar for hero/product-identity placements.

## Notes for Frontend
- **Subcomponent scope:** `<ChurchSearchBar>` and `<ChurchCard>` are imported here but live in `src/components/church/`. Audit them for emoji and banned phrases as part of this page's refresh — they are effectively part of the `/find-a-church` visual experience.
- **Error state change:** replace `{e instanceof Error ? e.message : "Something went wrong"}` with a fixed user-facing string. Keep the raw message in a `console.error()` for debugging.
- **Denomination option value of "all"** must stay as the select's `value="all"` — only the display label changes from "Denomination: All" to "All denominations".
- **Sort option values** (`"distance"`, `"verified"`) stay unchanged. Only display labels change.
- **"30 miles" expansion CTA** — confirm the current search radius semantics. Current implementation calls `fetchResults(searchCoords!.lat, searchCoords!.lng, 30)` — so hardcoded 30 miles is correct. If the user already searched at 30+ miles, the "expand" action is a no-op — in that case, change the zero-results copy to *"No churches found near there. Try a different city."* and omit the CTA. This is a small conditional Frontend can add.
- **Mobile responsiveness:** the sort/filter bar currently relies on tight `<Select>` triggers (`h-7 text-xs px-2`). The label changes proposed above are not longer than current. Safe.
- **No hero block if layout is tight:** do not force the intro block if it breaks the at-a-glance search-first layout. The current "search bar is the hero" pattern is acceptable.