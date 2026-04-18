<!-- Appended on every merged PR. -->

## 2026-04-17 pj-s17-for-churches-build Implement updated /for-churches page + pricing calculator component
Shipped rewritten /for-churches page as server component with metadata export. PricingCalculator (client component) reads all tier data from plans.ts via FREE_CAP/STARTER_CAP constants + ENTERPRISE_THRESHOLD=500; downward-check logic correctly returns 'enterprise' for >500 members. 8-boundary test suite in pricing-calculator.test.ts, 8/8 pass. Enterprise CTA routes to /for-churches/demo in all three files. FaqAccordion ('use client') uses aria-expanded={isOpen} on each button. Zero tsc errors on touched files.

## 2026-04-18 pj-s17-enterprise-demo-flow Enterprise demo booking flow — replace 'contact sales' with a real funnel
Sales delivered docs/sales/enterprise-demo-flow.md: 6-signal qualification decision tree (500+ members, multi-site, denomination, SSO need, DPA need, seminary); 10-field lead-capture form with types and required/optional markers; 4-touch automated email sequence (T+0 confirmation to lead, T+1h internal notification to ADMIN_EMAILS, T+24h nudge with Calendly link, T+72h size-personalized feature spotlight) with subject lines and full body copy; rep-facing brief template with qualification rubric and disqualification triggers; warm redirect to Growing Church for disqualified leads; Calendly inline embed recommendation with CALENDLY_URL env var. Price anchor confirmed at 'Starting at $199/mo'.

## 2026-04-17 pj-s17-plans-gating-fix Update src/lib/plans.ts to match approved tier map
Updated plans.ts with Sprint 17 tier map: display names Free/Small Church/Growing Church/Network; Free caps raised to 50 members/3 groups; PASTORAL_DASHBOARD_TIER moved pro→starter; three new gating predicates (hasPastoralCareInbox, hasPrayerTeamAssignments, hasTestimonyApprovalQueue); 15% annual discount math; three dashboard routes (care/team/testimony) now plan-gated via plans.ts predicates. 44/44 tests pass.

## 2026-04-17 pj-s17-for-churches-rewrite Rewrite /for-churches marketing copy — accurate tiers + hidden features surfaced
Delivered docs/marketing/for-churches-copy-v2.md: hero headline, verse strip, 8 feature blocks with tier attribution, 4 tier cards (Free/Small Church/Growing Church/Network) with fit-statements and no "Most Popular" badge, 8-item FAQ, social proof placeholder slots, enterprise/network contact section with qualification fields. No AI-Flagged Care, SSO/SAML/SLA claims; annual discount 15% throughout.

## 2026-04-17 pj-s17-dpa-subprocessor Data Processing Addendum + sub-processor list (public page)
Shipped /legal/dpa with AI-drafted DPA text (14 sections), AI-drafted disclaimer, and click-through accept button (acceptDpa() server action inserts into churchLegalAcceptances with ip_address); /legal/subprocessors with 9 processor entries, purpose/dataCategories/region/DPA-link per entry, and versioned SUBPROCESSOR_LIST_LAST_UPDATED constant; 501(c)(3) nonprofit upload flow at /church/[slug]/settings/nonprofit (Vercel Blob PDF, nonprofitVerifications table) and admin review queue at /admin/legal-verifications; sub-processors linked from footer. 19/19 tests pass.

## 2026-04-17

### pj-s17-competitor-pricing — Competitor pricing & feature benchmark
Research doc at docs/strategy/competitor-pricing-2026-04-17.md. 8 competitors surveyed: Prayer Platform ($10), PrayerMate ($12-40), Echo Prayer ($15/yr), Uplift Prayer (free), Subsplash ($149-1,200+), Pushpay ($199-999+), Tithe.ly ($72-119), Planning Center Groups ($0-179). Summary matrix + detailed breakdowns with source URLs. PrayerJar verdict: price-competitive, Starter $19 mispriced between $10-$15 anchors, free tier (25/1) tightest in segment. Three recommendations: loosen free to 50/3, add annual pricing at 17% discount, advertise Planning Center integration.

