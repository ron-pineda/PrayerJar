# UX Tightening Sprint — Design Spec

**Date:** 2026-04-16
**Status:** Approved — pending user review
**Scope:** Polish and UX improvement only. No new features. No church admin pages. No Flutter/native app.

---

## 1. Goals

- Simplify the Prayer Card so it works on any screen size without overwhelming users
- Make the homepage useful for returning users, not just first-timers
- Eliminate visual and copy inconsistencies that break the app's warm, contemplative tone
- Ensure every change is mobile-first (375px primary target)

---

## 2. Track A — Prayer Card Refactor

### 2.1 Problem

`src/components/prayer-card.tsx` manages 15+ state variables and renders edit forms, testimony forms, and 5+ action buttons inline. On mobile, the button row wraps awkwardly. The card is doing too much.

### 2.2 Community Prayer Card (praying for others)

Always visible:
- Prayer content, category badge, anonymous/name attribution, time ago
- Primary CTA: `🙏 Pray for This` → transitions to `✓ Prayed` (disabled, green) on completion
- Subtle share icon (`↗`) right-aligned, does not compete with primary CTA
- `...` overflow menu (top-right): **Adopt Prayer**, **Report**

Overflow menu behavior:
- **Adopt Prayer** — inline action, no dialog. Toast: "Added to your adopted prayers."
- **Report** — existing report flow, unchanged

### 2.3 Own Prayer Card (your requests)

