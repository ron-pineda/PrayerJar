# Prayer Jar Phase 1 Improvements — Design Specification

**Date:** 2026-04-09
**Status:** Approved
**Phase:** 1 of 3

## Overview

Phase 1 improvements to the live Prayer Jar app, focused on emotional impact, organic growth, and visual polish. Three features: photo attachments, social sharing with dynamic OG images, and UX/animation polish with mobile navigation and onboarding.

## Phasing Context

| Phase | Focus | Features |
|-------|-------|----------|
| **1 (this spec)** | Impact & growth | Photo attachments, social sharing, UX polish |
| 2 (future) | Revenue & retention | Donation support (Stripe), push notifications |
| 3 (future) | Scale & business model | Church group rooms, org subscriptions |

## Feature 1: Photo Attachments

### Overview

Users can optionally attach a photo when submitting a prayer request or when marking a prayer as answered (testimony). Photos are stored in Vercel Blob and moderated by AI before publishing.

### Upload Flow

**Prayer submission form:** A neutral drop zone below the prayer text field. Label: "Add a photo (optional)". Accepts JPG, PNG, WebP up to 5MB.

**Testimony form (Mark as Answered):** A warm-toned drop zone with an encouraging nudge: "Add a celebration photo — a photo makes your testimony more powerful." This is encouraged but never required.

### Technical Architecture

**Client-side (before upload):**
- Compress image to max 1MB using browser canvas API
- Convert to WebP format for storage savings
- Show upload progress indicator
- Display thumbnail preview before form submission

**Server-side:**
- Upload to Vercel Blob (public storage)
- AI moderation via Claude Haiku — same pipeline as text moderation
- If image is flagged: held in existing admin review queue, prayer still submitted without image
- Store blob URL in prayers table

**Database change:**
- Add `imageUrl` column (text, nullable) to `prayers` table

**Display:**
- Prayer cards show photo thumbnail if present (click to expand)
- Praise Wall testimony cards show photo prominently
- Guided prayer moment shows photo if available
- Share link pages (`/p/[id]`) display photo

**Limits & Safety:**
- Max file size: 5MB original, compressed to ~1MB before upload
- Accepted formats: JPG, PNG, WebP
- AI screens for inappropriate/explicit images via Claude Haiku vision
- Flagged images go to existing admin review queue
- Rate limit: same as prayer submissions (5 per hour per session)

**Storage budget:**
- Vercel Blob free tier: 500MB
- At ~1MB per photo, supports ~500 photos before needing paid tier
- Paid tier: $0.15/GB/month — very affordable at scale

### Component Changes

| Component | Change |
|-----------|--------|
| `prayer-form.tsx` | Add photo drop zone with preview |
| `prayer-card.tsx` | Show photo thumbnail if `imageUrl` present |
| `praise-card.tsx` | Show photo prominently on testimony cards |
| `guided-prayer.tsx` | Display photo in prayer moment if available |
| New: `photo-upload.tsx` | Reusable upload component with compression, preview, progress |

## Feature 2: Social Sharing

### Overview

Rich link previews (Open Graph) and share buttons to drive organic growth. When a prayer or testimony link is shared on social platforms, a beautiful preview card is rendered automatically.

### Dynamic OG Images

Two route handlers generate OG images on the fly using `@vercel/og` (ImageResponse API):

**`/api/og/prayer/[id]`** — Prayer request card:
- Dark gradient background (charcoal to warm)
- "Prayer Request" label with candle icon
- Prayer text (truncated to ~120 chars)
- Prayer count ("7 people have prayed for this")
- Site branding: "prayerjar.app · Pray with me"
- If prayer has a photo: include it in the OG image

**`/api/og/testimony/[id]`** — Answered prayer card:
- Dark gradient background (green-tinted)
- "Answered Prayer" label with sparkle icon
- Testimony text (truncated)
- Stats: prayer count + days from submission to answered
- Site branding: "prayerjar.app · Praise Wall"
- If testimony has a photo: include it prominently

**Caching:** OG images cached at the edge. Cache invalidated when prayer is updated (answered, renewed).

### Share Buttons

A `share-buttons.tsx` component with four options:
- **Twitter/X** — opens tweet composer with prayer text + link
- **Facebook** — opens Facebook share dialog
- **WhatsApp** — opens WhatsApp with prefilled message
- **Copy Link** — copies URL to clipboard with toast confirmation

**Placement:** Appears on:
- Individual prayer pages (`/p/[id]`)
- Praise Wall testimony cards
- After "I Prayed for This" confirmation (encourage sharing the prayer they just prayed for)

### Open Graph Meta Tags

Update `metadata` in page layouts:
- `/p/[id]` — dynamic OG image from `/api/og/prayer/[id]` or `/api/og/testimony/[id]`
- `/praise-wall` — static OG image for the Praise Wall
- Homepage — static OG image for the app

### Privacy Rules