### pj-s17-onboarding-audit — Church day-1 onboarding audit + guided setup proposal
Audit and design spec for church onboarding: 15-friction-point log with file refs, 8-step guided checklist with server-tracked success criteria, first-run sample content strategy with dismissal mechanism, top-3 quick wins (all implemented in commit 69ff73b), and low-fi wireframes for 3 screens (post-creation welcome, persistent setup progress bar, plan gate redesign). Ready for Sprint 18 build.

### pj-s17-mrr-dashboard — MRR / churn / acquisition-attribution dashboard (internal)
MRR attribution layer, spec doc, and UTM capture wired at church creation. docs/finance/mrr-dashboard-spec.md defines all 10 metrics with explicit formulas, refresh cadence (live query), permissions (requireAdmin / ADMIN_EMAILS), and access path (/admin/finance). createChurch() in church-platform.service.ts accepts utm_source/medium/campaign and derives acquisition_source = utmSource ?? 'direct'. POST /api/v1/church reads UTMs from request body first, URL query params as fallback. 68/68 tests pass (20 MRR, 48 route).

### pj-s17-chms-integration-survey — ChMS integration landscape survey
Research doc at docs/integrations/chms-landscape.md covering Planning Center, Elvanto, ChurchTrac, and Breeze with auth model, endpoints, rate limits, webhook support, sandbox availability, and MVI scope per platform. Ranked recommendation: Planning Center #1 (Sprint 18 — OAuth 2.0, person webhooks, free sandbox, 73k churches), Breeze #2 (Sprint 19), ChurchTrac skip (no API), Elvanto deprioritize.

### pj-s17-funnel-instrumentation — Church acquisition funnel event spec
Spec at docs/analytics/church-funnel-spec.md. Confirmed @vercel/analytics as sole analytics tool (no PostHog). Defined all 8 funnel events (for_churches_view, pricing_view, calculator_interacted, signup_start, signup_complete, plan_activated, plan_upgraded, demo_requested) with trigger, firing side, properties, types, and expected volume. plan_activated and plan_upgraded locked to server-side Stripe webhook. Weekly funnel review template and 4 dashboard views included.

### pj-s17-brand-guide-v1 — PrayerJar brand guide v1
Committed docs/brand/brand-guide.md: brand promise, 5 voice attributes with do/don't pairs, visual motifs with hex codes and component refs, tier-naming convention (Free / Small Church / Growing Church / Network), fit-statement rule replacing "Most Popular," 16-entry banned-phrases list, and 3 reference copy examples. Unblocks pj-s17-tier-redesign and pj-s17-for-churches-rewrite.

## 2026-04-11

### pj-s2.4-40 — Long-form testimony stories
- `src/db/schema.ts` — `testimonyStory` text column added to `prayers` table (nullable)
- `src/app/api/v1/prayers/[id]/testimony/route.ts` — PUT saves testimony story (auth-gated, owner-only); GET returns story + prayer context + author
- `src/app/(public)/testimony/[id]/page.tsx` — public page: original prayer, testimony story (amber callout), answered date, author, share via `CopyButton`
- `src/components/testimony/testimony-form.tsx` + `testimony-card.tsx` — client form wired to PUT route; card for inline display

### pj-s2.4-41 — Praise wall redesign
- `src/components/praise-card.tsx` — rewritten: category emoji map, `testimonyStory` preview (blockquote with amber border), "Read story →" button linking to `/testimony/[id]` (only when story exists), fallback to legacy `testimony` field

### pj-s2.4-42 — Curated prayer collections
- `src/db/schema.ts` + migration — `collections` table (id, title, description, slug, coverEmoji, isPublished) + `collectionPrayers` join table
- `src/app/api/v1/collections/route.ts` — GET returns published collections with prayer count
- `src/app/api/v1/collections/[slug]/route.ts` — GET returns collection detail + paginated prayers
- `src/app/api/v1/admin/collections/route.ts` — POST create (admin-only); `src/app/api/v1/admin/collections/[id]/prayers/route.ts` — POST add prayer to collection
- `src/app/(public)/browse/collections/[slug]/page.tsx` — collection browse page with prayer cards