Always visible:
- Prayer content, category badge, time ago
- No Pray button, no Adopt (can't pray for yourself)
- Status indicator where Pray button was: `Active · 12 days left` / `Answered ✨` / `Expired`
- `...` overflow menu (top-right): **Edit**, **Renew**, **Mark as Answered**, **Delete**

Overflow menu behavior:
- **Edit** → shadcn `<Dialog>`, `max-h-[90vh] overflow-y-auto`. Existing form fields (content, category, visibility toggles). Save / Cancel.
- **Mark as Answered** → `<Dialog>` with optional testimony textarea. Confirm / Cancel.
- **Delete** → `<Dialog>` confirmation: *"Are you sure? This can't be undone."* Delete / Cancel.
- **Renew** → inline action, no dialog. Toast: "Renewed — expires in 30 days."

### 2.4 Mobile at 320px

Card renders: content + one button (or status) + `...` icon. Nothing wraps. No horizontal overflow.

### 2.5 Pages affected

Prayer Card is used in: `my-prayers`, `prayed-for`, `adopted`, `browse`/guided-prayer, group prayer wall, church prayer wall, `/p/[id]` detail page. Architect must coordinate the refactor across all render sites — this is not a solo Frontend task.

---

## 3. Track B — Returning User Homepage + Profile

### 3.1 Homepage personalization

**Signed-out / first-time visitors:** Unchanged. Full hero, stats, "How It Works," secondary CTAs.

**Signed-in returning users:** Hero collapses to a compact greeting bar:

> *Good morning, [name] 🙏*
> *3 people prayed for your requests this week · 1 prayer needs renewal*

Two focused action cards below greeting:
- **"Someone needs prayer"** — one urgent/recent community prayer snippet. CTA: "Pray for Them" → drops into guided prayer.
- **"Your prayers"** — active request count + expiry warning if applicable. CTA: "View My Prayers"

Below action cards: Daily verse (kept), then secondary CTAs (Know Jesus, Answered Prayers, Find a Church).

**"How It Works" section:** Removed from homepage for signed-in users. Lives at `/help` only.

### 3.2 New backend queries required

Three new queries (Backend Engineer):
1. Count of interactions on the user's prayers in the last 7 days
2. Whether any of the user's active prayers expires within 7 days (boolean + count)
3. One random urgent/recent community prayer for the action card (reuse existing guided-prayer service if possible)

### 3.3 Profile page restructure

**Remove:** The 8 dashboard link cards ("Your Activity" section). Navigation belongs in the nav/menu, not the profile.

**Keep:** Avatar, name, join date, 3 stat cards (prayers submitted, times prayed, current streak), badge gallery.

Result: A profile page that's *about the user*, not a second nav.

---

## 4. Track C — Consistency Cleanup

### 4.1 UI component consistency

Replace native HTML elements with shadcn equivalents:
- `src/components/prayer-form.tsx` — `<select>` for category → `<Select>` + `<SelectTrigger>`
- `src/app/(public)/find-a-church/page.tsx` — sort + denomination dropdowns → `<Select>`
- `src/app/(dashboard)/settings/page.tsx` — raw `<input>` → `<Input>`

### 4.2 Footer overflow

`src/app/layout.tsx` footer nav: add `flex-wrap` to the link container. 8 links wrap into 2 rows on mobile, single row on desktop. No visual redesign.

### 4.3 Loading skeletons

Add `loading.tsx` to each dashboard route lacking one:
- `src/app/(dashboard)/my-prayers/`
- `src/app/(dashboard)/journal/`
- `src/app/(dashboard)/profile/`
- `src/app/(dashboard)/notifications/`

Each skeleton mirrors the page's visual structure using pulse animation. Reference pattern: `src/app/(public)/find-a-church/` loading state.

### 4.4 Docs visual language

`src/app/(public)/docs/` pages: remove gradient cards, colored borders, oversized emoji (text-7xl), numbered step cards that appear nowhere else in the app. Replace with standard card/border/muted pattern. Content unchanged.

### 4.5 Accessibility

Audit all `size="icon"` buttons and add descriptive `aria-label` attributes:
- `src/components/notification-bell.tsx` — bell button
- `src/components/theme-toggle.tsx` — theme toggle
- Prayer card `...` overflow menu trigger
- Share icon buttons in `src/components/share-buttons.tsx`
- Any other icon-only interactive elements found during audit

### 4.6 Copy fixes (from Copywriter audit)

All 10 fixes from `docs/design/copy-audit-2026-04-15.md`. Priority 5 listed here; remainder in the audit doc:

| Current | Replacement | File |
|---|---|---|
| "Lights" / "Lights Released" (nav) | "Answered Prayers" | mobile-nav.tsx, desktop nav |
| "Prayer Sent" | "I Prayed for This" | `/p/[id]` page |
| "Manage your prayer requests" | "Your prayer requests" | my-prayers page subtitle |
| "Power Intercessor" | "Faithful Intercessor" | my-prayers page |
| Missing aria-labels | Descriptive labels | notification-bell, theme-toggle, etc. |

---

## 5. Mobile-First Requirements (all tracks)

- Design and test at 375px first. Scale up, not down.
- Touch targets: 44px minimum maintained after Prayer Card refactor.
- Dialog forms: `max-h-[90vh] overflow-y-auto` — never cut off on small phones.
- Homepage greeting bar: single column on mobile, 2-column on ≥768px.
- QA must verify every change at: 320px, 375px, 428px, 768px, desktop.

---

## 6. Team

| Agent | Responsibility |
|---|---|
| Designer | Component specs for Prayer Card and Homepage before Frontend starts |
| Copywriter | 10 copy fixes from audit — done, ready to implement |
| Architect | Coordinates Prayer Card refactor across 7+ render sites |
| Backend Engineer | 3 new homepage queries (Track B) |
| Frontend Engineer | Implements all 3 tracks, mobile-first |
| QA | Multi-breakpoint testing per track |
| Reviewer | Sign-off per track (3 PRs) |
| Performance | Post-ship audit: bundle delta + Core Web Vitals |

---

## 7. Rollout — 3 PRs

**PR 1 — Track C: Consistency + Copy (lowest risk)**
Ships first. Establishes QA baseline. No new data, no component restructure.

**PR 2 — Track A: Prayer Card Refactor**
Architect coordinates. Frontend implements. QA verifies across all 7 card render sites.

**PR 3 — Track B: Homepage Personalization + Profile**
Backend queries land first. Frontend implements. QA verifies signed-in vs signed-out homepage.

---

## 8. Out of Scope

- Native app / Flutter (PrayerJar is PWA only)
- Church admin pages
- New features of any kind
- Performance audit (runs after sprint ships)
- User-facing appeals or moderation UI
