# PrayerJar UX Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical UX issues, broken links, stale copy, and missing pages identified in the post-V2 audit.

**Architecture:** These are targeted fixes across existing pages — no new DB tables, no new services. Two new pages (`/pricing`, `/help`) and one new API route (`/api/v1/account/delete`). Everything else is copy edits, routing fixes, and component tweaks.

**Tech Stack:** Next.js 16 App Router, shadcn/ui, Tailwind v4, Drizzle ORM, Neon Postgres

**Important codebase conventions:**
- Base UI uses `render` prop, NOT `asChild` — e.g., `<Button render={<Link href="/" />}>Text</Button>`
- Next.js 16 requires `await params` in server components
- Domain is `prayerjar.org` (NOT `.app`)
- DB migrations: `npx drizzle-kit generate && npx drizzle-kit migrate`

---

## Sprint 7.1 — Critical Fixes (broken things)

These are things that are currently broken or wrong in production.

### Task 1: Fix contact email across all pages (.app → .org)

**Files:**
- Modify: `src/app/(public)/contact/page.tsx:14,17` — change `hello@prayerjar.app` → `hello@prayerjar.org`
- Modify: `src/app/(public)/privacy/page.tsx:52-53` — same fix
- Modify: `src/app/(public)/terms/page.tsx:52-53` — same fix

All three files have the wrong domain. The Trust page (`trust/page.tsx`) already uses the correct `hello@prayerjar.org`.

- [ ] **Step 1:** Fix contact/page.tsx — replace both occurrences of `hello@prayerjar.app` with `hello@prayerjar.org`
- [ ] **Step 2:** Fix privacy/page.tsx — same replacement
- [ ] **Step 3:** Fix terms/page.tsx — same replacement
- [ ] **Step 4:** Grep for any remaining `prayerjar.app` references: `grep -r "prayerjar\.app" src/`
- [ ] **Step 5:** Commit: `fix: correct contact email domain from .app to .org across contact, privacy, terms pages`

---

### Task 2: Fix About page — remove outdated "no premium tiers" copy

**Files:**
- Modify: `src/app/(public)/about/page.tsx:88-91`

Line 89 says: _"We are not selling anything. There are no ads, no data brokers, no premium tiers that gate the ability to ask for prayer."_

This is now false — we have Starter ($19/mo), Pro ($49/mo), and Enterprise plans. Prayer submission is still free, but the statement "no premium tiers" is wrong.

- [ ] **Step 1:** Replace the "What it is not" section's third paragraph with copy that's accurate:

```tsx
<p>
  Prayer is free — always. There are no ads, no data brokers, and no paywall
  on asking for prayer or praying for others. We offer paid plans for churches
  that want pastoral tools and private prayer walls, but the core experience
  is free for everyone.
</p>
```

- [ ] **Step 2:** Verify the page renders correctly in browser
- [ ] **Step 3:** Commit: `fix: update about page copy to reflect existence of church subscription tiers`

---

### Task 3: Fix Press Kit — add placeholder assets or honest "coming soon" state

**Files:**
- Modify: `src/app/(public)/press/page.tsx:54-64`

The press page links to `/press/logo.svg`, `/press/logo-pack.zip`, and `/press/brand-guide.pdf` — none of these files exist. `public/press/` only has a `.gitkeep`.

Two options — **recommended: replace download buttons with a "coming soon" notice and a contact CTA**, since we don't have real brand assets yet.

- [ ] **Step 1:** Replace the Brand Assets section download buttons with:

```tsx
<section>
  <h2 className="text-base font-semibold text-foreground mb-4">Brand Assets</h2>
  <div className="rounded-xl border bg-muted/30 p-6 text-center space-y-3">
    <p className="text-sm text-muted-foreground">
      Official brand assets (logos, color guide, screenshots) are being prepared.
    </p>
    <p className="text-sm">
      Need assets now?{" "}
      <a
        href="mailto:press@prayerjar.org"
        className="text-primary underline underline-offset-4"
      >
        Email our press team
      </a>{" "}
      and we&apos;ll send them directly.
    </p>
  </div>
</section>
```

- [ ] **Step 2:** Verify the page renders — no more broken download links
- [ ] **Step 3:** Commit: `fix: replace broken press kit download links with contact CTA`

---

### Task 4: Fix billing page — upgrade button routes to /give (donation) instead of subscription checkout