### pj-s2.4-43 — Category browsing redesign
- `src/app/api/v1/categories/counts/route.ts` — GET returns category + public prayer count pairs (group prayers excluded)
- `src/app/(public)/browse/page.tsx` — `CATEGORY_EMOJIS` map; responsive icon grid (2→4 cols) showing emoji, label, count; grid hidden when search/filter active

### pj-s2.4-44 — Search and discovery
- `src/app/(public)/browse/page.tsx` — `searchPrayers` service called directly (server component); `PrayerSearchBar` with `Suspense` wrapper; result count label; "Clear filters" button
- Collections section and category grid co-located on browse page; both suppressed during active search/filter

### pj-s2.4-45 — Notification system overhaul
- `src/db/schema.ts` — `notificationTypeEnum` extended: `partnership_request`, `partnership_ended`, `chain_joined`, `group_joined`, `testimony_posted`
- `src/components/notification-bell.tsx` — async server component: `getUnreadCount` + last-5 preview via `DropdownMenu`; badge caps at `9+`; "View all" link to `/notifications`
- `src/app/(dashboard)/notifications/page.tsx` — server-rendered, auth-gated; `groupByDate` helper (Today / This Week / Older); `TYPE_CONFIG` map with per-type icons; "Mark all read" server action via `revalidatePath`

## 2026-04-11

