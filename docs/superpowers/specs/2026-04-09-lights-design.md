# Prayer Jar Visual Redesign — Design Specification

**Date:** 2026-04-09
**Status:** Approved

## Overview

Replace the text-only homepage hero with a large animated glass jar filled with floating amber prayer lights. Rename the Praise Wall to "Lights Released" with a matching dark sky visual filled with floating lights representing answered prayers. The two pages tell a connected story: prayers enter the jar as lights → when answered, they are released into the sky.

---

## Feature 1: Homepage Prayer Jar

### Visual Description

A large glass jar (CSS-drawn, no images) sits prominently in the homepage hero section. Inside the jar, amber glowing orbs float gently — each one representing an active prayer. The count of lights scales with the live active prayer count from the database, capped at 30 for visual clarity.

### Jar Dimensions

- Body: 140px wide × 180px tall
- Neck: 80px wide × 22px tall
- Border: amber (`rgba(212,168,67,0.5)`), 2.5px, rounded bottom corners (40px radius)
- Background: dark translucent (`rgba(10,10,20,0.8)`)
- Two subtle shine highlights (white, low opacity) for glass effect

### Lights

- Each light: radial gradient orb (amber/gold), with a soft box-shadow glow
- Sizes vary between 6px–13px diameter for natural feel
- Each light has an independent float animation (translateX/Y oscillation, 2.5–3.8s cycles, staggered delays)
- Each light also has an independent pulse animation (opacity 0.7→1, 1.6–2.4s cycles)
- Light count: `Math.min(activePrayerCount, 30)` lights rendered
- Lights are absolutely positioned within the jar body at pre-defined slots (30 positions defined in the component)

### Below the Jar

- Large number: `{activePrayerCount}` in amber, bold
- Label: "prayers in the jar" in muted text
- Existing CTA buttons unchanged: "Add a Prayer" (primary), "Pray for Someone" (outline)

### Component Architecture

**New file:** `src/components/prayer-jar.tsx`
- `'use client'` component
- Props: `{ count: number }`
- Renders the jar + lights entirely with CSS (no canvas, no SVG, no libraries)
- 30 light position slots defined as static data (left %, bottom %)
- Renders `Math.min(count, 30)` lights from the slot array

**Modified:** `src/app/(public)/page.tsx`
- Pass `stats.active` as `count` to `<PrayerJar>`
- Replace the current hero title/emoji area — keep `<h1>` and subtitle, insert jar between subtitle and CTA buttons

---

## Feature 2: Lights Released Page (renamed Praise Wall)

### Rename Scope

| Location | Before | After |
|----------|--------|-------|
| Page heading (`/praise-wall`) | "Praise Wall" | "Lights Released" |
| Mobile nav label | "Praise" | "Lights" |
| Homepage CTA link text | "View the Praise Wall →" | "View Lights Released →" |
| Page `<title>` / metadata | "Praise Wall" | "Lights Released" |

URL stays `/praise-wall` — no redirects, no database changes.

### Visual Description

The page header area shows a dark night sky (`#04040a → #0c0c1a` gradient) with:
- Tiny static star dots (CSS, randomized positions, twinkling animation)
- Floating amber lights — same orb style as the jar, but drifting freely in the sky
- Light count scales with the **filtered** answered prayer count, capped at 40

Below the sky header, the existing answered prayer cards render as today (renamed context only).

### Time Filter

A filter bar below the sky section with three options:

| Option | Query |
|--------|-------|
| This Week | `answeredAt >= 7 days ago` |
| This Month | `answeredAt >= 30 days ago` (default) |
| All Time | no date filter |

- Client component wraps the filter + cards
- On filter change: re-fetches answered prayers via a server action or new query
- The sky light count updates to match the filtered result count
- Active filter highlighted with amber accent

### Sky Light Component

**New file:** `src/components/lights-sky.tsx`
- `'use client'` component
- Props: `{ count: number }`
- Renders the sky background + floating lights
- 40 light position slots (top %, left %)
- Same float + pulse animations as the jar lights
- Also renders ~15 tiny static star dots for depth

### Architecture

**Modified:** `src/app/(public)/praise-wall/page.tsx`
- Add `<LightsSky count={filteredAnsweredCount} />` above the cards grid
- Wrap filter + cards in a client component (`LightsReleasedClient`) that owns filter state and re-queries on change
- Page title, metadata, and heading updated to "Lights Released"

