# PrayerJar V2 — Complete Build Plan
## 92 Features | 23 Sprints | 28 Agents | 6 Phases

### Context
PrayerJar is a live community prayer app at prayerjar.org. All 19 original features are shipped. This plan transforms it from a functional app into a viral, monetized platform with a church B2B product. The build is ordered to maximize user acquisition first (Phase 0), then retention (Phase 1), then community depth (Phase 2), then viral growth (Phase 3), then monetization (Phase 4), and finally the church platform (Phase 5).

### Architecture Decisions
- **Real-time**: SSE (Server-Sent Events) via Vercel Functions streaming, not WebSockets. Neon HTTP driver is stateless — SSE polls DB every 3s or uses Vercel KV pub/sub for fan-out.
- **Shareable cards**: Extend existing `@vercel/og` ImageResponse pattern (already at `src/app/api/og/`)
- **PWA**: Manual service worker (`public/sw.js`) + `public/manifest.json`. No `next-pwa` (unmaintained).
- **Prayer partner matching**: DB-driven scoring algorithm (category overlap 40%, streak similarity 20%, timezone 20%, never-matched bonus 20%). Daily cron.
- **Church multi-tenancy**: New `churches` table with `churchId` FK on prayers/groups. Service-layer tenant isolation (not Postgres RLS). Route: `/church/[slug]`.
- **Payments**: Stripe Checkout Sessions + Webhooks at `src/app/api/webhooks/stripe/route.ts`.

### Dependency Graph
```
Phase 0 (0.1 → 0.2 → 0.3)
Phase 1 (1.1 → 1.2 → 1.3)  — depends on 0.1
Phase 2 (2.1 → 2.2 → 2.3 → 2.4) — depends on 1.2
Phase 3 (3.1 ∥ 3.2 ∥ 3.3) — 3.1 needs 2.2 SSE infra
Phase 4 (4.1 → 4.2) — depends on 3.3
Phase 5 (5.1 → 5.2 → 5.3 → 5.4 → 5.5) — depends on 4.2
Phase 6 (6.1 ∥ 6.2 ∥ 6.3) — all independent
```

---

## Phase 0: Launch Ready — Make It Worth Sharing

### Sprint 0.1 — Mobile & Foundation [M, ~1 week]
**Agents**: Frontend (primary), Designer, Copywriter, Legal | QA, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 1 | Button touch targets 44px min | `src/components/ui/button.tsx` | — |
| 2 | Know Jesus mobile access | `src/app/(public)/know-jesus/page.tsx`, mobile-nav or homepage link | — |
| 3 | Share page polish /p/[id] | `src/app/(public)/p/[id]/page.tsx` | — |
| 4 | Social proof counters | `src/app/(public)/page.tsx`, **NEW** `src/components/animated-counter.tsx` | — |
| 5 | About page / origin story | `src/app/(public)/about/page.tsx` | — |
| 6 | Trust center | **NEW** `src/app/(public)/trust/page.tsx` | — |
| 7 | Empty state design | **NEW** `src/components/empty-state.tsx`, all dashboard pages | — |

### Sprint 0.2 — Viral Mechanics [L, ~1.5 weeks]
**Agents**: Frontend, Backend, AI Engineer (primary), Designer, Copywriter, Growth | QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 8 | Shareable prayer cards (4 types) | **NEW** `src/app/api/og/card/[type]/route.tsx`, update `src/components/share-buttons.tsx` | — |
| 9 | Prayer submission prompts | **NEW** `src/components/submission-prompt.tsx` | — |
| 10 | SEO landing pages per category | `src/app/(public)/pray/[category]/page.tsx` — add metadata, structured data | — |
| 11 | "Answered" celebration moment | **NEW** `src/components/celebration-animation.tsx`, `src/components/prayer-card.tsx` | — |

### Sprint 0.3 — Visual Polish [M, ~1 week]
**Agents**: Frontend, Designer (primary) | Performance, QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 12 | Dark mode refinement | `src/app/globals.css` — OKLCH tuning | — |
| 13 | Microanimations on prayer | `src/components/guided-prayer.tsx`, `src/components/prayer-card.tsx` | — |
| 14 | Scroll-triggered animations | **NEW** `src/hooks/use-scroll-reveal.ts`, praise wall, homepage | — |
| 15 | Long prayer reading UX | **NEW** `src/components/expandable-text.tsx` | — |
| 16 | Skeleton screens | **NEW** `src/components/ui/skeleton.tsx`, all loading.tsx files | — |
| 17 | Rate limiting UX | **NEW** `src/components/rate-limit-countdown.tsx`, `src/lib/rate-limit.ts` | — |

