# Church Onboarding Audit — PrayerJar Sprint 17

**Prepared by:** Customer Success  
**Date:** 2026-04-17  
**Scope:** Day-1 experience for a pastor from signup through first useful action  
**Status:** Sprint 17 audit — Implementation is Sprint 18 scope

---

## 1. Friction Log — Step-by-Step Walkthrough

### Step 1: Discovery / Entry Point
**Screen:** `/for-churches` or `/partners`  
**File:** `src/app/(public)/for-churches/page.tsx`, `src/app/(public)/partners/page.tsx`

The CTA buttons correctly link to `/church/create`. No friction here — the entry point is consistent. However, there is no indication of what happens *after* creation. The pastor clicks "Get Started Free" without knowing whether they'll see a dashboard, a blank page, or be asked to configure more.

**Friction #1 — No preview of post-signup experience.** Pastors arrive at the create form without any sense of what they're building toward.

---

### Step 2: Church Creation Form
**Screen:** `/church/create`  
**File:** `src/app/(church)/church/create/page.tsx`

The form collects: church name (required), description (optional), welcome message (optional).

On success, the API (`src/app/api/v1/church/route.ts`) creates the church and returns a slug. The client-side handler (`router.push(\`/church/${slug}\`)`) then redirects to `/church/[slug]` — the **public church profile page**, not the pastoral dashboard.

**Friction #2 — Post-creation redirect goes to the public profile, not the admin area.**  
A pastor who just created their church is redirected to a page that looks like what a congregation member would see. There is no "Welcome! Here's what to do next" moment. The page shows a letter-avatar with the church name, a member count of 1, and two buttons: "View Prayer Wall" and "Dashboard." There is no indication which to click first or why.

**Friction #3 — The description and welcome message fields on the create form are optional with no guidance about why they matter.** Many pastors will skip them, then discover later that their prayer wall has no greeting for members.

---

### Step 3: The Public Church Profile (First Post-Creation Screen)
**Screen:** `/church/[slug]` (public route)  
**File:** `src/app/(public)/church/[slug]/page.tsx`

The pastor arrives here immediately after creating their church. What they see:
- A letter-avatar with their church's initial character, colored with the default primary color
- "1 member" (themselves)
- If description/welcome message were left blank: just the church name and member count — nothing else
- Two action buttons: "View Prayer Wall →" and "Dashboard"
- A community section with one avatar (the pastor themselves)

There is no call-to-action explaining what to do next. There is no "Setup Guide" link on this screen. A pastor landing here cold would have no idea that `/church/[slug]/setup` exists.

**Friction #4 — No link to the Setup Guide from the post-creation landing screen.**  
`/church/[slug]/setup` exists and is well-structured, but is never surfaced in the immediate post-creation flow. A pastor must know to navigate there manually.

**Friction #5 — Empty church profile looks abandoned.** With no description, no welcome message, and 1 member, the public profile communicates zero credibility to a pastor trying to evaluate whether this platform is worth sharing with their congregation.

---

### Step 4: The Setup Guide (only reached if the pastor discovers it)
**Screen:** `/church/[slug]/setup`  
**File:** `src/app/(church)/church/[slug]/setup/page.tsx`

If a pastor does find the Setup Guide, it is genuinely useful — 6 numbered steps with action links. However:

**Friction #6 — Step 4 ("Invite Your Prayer Team") is marked "Coming soon"** with no workaround offered.  
The actual invite mechanism exists — it is functional in `/church/[slug]/dashboard/team` via the `CopyInviteLink` component (`src/components/church/copy-invite-link.tsx`). The Setup Guide incorrectly labels member invites as coming soon when the feature already exists. This is a data accuracy failure that undermines pastor confidence.

**Friction #7 — The Setup Guide has no completion tracking.** All 6 steps appear identical whether or not the pastor has done them. A pastor who completed step 2 (branding) cannot tell at a glance what remains.

**Friction #8 — No direct link to the Setup Guide from the Pastoral Dashboard.** The dashboard (`src/app/(church)/church/[slug]/dashboard/page.tsx`) shows stats and Quick Navigation (Flagged Prayers, Care Inbox, Prayer Team), but nothing that says "New here? Finish your setup."

---

### Step 5: Pastoral Dashboard (gated by plan tier)
**Screen:** `/church/[slug]/dashboard`  
**File:** `src/app/(church)/church/[slug]/dashboard/page.tsx`

On day 1 a pastor on the free tier hits the plan tier gate immediately:

