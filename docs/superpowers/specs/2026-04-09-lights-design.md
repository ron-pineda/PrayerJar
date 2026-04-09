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

## Future: Country Filter

Country filtering on the Lights Released page is deferred. When added, it will require capturing country on prayer submission (IP geolocation or user-selected dropdown). Adds a second filter dimension alongside the time filter.

---

## Non-Functional Requirements

- **Performance:** Lights are pure CSS — no canvas, no JS animation libraries. No layout thrash (transform/opacity only).
- **SSR:** `PrayerJar` and `LightsSky` are client components but receive count as a prop from server components — no client-side data fetching for the initial render.
- **Accessibility:** Jar and sky are decorative (`aria-hidden="true"`). Counts are also conveyed in text below. Reduced motion respected.