**Files:**
- Modify: `src/app/(dashboard)/billing/page.tsx:91` — change `href="/give"` to `href="/pricing"`
- Modify: `src/app/(dashboard)/billing/page.tsx:75` — same change for active subscription "Manage" link
- Modify: `src/app/(dashboard)/billing/page.tsx:147` — plan card "Get Started" buttons also link to `/give`

The `/give` page is a one-time donation form. Clicking "Upgrade to unlock church features" should go to a pricing/checkout flow, not a donation page.

**Note:** This task depends on Task 8 (create `/for-churches` page) existing. **Recommended: do Task 8 first, then come back to this.**

- [ ] **Step 1:** Change the free-plan upgrade button href from `/give` to `/for-churches`
- [ ] **Step 2:** Change the active subscription "Manage Subscription" button href from `/give` to `/for-churches`
- [ ] **Step 3:** Change plan card "Get Started" buttons href from `/give` to `/for-churches`
- [ ] **Step 4:** Verify billing page links go to the church platform page
- [ ] **Step 5:** Commit: `fix: route billing upgrade buttons to /for-churches instead of /give donation page`

---

## Sprint 7.2 — UX Improvements (missing things)

### Task 5: Fix Find a Church page — respect theme instead of hardcoded dark

**Files:**
- Modify: `src/app/(public)/find-a-church/page.tsx`

This page uses hardcoded `bg-slate-900`, `text-slate-400`, `bg-slate-800`, `border-slate-800` etc. throughout. Every other page in the app respects the theme (light/dark via ThemeProvider). This page looks jarring in light mode.

- [ ] **Step 1:** Replace all hardcoded slate dark classes with theme-aware equivalents:

| Hardcoded | Replace with |
|-----------|-------------|
| `bg-slate-900` | `bg-background` |
| `text-slate-400` / `text-slate-500` | `text-muted-foreground` |
| `text-slate-300` | `text-foreground` |
| `border-slate-800` / `border-slate-700` | `border-border` |
| `bg-slate-800` | `bg-muted` |
| `text-blue-400` / `text-blue-300` | `text-primary` |
| `border-blue-400` | `border-primary` |
| `text-red-400` / `bg-red-950/30` / `border-red-900` | `text-destructive` / `bg-destructive/10` / `border-destructive/30` |
| `h-screen bg-slate-900` on wrapper | `min-h-screen bg-background` |

- [ ] **Step 2:** Test in both light and dark mode in browser
- [ ] **Step 3:** Commit: `fix: make find-a-church page respect theme instead of hardcoded dark mode`

---

### Task 6: Add settings save feedback (toast/success state)

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Modify: `src/app/actions/settings.actions.ts` (if needed — check if actions return status)

Currently clicking "Save preferences" / "Save quiet hours" gives no visual feedback.

- [ ] **Step 1:** Read `src/app/actions/settings.actions.ts` to see current return values
- [ ] **Step 2:** Convert each settings Card into a client component wrapper (or use `useFormStatus` + `useActionState`) to show a brief "Saved!" confirmation after form submission
- [ ] **Step 3:** Add a simple success message that appears for 3 seconds after save:

```tsx
{saved && (
  <p className="text-sm text-green-600 dark:text-green-400">Saved!</p>
)}
```

- [ ] **Step 4:** Test all three settings forms — each should show confirmation on save
- [ ] **Step 5:** Commit: `feat: add save confirmation feedback on settings page`

---

### Task 7: Add FAQ / Help page

**Files:**
- Create: `src/app/(public)/help/page.tsx`

This is a key missing page. Users have no way to learn how features work other than exploring. Cover the most common questions.

- [ ] **Step 1:** Create `/help` page with these FAQ sections:

**Getting Started**
- How do I submit a prayer? 
- Do I need an account?
- Can I submit anonymously?

**Praying for Others**
- How do I pray for someone?
- What is "Adopt a Prayer"?
- What are Prayer Chains?

**Community Features**
- What are Prayer Partners?
- How do Groups work?
- What is the Praise Wall / "Lights Released"?

**Account & Settings**
- How do I change my notification settings?
- What are Quiet Hours?
- How do I export my data?
- How do I delete my account?

**For Churches**
- How do I register my church?
- What do the paid plans include?
- How do live event prayer walls work?

- [ ] **Step 2:** Use accordion-style UI (disclosure pattern) — each question expands to show the answer
- [ ] **Step 3:** Add a link to `/help` in the footer (between "Terms" and "Contact")
- [ ] **Step 4:** Verify the page renders and all accordions work
- [ ] **Step 5:** Commit: `feat: add /help page with FAQ covering all major features`