### pj-s2.3-37 — Self-created groups
- `src/db/schema.ts` + migration 0010 — `groupRoleEnum`, `groups` table, `groupMembers` table (unique constraint on groupId+userId)
- `src/services/group.service.ts` — `createGroup`, `joinGroup`, `leaveGroup`, `deleteGroup`, `getGroupsForUser`, `getGroupMembers`, `isGroupMember`, `generateInviteCode`, `getGroupById`, `getGroupMembership`; typed errors: `GroupNotFoundError`, `AlreadyMemberError`, `OwnerHasMembersError`, `NotOwnerError`
- `src/app/api/v1/groups/route.ts` — POST (create, auth-gated) + GET (list user's groups)
- `src/app/api/v1/groups/[id]/route.ts` — DELETE (owner-only, cascades via FK)
- `src/app/api/v1/groups/join/route.ts` — POST (join by invite code, 404/409 errors)
- `src/app/api/v1/groups/[id]/leave/route.ts` — POST (non-owner leave; owner with members → 409)
- `src/app/(dashboard)/groups/page.tsx` — server component, auth-gated, group cards with member count, empty state
- `src/app/(dashboard)/groups/new/page.tsx` — server shell + `CreateGroupForm` (name 50 chars, desc 200 chars)
- `src/app/(dashboard)/groups/[id]/page.tsx` — membership-gated detail: invite code + CopyButton, member list with role badges, GroupTabs
- `src/components/group/create-group-form.tsx`, `join-group-form.tsx`, `copy-button.tsx`, `group-detail-actions.tsx`, `group-tabs.tsx`
- `src/components/user-menu.tsx` — Groups link added

### pj-s2.3-38 — Private group prayer wall
- `src/services/group.service.ts` — `getGroupPrayers`, `postGroupPrayer` added
- `src/app/api/v1/groups/[id]/prayers/route.ts` — GET + POST, both auth + membership gated
- `src/services/prayer.service.ts` — `isNull(prayers.groupId)` filter added to `getRandomPrayer`, `searchPrayers`, `getAnsweredPrayers`, `getAnsweredPrayersFiltered` (group prayers excluded from public feed)
- `src/components/group/group-wall.tsx` — client component, inline post form (2000-char textarea, category select), server-confirmed prepend, loading/error/empty states, reuses `PrayerCard`

### pj-s2.3-39 — Group activity feed
- `src/services/group.service.ts` — `getGroupActivity(groupId, limit=20)`: parallel queries for posted prayers, answered prayers, member joins; merged + sorted desc; `ActivityItem` union type exported
- `src/components/group/group-activity.tsx` — server component, timeline list with emoji icons, 40-char content snippets, `formatDistanceToNow` relative timestamps, empty state

## 2026-04-11

### pj-s2.2-34 — Adopt a prayer
- `src/components/adopt-prayer-button.tsx` — toggle with optimistic UI, revert on error, 401 user message, amber styling, count label ("N people are praying daily")
- `src/app/(dashboard)/adopted/page.tsx` — server component, auth-gated redirect, PrayerCard grid sorted by adoptedAt desc, EmptyState with action link to /pray
- `src/components/prayer-card.tsx` — AdoptPrayerButton added for active prayers; optional isAdopted/adoptionCount props default to false/0 (existing callsites unaffected)
- `src/app/(public)/p/[id]/page.tsx` — AdoptPrayerButton + PrayerChain added; server parallel-fetches adoptionCount, isAdopted, chain
- `src/components/user-menu.tsx` — "Adopted Prayers" link added to dropdown

### pj-s2.2-36 — Praying Now live counter
- `src/app/api/v1/sse/praying-now/route.ts` — SSE endpoint, force-dynamic, streams { count } every 3s via ReadableStream + setInterval, cleans up via req.signal abort listener (no interval leak)
- `src/components/praying-now-counter.tsx` — EventSource client, pulsing green dot when connected, 600ms eased number tween, retains last count on disconnect, auto-reconnects after 5s
- `src/app/(public)/page.tsx` — PrayingNowCounter added to "A Community in Prayer" stats card



### pj-s2.1-32 — Partner encouragement exchange
- `src/app/(dashboard)/partner/page.tsx` — server component; fetches active partnership, partner user record, and partner's last 3 active prayers server-side; friendly empty state when no partner yet
- `src/components/partner/message-thread.tsx` — client component; scrollable thread with own/partner bubbles, optimistic send with revert on error, 500-char counter, Enter-to-send, auto-scroll to bottom
- `src/components/user-menu.tsx` — "Prayer Partner" item added to dropdown
- `src/components/mobile-nav.tsx` — "Partner" link with Users icon added



### pj-s1.3-27 — Anonymous check-ins (7-day pulse)
- `src/db/schema.ts` — `checkIns` table with `checkInMoodEnum` (struggling/okay/better/breakthrough), FK to prayers with cascade delete
- `src/db/migrations/0006_overconfident_lifeguard.sql` — migration generated
- `src/services/care.service.ts` — `getCheckInStatus(prayerId)`, `saveCheckIn(prayerId, mood)`
- `src/app/api/v1/check-ins/route.ts` — anonymous POST, Zod validation, 201/409/400
- `src/components/check-in-pulse.tsx` — 4-mood check-in card, 7-day gate, localStorage dedup, 409 handling, dark mode
- `src/app/(public)/p/[id]/page.tsx` — `CheckInPulse` mounted below `PrayForButton`

### pj-s1.3-30 — Scripture with encouragement — AI-generated in guided prayer
- `src/services/ai.service.ts` — `generateEncouragement(prayerContent, verse)` using claude-haiku-4.5 via AI Gateway, temperature 0.7, maxTokens 150, fallback on error
- `src/app/actions/ai.actions.ts` — `'use server'` wrapper action
- `src/components/guided-prayer.tsx` — encouragement card shown after Amen step, 3-row Skeleton loading state, amber card with dark mode, cleanup cancellation flag

## 2026-04-11 pj-s2.1-32 Partner encouragement exchange
Message thread between matched prayer partners — scrollable, optimistic send, 500-char limit.

## 2026-04-11 pj-s2.1-33 Extend / re-match flow
Partners can extend 28 days (mutual confirmation) or end early with notification. Mobile nav trimmed to 6 items.

## 2026-04-11 pj-s1.3-28 Care for the intercessor — thank-you email
Daily cron sends warm thank-you to users who prayed for 5+ others in 7 days. Routes through email.service.ts.

## 2026-04-11 pj-s1.3-29 Grief anniversaries — remembrance email + form
Anniversary date picker on grief prayers; daily cron sends compassionate remembrance email each year.

## 2026-04-11 pj-s2.2-35 Prayer chains (24hr coverage)
24-slot prayer chain grid on share pages. Users sign up for 1-hour slots to cover a prayer around the clock.