> "The Pastoral Dashboard is available on the [plan name] plan and above. Upgrade to unlock it."

Two links: "View plans" (→ `/billing`) and "← Back to [church name]".

**Friction #9 — The plan gate offers no intermediate value.** A free-tier pastor is simply blocked. There is no explanation of what they *can* do on the free tier right now, and no suggested next action. They see a dead end.

**Friction #10 — "View plans" links to `/billing`, a user-level billing page**, not a church-specific upgrade page. This is a routing mismatch that may confuse pastors trying to upgrade their church account.

---

### Step 6: Prayer Wall (first meaningful free-tier action)
**Screen:** `/church/[slug]/wall`  
**File:** `src/app/(church)/church/[slug]/wall/page.tsx`

The prayer wall is the primary free-tier value. A day-1 pastor who navigates here sees:

> "No prayers have been shared yet. Be the first!"

This is a dashed-border empty state with no further action. There is no button to submit a prayer from this screen. The pastor must know to navigate elsewhere to add a prayer, or must share the wall link with congregation members and wait for them to join.

**Friction #11 — No "Add a prayer" CTA on the empty prayer wall.** The empty state text says "Be the first!" but provides no way to do so from this screen.

**Friction #12 — Members must join via a separate invite flow before they can post.** The wall requires church membership. A pastor has no way to demonstrate the product to their leadership team without first getting those people to create accounts and join.

---

### Step 7: Inviting Members
**Screen:** `/church/[slug]/dashboard/team`  
**File:** `src/app/(church)/church/[slug]/dashboard/team/page.tsx`

The invite mechanism exists: a `CopyInviteLink` component generates `https://prayerjar.org/church/join?code=[slug]`. This is solid. However:

**Friction #13 — The invite link is buried three navigation levels deep** (public church page → Dashboard → Prayer Team). Most pastors will not find it without guidance.

**Friction #14 — No email invite flow.** Pastors can only share a raw URL. If they want to invite 10 elders, they must copy-paste the link manually and send it themselves. There is no in-app "Send invite" form.

---

### Step 8: Small Groups
**Screen:** `/church/[slug]/groups`  
**File:** `src/app/(church)/church/[slug]/groups/page.tsx`

Empty state: "No small groups yet." with an "+ Create Group" button for admins. The button links to `/groups/create?churchId=[id]`, which exits the church management context entirely — navigating to a different section of the app without clear visual indication.

**Friction #15 — Group creation navigates outside the church context** with no breadcrumb back.

---

## 2. Proposed Guided-Setup Checklist

A persistent, server-tracked checklist surfaced immediately after church creation (on the public church page and on the setup page). Each step should be independently completable and should auto-check when the success criterion is met.

| # | Step | Success Criterion | Notes |
|---|------|------------------|-------|
| 1 | **Name your church** | `churches.name` is non-empty | Auto-complete at account creation |
| 2 | **Write a welcome message** | `churches.welcomeMessage` is non-null and non-empty | Directs to `/church/[slug]/settings` |
| 3 | **Add a description** | `churches.description` is non-null and non-empty | Can be done on the create form or in a future settings section |
| 4 | **Share your invite link with at least one person** | `COUNT(church_members WHERE church_id = ?) >= 2` | "Invite copied" event also counts; actual join is the gold criterion |
| 5 | **Post the first prayer request** | `COUNT(church_prayers WHERE church_id = ?) >= 1` | Pastor posts a seed prayer as a demonstration |
| 6 | **Customize your branding** | `churches.logoUrl` is non-null OR `churches.primaryColor != '#6366F1'` (non-default) | Directs to `/church/[slug]/dashboard/branding` — gated to Starter+ |
| 7 | **Create your first small group** | `COUNT(groups WHERE church_id = ?) >= 1` | Directs to `/church/[slug]/groups` |
| 8 | **Run your first live prayer event** | `COUNT(church_events WHERE church_id = ?) >= 1` | Directs to `/church/[slug]/events/setup` — gated to Starter+ |

Steps 6 and 8 are plan-gated. They should display with a "Requires Starter" badge rather than being hidden, so the checklist doubles as a plan upgrade prompt.

Suggested wording for the checklist header:
> "You're 0 of 8 steps complete. Most churches are up and running in 10 minutes."

---

## 3. First-Run Sample Content Strategy

### What to seed and why

An empty prayer wall signals abandonment. A single sample prayer seeded at creation sets the right tone and shows the pastor what a prayer post looks like before any real members join.

### Proposed seed content