---

### Task 8: Create /for-churches landing page (replaces /pricing)

**Files:**
- Create: `src/app/(public)/for-churches/page.tsx`
- Modify: `src/app/layout.tsx` — add "For Churches" link in footer only (NOT main nav)

Church leaders evaluating PrayerJar need to see what the platform offers and what it costs. But a "Pricing" link in the main nav next to "Pray" and "Know Jesus" sends the wrong signal — it makes PrayerJar feel like a product, not a ministry tool. The page should lead with value, not price.

- [ ] **Step 1:** Create `/for-churches` page that leads with the church platform value proposition:
  - Hero: "Bring your church's prayer life online" or similar ministry-first framing
  - Feature sections: Private prayer wall, Pastoral dashboard, AI-flagged care, Live event prayer walls, Custom branding, Analytics & reports
  - Plans grid at the bottom (import `PLANS` from `@/lib/plans`) with monthly/yearly toggle
  - CTAs: Free → "Get Started" → `/sign-in`, Paid → "Start Free Trial" → `/sign-in?callbackUrl=/billing`, Enterprise → "Contact Us" → `mailto:hello@prayerjar.org`
  - Brief FAQ at bottom: "Is prayer still free?" (yes, always — plans are for church admin tools), "Can we try before committing?" (free tier is fully functional)

- [ ] **Step 2:** Add "For Churches" link in the **footer only** (between "About" and "Privacy"). Do NOT add to the main nav — keep the nav mission-focused.
- [ ] **Step 3:** Verify page renders, links work, no auth required
- [ ] **Step 4:** Commit: `feat: add /for-churches landing page with church platform value prop and plans`

---

### Task 9: Add "How it works" section to homepage

**Files:**
- Modify: `src/app/(public)/page.tsx`

The homepage goes hero → stats → CTAs with no explanation of the product flow. A simple 3-step section converts more first-time visitors.

- [ ] **Step 1:** Add a "How it works" section between the hero CTA buttons and the Stats section (between lines 96 and 98):

Three steps:
1. **Share your prayer** — "Submit a request, anonymously or with your name. It takes 30 seconds."
2. **Others pray for you** — "Real people from around the world stop and intercede for your need."  
3. **Mark it answered** — "When God moves, share the testimony. Your answered prayer becomes a light for others."

- [ ] **Step 2:** Wrap in a `ScrollReveal` for consistency with the rest of the page
- [ ] **Step 3:** Verify it looks right on both mobile and desktop
- [ ] **Step 4:** Commit: `feat: add "How it works" 3-step section to homepage`

---

### Task 10: Add self-service account deletion

**Files:**
- Create: `src/app/api/v1/account/delete/route.ts`
- Modify: `src/app/(dashboard)/settings/page.tsx` — add a "Delete Account" danger section at the bottom
- Modify: `src/app/(dashboard)/settings/export/page.tsx` — add a link to the delete option

The Trust page says "email us to delete your account." For GDPR compliance and user autonomy, there should be a self-service option.

- [ ] **Step 1:** Create the API route that:
  - Requires authentication
  - Cascades delete on the `users` row (all FKs are `onDelete: 'cascade'` already in schema)
  - Signs the user out after deletion
  - Returns 200

- [ ] **Step 2:** Add a "Danger Zone" card at the bottom of `/settings`:

```tsx
<Card className="border-destructive/50">
  <CardHeader>
    <CardTitle className="text-destructive">Delete Account</CardTitle>
    <CardDescription>
      Permanently delete your account and all associated data. This cannot be undone.
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Client component with confirmation dialog */}
  </CardContent>
</Card>
```

- [ ] **Step 3:** The delete button should show a confirmation dialog requiring the user to type "DELETE" before proceeding
- [ ] **Step 4:** After deletion, redirect to homepage with a brief "Account deleted" message
- [ ] **Step 5:** Update the Trust page copy to mention self-service: "You can delete your account and all data from Settings, or email us."
- [ ] **Step 6:** Test: create a test account, verify deletion removes all data, verify redirect works
- [ ] **Step 7:** Commit: `feat: add self-service account deletion with confirmation dialog`

---

### Task 11: Fix profile page — show user avatar when available

**Files:**
- Modify: `src/app/(dashboard)/profile/page.tsx:34-36`