- Anonymous prayers: OG images and share text include prayer text only, never author name
- OG images respect the `isAnonymous` flag
- Share buttons are still shown on anonymous prayers (sharing the prayer is fine, leaking identity is not)

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/og/prayer/[id]/route.tsx` | Dynamic OG image for prayer requests |
| `src/app/api/og/testimony/[id]/route.tsx` | Dynamic OG image for testimonies |
| `src/components/share-buttons.tsx` | Reusable share button bar |

## Feature 3: UX & Visual Polish

### Animations & Microinteractions

All animations are CSS-only (keyframes + transitions). No animation libraries.

| Element | Animation | Trigger |
|---------|-----------|---------|
| "I Prayed for This" button | Golden ripple radiates outward | On click |
| Prayer count number | Gentle bounce upward | When count increments |
| Guided prayer candle icon | Soft flickering glow (text-shadow) | Continuous during prayer moment |
| Praise Wall cards | Staggered fade-in + slide-up | On scroll into viewport (IntersectionObserver) |
| Prayer form submission | Card slides up and fades out | On successful submit |
| Badge earned | Scale-up with golden shimmer | When badge notification appears |

**Implementation approach:** CSS `@keyframes` defined in `globals.css`. Triggered via className toggles in components. Scroll-triggered animations use IntersectionObserver in a small `useScrollReveal` hook.

### Mobile Bottom Navigation

A fixed bottom navigation bar visible only on screens below 768px. Desktop retains the existing top header navigation.

**Tabs:**
| Tab | Icon | Route |
|-----|------|-------|
| Home | House | `/` |
| Pray | Folded hands | `/pray` |
| Add | Candle (elevated golden circle) | Opens prayer form dialog |
| Praise | Star | `/praise-wall` |
| Profile | Person | `/my-prayers` (or `/sign-in` if not logged in) |

**Design details:**
- Fixed to bottom of viewport, above safe area on iOS
- "Add" button is elevated — a golden circle that floats above the nav bar
- Active tab highlighted with amber accent color
- Notification dot on Profile tab when unread notifications exist
- Hidden on desktop via CSS media query

**New component:** `mobile-nav.tsx` — added to the root layout, rendered conditionally.

### First-Time Onboarding

A dismissable overlay shown once to new visitors on their first visit.

**Content — 3 steps (single screen, not a carousel):**
1. Share a prayer need (pen icon)
2. Pray for someone (hands icon)
3. Celebrate answered prayers (star icon)

**Design:**
- Centered card overlay with semi-transparent backdrop
- Prayer Jar candle branding at top
- "Welcome to Prayer Jar" heading with brief description
- Three icon circles showing the core actions
- "Start Praying" primary CTA button
- "Skip" text link to dismiss
- Dot indicators for visual rhythm (not functional pagination)

**State:** `localStorage` key `prayerjar_onboarded`. Checked once on homepage mount. If not set, show overlay. Set to `true` on any dismiss action (button click or "Skip").

**New component:** `onboarding-overlay.tsx` — rendered in the homepage.

## Data Model Changes

### Prayers Table

Add one column:

| Column | Type | Notes |
|--------|------|-------|
| imageUrl | text (nullable) | Vercel Blob URL for attached photo |

### Migration

```sql
ALTER TABLE prayers ADD COLUMN image_url text;
```

No other table changes needed for Phase 1.

## New Dependencies

| Package | Purpose |
|---------|---------|
| `@vercel/blob` | Photo storage |
| `@vercel/og` | Dynamic OG image generation |

Both are Vercel-native with zero additional config on deployment.

## New Environment Variables

| Variable | Purpose | Where to get |
|----------|---------|--------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage access | Vercel Dashboard → Storage → Blob → Create Store, then `vercel env pull` |

`@vercel/og` has no configuration. The blob token is auto-provisioned when you create a Blob store via the Vercel dashboard and pull env vars.

## File Map (New & Modified)

```
src/
  app/
    api/
      og/
        prayer/[id]/route.tsx          # NEW: Dynamic OG image for prayers
        testimony/[id]/route.tsx       # NEW: Dynamic OG image for testimonies
    (public)/
      page.tsx                         # MODIFY: Add onboarding overlay
  components/
    photo-upload.tsx                   # NEW: Upload with compress, preview, progress
    share-buttons.tsx                  # NEW: Social share button bar
    mobile-nav.tsx                     # NEW: Bottom navigation (mobile only)
    onboarding-overlay.tsx             # NEW: First-time visitor welcome
    prayer-form.tsx                    # MODIFY: Add photo upload
    prayer-card.tsx                    # MODIFY: Show photo thumbnail
    praise-card.tsx                    # MODIFY: Show testimony photo
    guided-prayer.tsx                  # MODIFY: Show photo, add candle animation
    notification-bell.tsx              # MODIFY: (minor) badge animation
  hooks/
    use-scroll-reveal.ts              # NEW: IntersectionObserver hook for scroll animations
  app/
    globals.css                        # MODIFY: Add @keyframes for all animations
    layout.tsx                         # MODIFY: Add mobile-nav, update OG meta
  db/
    schema.ts                          # MODIFY: Add imageUrl to prayers
    migrations/                        # NEW: Migration for imageUrl column
  services/
    prayer.service.ts                  # MODIFY: Handle imageUrl on create/update
    moderation.service.ts              # MODIFY: Add image moderation
  lib/
    image-utils.ts                     # NEW: Client-side compression + WebP conversion
```

## Non-Functional Requirements

- **Performance:** Photos lazy-loaded. OG images edge-cached. Animations use `transform` and `opacity` only (GPU-composited, no layout thrash).
- **Accessibility:** Animations respect `prefers-reduced-motion`. Share buttons have aria-labels. Mobile nav is keyboard navigable. Onboarding overlay traps focus.
- **Privacy:** Anonymous prayers never expose author identity in OG images, share text, or photo metadata (EXIF stripped on upload).
- **Mobile:** Bottom nav uses safe-area-inset-bottom for iOS notch. Touch targets minimum 44px.