**At church creation (auto-seeded, dismissible):**

One placeholder prayer posted by the church admin account, marked as `isAnonymous: false` with author `name: church.name`:

> **Category:** Church  
> **Content:** "Lord, we thank you for this community. May every prayer shared here draw us closer to you and to one another. Guide our pastors, strengthen our members, and let your will be done in this congregation."  
> **Label:** (small badge) "Sample prayer — delete when ready"

One placeholder small group:

> **Name:** "Sunday Morning Prayer Team"  
> **Description:** "This is an example group. Rename it or delete it and create your own."

### Dismissal mechanism

- A banner at the top of the wall and groups pages: "You're viewing sample content. [Dismiss samples] or [Add your first real prayer]."
- Dismissal sets a `has_dismissed_samples: boolean` flag on the `churches` record.
- No analytics events fired on sample content interactions.

### Why not seed more

Seeding too much (e.g., 10 fake prayer requests) feels artificial and may feel disrespectful to pastors in a faith context. One seed prayer + one seed group is enough to break the "completely empty" problem without manufacturing false activity.

---

## 4. Top 3 Quick Wins (fixable in under 1 day, no design sprint needed)

### Quick Win 1: Redirect post-creation to the Setup Guide, not the public profile
**File to change:** `src/app/(church)/church/create/page.tsx` (line 37)  
**Change:** `router.push(\`/church/${slug}/setup\`)` instead of `router.push(\`/church/${slug}\`)`  
**Impact:** Every new church creator lands on the guided checklist immediately, not a blank public profile page.  
**Effort:** 1 line change.

### Quick Win 2: Fix the Setup Guide's "Coming soon" label on member invites
**File to change:** `src/app/(church)/church/[slug]/setup/page.tsx` (step index 3, "Invite Your Prayer Team")  
**Change:** Remove `comingSoon: true`. Add `link: { href: \`/church/${slug}/dashboard/team\`, label: 'Copy Invite Link' }`.  
**Impact:** Pastors can immediately act on the most critical step (getting members in) instead of being told it doesn't exist.  
**Effort:** 3-line change.

### Quick Win 3: Add an "Add a prayer" button to the empty prayer wall state
**File to change:** `src/app/(church)/church/[slug]/wall/page.tsx` (empty state div, around line 82)  
**Change:** Replace the plain text empty state with a link/button that opens the prayer submission flow. If prayer submission is a separate page, link there. If it's a dialog, trigger it.  
**Impact:** Breaks the "be the first!" dead end — the pastor can immediately seed a real prayer without hunting for another screen.  
**Effort:** Under 1 hour — add a button/link in the existing empty state block.

---

## 5. Wireframe Notes (for Designer pairing)

The following screens need Designer attention for Sprint 18 implementation:

1. **Post-creation welcome screen** — could be a modal overlay on the public church page, or a dedicated `/church/[slug]/welcome` route shown only on first visit. The checklist can live here.

2. **Persistent setup progress bar** — a thin progress bar or checklist widget in the church management header (the `⛪ Church Platform` nav bar in `src/app/(church)/layout.tsx`) showing "3 of 8 setup steps complete" with a link to the full checklist. Disappears once all 8 steps are complete.

3. **Plan gate redesign for pastoral dashboard** — the current dead-end gate page needs a "here's what you can do right now on the free tier" section with links to the prayer wall, groups, and invite link before showing the upgrade prompt.

**No wireframes are included in this document** — the above are scoping notes for the Designer to work from. Designer should produce low-fi wireframes for items 1 and 2 before Sprint 18 kickoff.

---

## 6. Sprint 18 Implementation Tasks (titles only, for Architect to create)

1. Redirect post-church-creation to `/church/[slug]/setup` instead of public profile
2. Fix Setup Guide "Invite Your Prayer Team" step — remove coming-soon, link to dashboard/team
3. Add "Add a prayer" CTA to the empty church prayer wall state
4. Implement server-tracked onboarding checklist with 8 steps and success-criterion checks
5. Seed one sample prayer and one sample group at church creation; add dismissal flag and banner
6. Redesign pastoral dashboard plan gate to surface free-tier actions before the upgrade prompt
7. Fix "View plans" billing link to route to a church-context upgrade page
8. Add persistent setup progress indicator to church management nav header
9. Surface Setup Guide link on the public church profile page (admin/pastor view only)

---

*Document owner: Customer Success. Implementation owner: Architect (Sprint 18). Designer pairing required before Sprint 18 kickoff for items 1, 2, 8 above.*