**New file:** `src/components/lights-sky.tsx`

**Modified:** `src/components/mobile-nav.tsx` — "Praise" → "Lights"

**Modified:** `src/app/(public)/page.tsx` — "View the Praise Wall →" → "View Lights Released →"

**Modified:** `src/app/layout.tsx` — any nav links updated

---

## Animations

All CSS-only (`@keyframes`), already defined in `globals.css` or added inline:

| Animation | Used in |
|-----------|---------|
| `floatA/B/C` | Both jar lights and sky lights |
| `pulse` | Both jar lights and sky lights |
| `twinkle` | Star dots in the sky |

All animations already respect `prefers-reduced-motion` via the existing media query in `globals.css`.

---

## Feature 3: Daily Rotating Bible Verse

### Placement
- **Homepage:** Below the jar and above the CTA buttons
- **Lights Released page:** Below the sky/lights section and above the time filter + cards

### Behavior
- One verse shown at a time, selected by day of year (`dayOfYear % verses.length`)
- Same verse all day; changes at midnight
- Computed server-side (no client state needed) — just pass the verse as a prop

### Implementation
**New file:** `src/lib/daily-verse.ts`
- Exports a curated array of ~30 encouraging Bible verses (text + reference)
- Exports `getDailyVerse(): { text: string; reference: string }` — picks by `dayOfYear % verses.length`

**Verse list** (hardcoded, curated):
```
"For I know the plans I have for you..." — Jeremiah 29:11
"I can do all things through Christ who strengthens me." — Philippians 4:13
"The Lord is my shepherd; I shall not want." — Psalm 23:1
"Cast all your anxiety on him because he cares for you." — 1 Peter 5:7
"Be still and know that I am God." — Psalm 46:10
"Trust in the Lord with all your heart..." — Proverbs 3:5-6
"The Lord is close to the brokenhearted..." — Psalm 34:18
"Come to me, all you who are weary and burdened..." — Matthew 11:28
"Do not be anxious about anything..." — Philippians 4:6-7
"He heals the brokenhearted and binds up their wounds." — Psalm 147:3
"The Lord will fight for you; you need only to be still." — Exodus 14:14
"Even though I walk through the darkest valley, I will fear no evil..." — Psalm 23:4
"Ask and it will be given to you..." — Matthew 7:7
"For nothing will be impossible with God." — Luke 1:37
"God is our refuge and strength, an ever-present help in trouble." — Psalm 46:1
"The prayer of a righteous person is powerful and effective." — James 5:16
"Do not fear, for I am with you..." — Isaiah 41:10
"And we know that in all things God works for the good of those who love him." — Romans 8:28
"Let us therefore come boldly to the throne of grace..." — Hebrews 4:16
"Before they call I will answer; while they are still speaking I will hear." — Isaiah 65:24
"The Lord your God is with you, the Mighty Warrior who saves." — Zephaniah 3:17
"He gives strength to the weary and increases the power of the weak." — Isaiah 40:29
"Delight yourself in the Lord, and he will give you the desires of your heart." — Psalm 37:4
"With God all things are possible." — Matthew 19:26
"For the Lord your God is gracious and compassionate." — 2 Chronicles 30:9
"Peace I leave with you; my peace I give you." — John 14:27
"The Lord bless you and keep you..." — Numbers 6:24-26
"I lift up my eyes to the mountains — where does my help come from?" — Psalm 121:1-2
"Yet those who wait for the Lord will gain new strength..." — Isaiah 40:31
"This is the day the Lord has made; let us rejoice and be glad in it." — Psalm 118:24
```

### Display
- Italic verse text, muted foreground color
- Reference in amber, smaller font
- Subtle separator line above/below
- No animation — static, calm

---

## Future: Country Filter

Country filtering on the Lights Released page is deferred. When added, it will require capturing country on prayer submission (IP geolocation or user-selected dropdown). Adds a second filter dimension alongside the time filter.

---

## Non-Functional Requirements

- **Performance:** Lights are pure CSS — no canvas, no JS animation libraries. No layout thrash (transform/opacity only).
- **SSR:** `PrayerJar` and `LightsSky` are client components but receive count as a prop from server components — no client-side data fetching for the initial render.
- **Accessibility:** Jar and sky are decorative (`aria-hidden="true"`). Counts are also conveyed in text below. Reduced motion respected.
