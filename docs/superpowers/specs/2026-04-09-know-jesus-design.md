# Know Jesus Page — Design Specification

**Date:** 2026-04-09
**Status:** Approved

## Overview

A warm, conversational page that introduces anyone — curious seeker or longtime churchgoer who hasn't made a decision — to Jesus and the gospel. The page follows the same visual language as the homepage (prayer jar) and Lights Released (sky), completing the story: prayers go up → answered prayers released into the sky → new believers become lights in the world, symbolized by a cross radiating light.

The page ends with a displayed salvation prayer, an optional name field, and a "I prayed this prayer" button that logs the decision and reveals next steps.

---

## URL & Navigation

- **Route:** `/know-jesus`
- **Desktop nav:** "Know Jesus" link added alongside existing nav items
- **Mobile:** not added to the bottom nav (already at 5 items + elevated Add). Instead, a "Know Jesus →" link is added to the homepage below the "View Lights Released →" CTA

---

## Feature 1: Salvation Cross Visual

### Visual Description

A CSS-drawn cross sits centered on a dark background matching the app's dark palette. Amber light rays radiate outward from the cross intersection. Small amber orbs (identical style to the prayer jar lights) float upward from the cross continuously — each one representing a soul that said yes.

### Cross Dimensions

- Vertical bar: 8px wide × 120px tall
- Horizontal bar: 80px wide × 8px tall
- Color: amber (`rgba(212,168,67,0.9)`)
- Box shadow: warm amber glow (`0 0 30px 8px rgba(212,168,67,0.3)`)
- 8 light rays radiating outward at 45° intervals — thin divs, rotated, fading to transparent

### Floating Orbs

- Same radial gradient style as prayer jar lights
- 15 orb slots defined as static positions around/above the cross
- Each orb floats upward with the existing `light-float-a/b/c` animations
- Count: `Math.min(count, 15)` orbs rendered (always show at least a few even at count=0 — use `Math.max(3, Math.min(count, 15))`)
- Same pulse animation as jar lights

### Below the Cross

- Counter: large amber number `{count}` bold
- Label: "lives transformed" in muted text

### Component

**New file:** `src/components/salvation-cross.tsx`
- `'use client'` component
- Props: `{ count: number }`
- CSS-only (no canvas, no SVG, no libraries)
- `aria-hidden="true"` — decorative

---

## Feature 2: Page Content

### Tone

Warm and conversational — like a trusted friend explaining. Scripture is woven in naturally, not quoted like a textbook. Uses "you" and "we" throughout.

### Sections

**Section 1 — God loves you**
> "Before you had a name, God knew you. Before you made a single choice, good or bad, he loved you. *'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'* — John 3:16"

**Section 2 — We all drift**
> "Here's something honest: every one of us has wandered. Not because we're terrible — but because we're human. *'For all have sinned and fall short of the glory of God.'* — Romans 3:23. That's not shame. That's just the truth about all of us."

**Section 3 — Jesus is the bridge**
> "God didn't leave us there. He sent Jesus — not to judge, but to rescue. Jesus lived the life we couldn't live, died the death we deserved, and rose again. *'But God demonstrates his own love for us in this: while we were still sinners, Christ died for us.'* — Romans 5:8"

**Section 4 — It's a gift, not an earning**
> "You don't have to clean yourself up first. You don't have to be good enough. *'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.'* — Ephesians 2:8-9"

**Section 5 — How to receive it**
> "*'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.'* — Romans 10:9. That's it. A prayer, a turning, a yes."

---

## Feature 3: Salvation Prayer + Decision

### Prayer Display

The prayer is displayed in a styled block — italic, centered, set apart with a border similar to the daily verse style:

> *"Jesus, I believe you died for me and rose again. I turn from my own way and ask you to come into my life. Thank you for forgiving me. I'm yours. Amen."*

### Decision Flow

1. Optional first name input: placeholder "Your first name (optional)"
2. Button: "I prayed this prayer" (primary, amber)
3. On click:
   - Calls `logSalvationDecisionAction(name?: string)` server action
   - Server saves record to `salvation_decisions` table
   - Cross counter increments on screen
   - Warm confirmation appears: *"Welcome to the family, [name/friend]. Heaven is celebrating right now."* (Luke 15:7)
   - Two CTA buttons revealed below:
     - **"Find a Church Near Me"** → `/find-a-church`
     - **"Go to the Prayer Jar"** → `/`

### Component

**New file:** `src/components/salvation-client.tsx`
- `'use client'` component
- Props: `{ initialCount: number }`
- Owns: name input state, submitted state, local count (initialCount + 1 after submit)
- Renders: prayer block, name input, button, confirmation message, CTA buttons
- Passes updated count to `SalvationCross`

---

## Feature 4: Daily Verse

Same `getDailyVerse()` utility used on homepage and Lights Released. Displayed between the cross visual and the gospel content sections. Same border-t/border-b styling, italic text, amber reference.

---

## Feature 5: Find a Church Placeholder

**New file:** `src/app/(public)/find-a-church/page.tsx`
- Simple page with heading "Find a Church Near You"
- Message: "We're building this feature. Check back soon!"
- Button: "Back to Prayer Jar" → `/`
- No database interaction, no search functionality

---

## Database

**New table:** `salvation_decisions`

```typescript
export const salvationDecisions = pgTable('salvation_decisions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').references(() => users.id),        // nullable — guest decision
  name: text('name'),                                         // nullable — optional
  country: text('country'),                                   // nullable — from IP geo or null
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

Country detection: attempt to read `x-forwarded-for` or `cf-ipcountry` header in the server action. If unavailable, store null. No external geolocation API required at this stage.

---

## Server Action

**New file:** `src/app/actions/salvation.actions.ts`
- `'use server'`
- `logSalvationDecisionAction(name?: string)`: reads headers for country, inserts record, returns new total count
- Rate limit: one submission per session is enforced client-side (button disabled after click); no server-side rate limit needed at this stage

---

## Page Architecture

**New file:** `src/app/(public)/know-jesus/page.tsx`
- Server component
- Fetches `count` from `salvation_decisions` table (`select count(*)`)
- Calls `getDailyVerse()`
- Renders: heading, `SalvationClient` (which contains `SalvationCross`), daily verse, gospel sections, (prayer + decision are inside `SalvationClient`)

**Page metadata:** `{ title: 'Know Jesus | The Prayer Jar' }`

---

## Navigation Updates

**Modified:** `src/app/layout.tsx` — add "Know Jesus" link to desktop nav
**Modified:** `src/app/(public)/page.tsx` — add "Know Jesus →" ghost button below "View Lights Released →" on homepage

---

## Non-Functional Requirements

- **Performance:** Cross and orbs are CSS-only — no canvas, no JS animation libraries
- **SSR:** `SalvationClient` is a client component receiving `initialCount` as prop from server — no client-side data fetch on initial render
- **Accessibility:** Cross visual is `aria-hidden="true"`. Count is also conveyed in text. Reduced motion respected via existing media query.
- **Privacy:** Name is optional and stored as plaintext. No PII beyond name and optional country. No email collected on this page.