---

## Phase 1: Retention Engine — Come Back Tomorrow

### Sprint 1.1 — PWA & Notifications [XL, ~2 weeks]
**Agents**: Frontend, Backend, DevOps (primary) | Mobile, Security, QA, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 18 | PWA service worker + manifest | **NEW** `public/manifest.json`, `public/sw.js`, `public/icons/` | — |
| 19 | Push notifications (Web Push) | **NEW** `src/lib/push.ts`, `src/services/push.service.ts`, `src/app/api/v1/push/subscribe/route.ts` | `pushSubscriptions` |
| 20 | Welcome email sequence | **NEW** `src/emails/welcome-{1,2,3}.tsx`, `src/app/api/cron/welcome-drip/route.ts` | `welcomeDripStatus` |
| 21 | Notification preferences granularity | `src/app/(dashboard)/settings/page.tsx` | Add columns to `users` |
| 22 | Quiet hours | `src/app/(dashboard)/settings/page.tsx` | Add `quietHoursStart/End/Timezone` to `users` |

**New env vars**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
**New packages**: `web-push`

### Sprint 1.2 — Onboarding & Daily Habit [L, ~1.5 weeks]
**Agents**: Frontend, Backend, Designer (primary) | Copywriter, QA, Growth (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 23 | Onboarding flow (multi-step) | Rewrite `src/components/onboarding-overlay.tsx`, **NEW** step components | Add `onboardingCompleted`, `preferredCategories` to `users` |
| 24 | Daily prayer brief | **NEW** `src/app/api/cron/daily-brief/route.ts`, `src/emails/daily-brief.tsx` | — |
| 25 | Prayer follow-ups (3-day nudge) | **NEW** `src/app/api/cron/prayer-followups/route.ts`, `src/emails/prayer-followup.tsx` | `followUpsSent` |
| 26 | Progressive disclosure | **NEW** `src/lib/progressive-disclosure.ts` | Add `activityLevel` to `users` |

### Sprint 1.3 — Emotional Care [M, ~1 week]
**Agents**: AI Engineer, Frontend, Backend (primary) | Copywriter, Customer Success, QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 27 | Anonymous check-ins (7-day) | **NEW** `src/components/check-in-pulse.tsx`, **NEW** `src/services/care.service.ts` | `checkIns` |
| 28 | Care for the intercessor | **NEW** `src/app/api/cron/intercessor-care/route.ts`, `src/emails/intercessor-thanks.tsx` | — |
| 29 | Grief anniversaries | **NEW** `src/app/api/cron/grief-anniversaries/route.ts`, `src/emails/grief-anniversary.tsx` | `griefDates` |
| 30 | Scripture with encouragement | `src/services/ai.service.ts` — add `generateEncouragement()`, `src/components/guided-prayer.tsx` | — |

---

## Phase 2: Community & Connection — Relationships, Not Transactions

### Sprint 2.1 — Prayer Partners [XL, ~2 weeks]
**Agents**: Backend, Frontend, Database (primary) | AI Engineer, Designer, QA, Security, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 31 | Prayer partner matching | **NEW** `src/services/partner.service.ts`, `src/app/api/cron/partner-matching/route.ts` | `prayerPartnerships` |
| 32 | Partner encouragement exchange | **NEW** `src/app/(dashboard)/partner/page.tsx`, `src/components/partner/message-thread.tsx` | `partnerMessages` |
| 33 | Extend / re-match flow | `src/app/(dashboard)/partner/page.tsx`, `src/app/api/v1/partners/route.ts` | — |

**Matching algorithm**: Score by category overlap (40%), streak similarity (20%), timezone proximity (20%), never-matched bonus (20%). Greedy matching via daily cron.

### Sprint 2.2 — Deeper Intercession [L, ~1.5 weeks]
**Agents**: Backend, Frontend (primary) | Designer, QA, Performance (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 34 | Adopt a prayer | **NEW** `src/services/adoption.service.ts`, `src/components/adopt-prayer-button.tsx` | `prayerAdoptions` |
| 35 | Prayer chains (24hr coverage) | **NEW** `src/services/chain.service.ts`, `src/components/prayer-chain.tsx` | `prayerChains`, `chainParticipants` |
| 36 | "Praying Now" live counter | **NEW** `src/app/api/v1/sse/praying-now/route.ts`, `src/components/praying-now-counter.tsx` | — |

**SSE pattern** (reused in Sprint 3.1 and 5.4):
```typescript
// src/app/api/v1/sse/praying-now/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const interval = setInterval(async () => {
        const count = await getActivePrayerCount(); // interactions in last 5min
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
      }, 3000);
    }
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

### Sprint 2.3 — Groups [XL, ~2 weeks]
**Agents**: Backend, Frontend, Database (primary) | Designer, Security, QA, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 37 | Self-created groups | **NEW** `src/services/group.service.ts`, `src/app/(dashboard)/groups/` pages | `groups` |
| 38 | Private group prayer wall | **NEW** `src/components/group/group-wall.tsx` | `groupMembers` |
| 39 | Group activity feed | **NEW** `src/components/group/group-activity.tsx` | Add `groupId` to `prayers` |

### Sprint 2.4 — Testimony & Discovery [L, ~1.5 weeks]
**Agents**: Frontend, Backend (primary) | Designer, Copywriter, QA, Growth (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 40 | Long-form testimony stories | **NEW** `src/app/(public)/testimony/[id]/page.tsx`, `src/components/testimony/` | — |
| 41 | Praise wall redesign (glowing lights) | Rewrite `src/app/(public)/praise-wall/page.tsx`, `src/components/lights-released-client.tsx` | — |
| 42 | Curated prayer collections | **NEW** `src/app/(public)/collections/`, `src/services/collection.service.ts` | `collections`, `collectionPrayers` |
| 43 | Category browsing redesign | `src/components/category-picker.tsx` — visual icons | — |
| 44 | Search & discovery | `src/app/(public)/browse/page.tsx`, `src/services/prayer.service.ts` — trigram search | Add GIN index on `prayers.content` |
| 45 | Notification system overhaul | `src/app/(dashboard)/notifications/page.tsx`, `src/services/notification.service.ts` | — |

---

## Phase 3: Viral Growth — Every User Brings More

### Sprint 3.1 — Prayer Map [L, ~1.5 weeks]
**Agents**: Frontend, Backend (primary) | Designer, Performance, QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 46 | Live prayer map | **NEW** `src/app/(public)/map/page.tsx`, `src/components/map/prayer-map.tsx` | Add `latitude`, `longitude`, `country` to `prayers` and `prayerInteractions` |
| 47 | Real-time dot animations | **NEW** `src/app/api/v1/sse/prayer-map/route.ts` | — |

Location is opt-in via browser geolocation API. Fuzzy to region level for privacy.

### Sprint 3.2 — Shareable Moments [M, ~1 week]
**Agents**: Frontend, Backend, Designer (primary) | Growth, Brand, Copywriter, Content (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 48 | Year in Prayer Wrapped | **NEW** `src/app/(public)/wrapped/[year]/page.tsx`, `src/services/wrapped.service.ts`, `src/app/api/og/wrapped/[userId]/route.tsx` | — |
| 49 | Seasonal campaigns | **NEW** `src/app/(public)/campaigns/[slug]/page.tsx` | `campaigns` |
| 50 | Prayer for the World | **NEW** `src/app/(public)/world-prayer/page.tsx` | — |

### Sprint 3.3 — Feedback & Compliance [L, ~1.5 weeks]
**Agents**: Analytics, DevOps, Frontend, Backend (primary) | Legal, Security, QA, Performance (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 51 | In-app feedback widget | **NEW** `src/components/feedback-widget.tsx`, `src/app/api/v1/feedback/route.ts` | `feedback` |
| 52 | Analytics (Vercel Analytics) | `src/app/layout.tsx`, **NEW** `src/lib/analytics.ts` | — |
| 53 | Beta group / feature flags | **NEW** `src/lib/feature-flags.ts` | `featureFlags` |
| 54 | Data export (GDPR) | **NEW** `src/app/(dashboard)/settings/export/page.tsx`, `src/services/export.service.ts` | — |
| 55 | Accessibility audit (WCAG 2.1 AA) | All components — contrast, ARIA, keyboard nav, screen readers | — |

**New packages**: `@vercel/analytics`

---

## Phase 4: Monetization — Self-Sustaining

### Sprint 4.1 — Donations [L, ~1.5 weeks]
**Agents**: Backend, Frontend, Integrations (primary) | Designer, Finance, Legal, Security, QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 56 | /give page | **NEW** `src/app/(public)/give/page.tsx` | — |
| 57 | Stripe integration | **NEW** `src/services/billing.service.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/v1/checkout/route.ts` | `donations`, `stripeCustomers` |
| 58 | Contextual donation prompts | **NEW** `src/components/donation-prompt.tsx` | — |
| 59 | Donor badge | `src/services/badge.service.ts` | Extend `badgeTypeEnum` |

**New env vars**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
**New packages**: `stripe`

### Sprint 4.2 — Subscription Infrastructure [XL, ~2 weeks]
**Agents**: Backend, Frontend, Database (primary) | Finance, Legal, Integrations, QA, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 60 | Billing system | Extend `src/services/billing.service.ts` | `subscriptions` |
| 61 | Church tier plans | **NEW** `src/lib/plans.ts` | `plans` |
| 62 | Event license purchases | `src/app/api/v1/checkout/route.ts` | `eventLicenses` |
| 63 | Billing dashboard | **NEW** `src/app/(dashboard)/billing/page.tsx` | — |

---

## Phase 5: Church & Event Platform — The B2B Product

### Sprint 5.1 — Church Foundation [XL, ~2.5 weeks]
**Agents**: Backend, Database, Frontend, Architect (primary) | Designer, Security, QA, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 64 | Multi-tenancy schema | `src/db/schema.ts` | `churches`, `churchMembers`, add `churchId` FK to prayers/groups |
| 65 | Church creation flow | **NEW** `src/app/(church)/church/create/page.tsx`, `src/services/church-platform.service.ts` | — |
| 66 | Private church prayer jar | **NEW** `src/app/(church)/church/[slug]/wall/page.tsx` | — |
| 67 | Custom welcome message | **NEW** `src/app/(church)/church/[slug]/settings/page.tsx` | `welcomeMessage` column on `churches` |
| 68 | Small group management | **NEW** `src/app/(church)/church/[slug]/groups/page.tsx` | — |

**New route group**: `src/app/(church)/` with church-specific layout and nav.

### Sprint 5.2 — Pastoral Tools [XL, ~2 weeks]
**Agents**: Backend, Frontend (primary) | AI Engineer, Designer, QA, Customer Success (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 69 | Pastoral dashboard | **NEW** `src/app/(church)/church/[slug]/dashboard/page.tsx`, `src/services/pastoral.service.ts` | — |
| 70 | Flagged prayers (AI) | **NEW** `src/app/(church)/church/[slug]/dashboard/flagged/page.tsx` | `prayerFlags` |
| 71 | Pastoral care inbox | **NEW** `src/app/(church)/church/[slug]/dashboard/care/page.tsx` | `pastoralNotes` |
| 72 | Prayer team management | **NEW** `src/app/(church)/church/[slug]/dashboard/team/page.tsx` | `prayerAssignments` |
| 73 | Weekly prayer digest | **NEW** `src/app/api/cron/church-digest/route.ts`, `src/emails/church-digest.tsx` | — |

### Sprint 5.3 — Branding & Analytics [L, ~1.5 weeks]
**Agents**: Frontend, Backend, Analytics (primary) | Designer, Brand, QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 74 | Custom branding (logo, colors, subdomain) | **NEW** `src/app/(church)/church/[slug]/dashboard/branding/page.tsx` | Logo/color columns on `churches` |
| 75 | Church analytics & reports (PDF) | **NEW** `src/services/church-analytics.service.ts`, analytics dashboard page | — |
| 76 | Testimony pipeline (approval) | **NEW** testimony approval queue page | `testimonyApprovals` |
| 77 | Church website embed widget | **NEW** `src/app/api/v1/embed/[churchSlug]/route.ts` | — |

**New packages**: `recharts`

### Sprint 5.4 — Live Events [XL, ~2 weeks]
**Agents**: Backend, Frontend, SRE (primary) | Designer, Performance, DevOps, QA, Reviewer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 78 | Live event prayer wall | **NEW** `src/app/(church)/church/[slug]/events/[eventId]/wall/page.tsx`, `src/services/event.service.ts` | `events`, `eventPrayers` |
| 79 | Real-time moderation console | **NEW** moderation page, SSE endpoint `src/app/api/v1/sse/event/[eventId]/route.ts` | — |
| 80 | Display modes (stream/spotlight/category) | **NEW** `src/app/(church)/church/[slug]/events/[eventId]/display/page.tsx` | — |
| 81 | Post-event report (PDF) | **NEW** report page | — |
| 82 | Attendee retention follow-up | **NEW** `src/components/event/post-event-cta.tsx` | — |

### Sprint 5.5 — Church Onboarding [S, ~0.5 weeks]
**Agents**: Copywriter, Frontend (primary) | Designer, Customer Success, DocWriter (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 83 | Church setup guide | **NEW** `src/app/(church)/church/[slug]/setup/page.tsx` | — |
| 84 | Event setup guide | **NEW** event guide page | — |
| 85 | Pastor insights content | **NEW** `src/components/church/pastor-tips.tsx` | — |

---

## Phase 6: Future Horizon

### Sprint 6.1 — Audio & Media [L, ~1.5 weeks]
**Agents**: Frontend, Backend, AI Engineer (primary) | Mobile, Performance, QA (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 86 | Audio prayers (60s recording) | **NEW** `src/components/audio-recorder.tsx`, upload route | Add `audioUrl`, `transcription` to `prayers` |
| 87 | Video testimonies | **NEW** `src/components/video-recorder.tsx`, upload route | Add `videoDurationSeconds` to `prayers` |

### Sprint 6.2 — Native App Wrapper [L, ~1.5 weeks]
**Agents**: Mobile, DevOps (primary) | Frontend, QA, Designer (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 88 | Capacitor wrapper (iOS + Android) | **NEW** `capacitor.config.ts`, `android/`, `ios/`, `.github/workflows/mobile-build.yml` | — |

**New packages**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/push-notifications`, `@capacitor/share`

### Sprint 6.3 — Partnerships [M, ~1 week]
**Agents**: Sales, Research, Brand (primary) | Strategist, Content, Copywriter, Growth (support)

| # | Feature | Files | DB |
|---|---------|-------|-----|
| 89 | Partnership pages | **NEW** `src/app/(public)/partners/page.tsx` | — |
| 90 | Integration API (v2) | **NEW** `src/app/api/v2/`, `src/services/api-key.service.ts` | `apiKeys` |
| 91 | Press kit | **NEW** `src/app/(public)/press/page.tsx`, `public/press/` | — |
| 92 | Mental health partnerships | Deepen `src/components/crisis-resources.tsx` | — |

---

## Summary

| Phase | Sprints | Features | Duration | Key Agents |
|-------|---------|----------|----------|------------|
| 0 — Launch Ready | 3 | 17 | ~3.5 weeks | Frontend, Designer, Copywriter |
| 1 — Retention | 3 | 13 | ~4.5 weeks | Frontend, Backend, DevOps |
| 2 — Community | 4 | 15 | ~7 weeks | Backend, Frontend, Database |
| 3 — Viral Growth | 3 | 10 | ~4 weeks | Frontend, Backend, Analytics |
| 4 — Monetization | 2 | 8 | ~3.5 weeks | Backend, Integrations, Finance |
| 5 — Church Platform | 5 | 22 | ~8.5 weeks | Backend, Frontend, Database, Architect |
| 6 — Future | 3 | 7 | ~4 weeks | Mobile, Sales, AI Engineer |
| **Total** | **23** | **92** | **~35 weeks** | |

**New DB tables**: 25 (from 13 to 38)
**New env vars**: 6 (VAPID x3, Stripe x3)
**New npm packages**: `web-push`, `stripe`, `@vercel/analytics`, `recharts`, `@capacitor/*`
**New cron jobs**: 8+ (welcome drip, daily brief, follow-ups, intercessor care, grief anniversaries, partner matching, adoption reminders, church digest)

## Verification
After each sprint:
1. `npx next build` — must pass with no errors
2. Run existing tests: `npx vitest run`
3. Manual test on mobile (prayerjar.org) — check new features + regression on existing
4. Check Vercel deployment logs for runtime errors
5. For payment sprints: test with Stripe test mode keys
6. For church sprints: create a test church, verify tenant isolation

## Starting Sprint 0.1
Begin with the Architect creating detailed task breakdowns in `.agent-state/tasks.json`, then hand off to Frontend Engineer for implementation.