The profile header always shows a prayer hands emoji. The `users` table has an `image` field. Show it when present.

- [ ] **Step 1:** Replace the hardcoded emoji avatar with:

```tsx
<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
  {user.image ? (
    <img src={user.image} alt="" className="h-full w-full object-cover" />
  ) : (
    "🙏"
  )}
</div>
```

- [ ] **Step 2:** Verify with a user that has an image and one that doesn't
- [ ] **Step 3:** Commit: `fix: show user avatar on profile page when available`

---

### Task 12: Improve homepage secondary CTAs — visual hierarchy

**Files:**
- Modify: `src/app/(public)/page.tsx:120-126`

All three secondary CTAs (Lights Released, Find a Church, Know Jesus) are identical `ghost` buttons. "Know Jesus" is the most important action on the whole site but looks the least important here.

- [ ] **Step 1:** Give "Know Jesus" a distinct treatment — use `variant="default"` or a warm accent style, and move it first in the list
- [ ] **Step 2:** Consider adding a one-line description under each CTA:

```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Link href="/know-jesus" className="text-center group">
    <Button variant="default">Know Jesus</Button>
    <p className="text-xs text-muted-foreground mt-1">Start here</p>
  </Link>
  <Link href="/praise-wall" className="text-center group">
    <Button variant="outline">View Lights Released</Button>
    <p className="text-xs text-muted-foreground mt-1">Answered prayers</p>
  </Link>
  <Link href="/find-a-church" className="text-center group">
    <Button variant="outline">Find a Church</Button>
    <p className="text-xs text-muted-foreground mt-1">Near you</p>
  </Link>
</div>
```

- [ ] **Step 3:** Verify desktop and mobile layout
- [ ] **Step 4:** Commit: `feat: improve homepage secondary CTAs with visual hierarchy`

---

### Task 13: Fix feedback widget overlapping mobile nav

**Files:**
- Modify: `src/components/feedback-widget.tsx:122`

The floating feedback trigger is `fixed bottom-6 right-6` (24px from bottom). The mobile nav is `fixed bottom-0` with `h-14` (56px). On mobile, the feedback button sits directly on top of the Partner and Profile nav links, making them untappable.

- [ ] **Step 1:** Add `md:bottom-6 bottom-20` to the trigger button so it sits above the mobile nav on small screens but stays in the normal position on desktop:

Replace:
```tsx
className="fixed bottom-6 right-6 z-50 ..."
```
With:
```tsx
className="fixed bottom-20 right-6 md:bottom-6 z-50 ..."
```

(`bottom-20` = 80px, enough to clear the 56px mobile nav + safe area inset)

- [ ] **Step 2:** Test on mobile — verify Partner and Profile nav links are now tappable
- [ ] **Step 3:** Test on desktop — verify feedback button is still in the bottom-right corner
- [ ] **Step 4:** Commit: `fix: move feedback widget above mobile nav to prevent overlap`

---

### Task 14: Fix mobile nav — reduce to 5 items, center Know Jesus

**Files:**
- Modify: `src/components/mobile-nav.tsx`

The mobile nav has 6 items: Home, Pray, Know Jesus (elevated), Lights, Partner, Profile. With 6 items, Know Jesus at position 3 is visually off-center (2 left, 3 right). "Partner" is the most niche item — requires auth, most visitors won't have one yet, and it's already accessible from the Profile page.

- [ ] **Step 1:** Remove the Partner link from mobile-nav.tsx (remove the `<Link href="/partner">` block and the `Users` import from lucide-react)

Result: **Home — Pray — [Know Jesus] — Lights — Profile** (5 items, cross perfectly centered)

- [ ] **Step 2:** Verify the Profile page at `/profile` still has the "Prayer Partner" link in the activity section (it does — confirmed in profile/page.tsx, but it's not there currently so we need to add it)
- [ ] **Step 3:** If Partner isn't already in the Profile page's activity links, add it:

```tsx
{ href: "/partner", icon: Users, label: "Prayer Partner", description: "Your matched prayer partner" },
```

(Add before the "Notifications" entry in the activity links array)

- [ ] **Step 4:** Test mobile nav — 5 items, Know Jesus centered, all links work
- [ ] **Step 5:** Verify Partner is still reachable via Profile page
- [ ] **Step 6:** Commit: `fix: reduce mobile nav to 5 items, center Know Jesus, move Partner to profile`

---

### Task 15: Hide billing page from non-church users

**Files:**
- Modify: `src/app/(dashboard)/billing/page.tsx` — add church admin/pastor guard
- Modify: `src/app/(dashboard)/profile/page.tsx` — conditionally show billing link

The billing page shows plan tiers, pricing, and "Free Plan" labels to every signed-in user. Someone who just submitted their first prayer doesn't need to see they're on a "Free Plan" — that's SaaS framing, not ministry framing. Billing is a church admin tool.

- [ ] **Step 1:** In `billing/page.tsx`, after auth check, query `churchMembers` to see if the user has an `admin` or `pastor` role in any church. If not, redirect to `/profile`.

```tsx
import { churchMembers } from '@/db/schema';

// After auth check
const churchRole = await db
  .select({ role: churchMembers.role })
  .from(churchMembers)
  .where(eq(churchMembers.userId, userId))
  .limit(1)
  .then(r => r[0]);

const isChurchAdmin = churchRole?.role === 'admin' || churchRole?.role === 'pastor';
if (!isChurchAdmin) redirect('/profile');
```

- [ ] **Step 2:** In `profile/page.tsx`, only show a "Billing" link in the activity list if the user is a church admin/pastor. Query the same way, or pass it as a prop. Don't show billing to regular users at all.

- [ ] **Step 3:** Verify: regular user visiting `/billing` gets redirected to `/profile`. Church admin sees billing normally.
- [ ] **Step 4:** Commit: `fix: restrict billing page to church admins/pastors — regular users never see plan tiers`

---

### Task 16: Press Kit — use real stats or honest language

**Files:**
- Modify: `src/app/(public)/press/page.tsx:31-36`

The press page has hardcoded stats: "50+ Countries", "10,000+ Prayers submitted." These may be aspirational or stale. Hardcoded vanity metrics feel startup-y and can become dishonest over time.

Two options:
- **Option A (recommended):** Pull real stats from DB (same pattern as homepage `getStats()`) — always honest, always current
- **Option B:** Use soft language like "People from dozens of countries" — honest without claiming precision

- [ ] **Step 1 (Option A):** Convert the press page to a server component (it already is) and query real stats:

```tsx
import { db } from '@/db';
import { prayers, prayerInteractions } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function getPressStats() {
  const [[prayerCount], [interactionCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(prayers),
    db.select({ count: sql<number>`count(distinct country)` }).from(prayerInteractions),
  ]);
  return {
    prayers: Number(prayerCount?.count ?? 0),
    countries: Number(interactionCount?.count ?? 0),
  };
}
```

Then display with rounding (e.g., `${Math.floor(stats.prayers / 100) * 100}+` for "200+" instead of exact "217").

- [ ] **Step 2:** Keep "24/7" and "Free for everyone" as-is (those are facts, not metrics)
- [ ] **Step 3:** Verify the page renders with live data
- [ ] **Step 4:** Commit: `fix: replace hardcoded press kit stats with live DB queries`

---

## Sprint 7.3 — Documentation (HTML)

**Blocked until Sprint 7.1 and 7.2 are complete.** Separate plan will be written for the 5 documentation pages once UX fixes are deployed.

Documentation deliverables (planned):
1. One-Pager / Landing Sheet
2. Full Feature Guide
3. User Guide — Individual Users
4. User Guide — Church Administrators
5. Subscriber / Paid Feature Guide

---

## Execution Order

**Sprint 7.1 (do first — these are bugs):**
1. Task 1 — Fix emails (5 min)
2. Task 2 — Fix about page copy (5 min)
3. Task 3 — Fix press kit links (5 min)
4. Task 13 — Fix feedback widget overlap (5 min)
5. Task 14 — Fix mobile nav / center Know Jesus (10 min)
6. Task 8 — Create /for-churches page (must exist before Task 4)
7. Task 4 — Fix billing upgrade routing (5 min)

**Sprint 7.2 (do second — improvements):**
8. Task 15 — Hide billing from non-church users (10 min)
9. Task 5 — Find a Church theming (15 min)
10. Task 6 — Settings save feedback (10 min)
11. Task 7 — Help/FAQ page (20 min)
12. Task 9 — Homepage "How it works" (10 min)
13. Task 10 — Account deletion (20 min)
14. Task 11 — Profile avatar (5 min)
15. Task 12 — Homepage CTAs (10 min)
16. Task 16 — Press Kit live stats (10 min)

**Sprint 7.3 (do third — after deploy):**
- Documentation pages (separate plan)
