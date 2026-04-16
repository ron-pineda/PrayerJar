# Copy Audit — PrayerJar
**Date:** 2026-04-15
**Auditor:** Copywriter Agent
**Scope:** All user-facing strings across nav, core components, dashboard pages, public pages, and server action errors.
**Tone benchmark:** Warm, contemplative, community-focused. Warmth over utility. Human, not corporate.

---

## 1. Naming Issues

Issues where labels are confusing, inconsistent, or misaligned with product tone.

### 1.1 "Lights Released" — Praise Wall nav label

| | |
|---|---|
| **Current** | "Lights Released" (desktop nav link and page `<h1>`) |
| **Mobile nav** | "Lights" (truncated label under the Star icon) |
| **Recommended** | "Answered Prayers" or "Praise Wall" (nav/label), keep "Lights Released" as the page's atmospheric headline only |
| **Reason** | "Lights Released" is a poetic internal metaphor explained only in the About page: "a light released — a small testimony." Without reading About, first-time visitors have no idea what it means. The mobile truncation to "Lights" makes it worse. Poetic language belongs in headlines; navigation labels must be immediately understood. The `/praise-wall` URL already uses the clearer term. |

### 1.2 "Prayed For" — user menu and page title

| | |
|---|---|
| **Current** | "Prayed For" (user menu item); "Prayers I've Prayed For" (page `<h1>`) |
| **Recommended** | "My Prayer Journal" (user menu, consistent with the profile page link label); "Prayers I've Stood With" or "Prayers I've Prayed For" (keep the page title, it's clear) |
| **Reason** | The user menu says "Prayed For." The profile page dashboard links call the same destination "Prayer Journal." These are two different labels for the same place. Pick one and use it everywhere. "Prayer Journal" is warmer and consistent with the About vision. |

### 1.3 "My Account" — user menu section header

| | |
|---|---|
| **Current** | "My Account" (DropdownMenuLabel in user-menu.tsx) |
| **Recommended** | Remove the label entirely, or replace with the user's name (already shown on the trigger button). |
| **Reason** | "My Account" is generic SaaS language that feels out of place in a prayer community. The trigger button already shows the user's name. The label adds nothing and reads corporate. |

### 1.4 "Power Intercessor" badge — activity level label

| | |
|---|---|
| **Current** | "Power Intercessor" (amber badge on My Prayers page for high-activity users) |
| **Recommended** | Keep the term but add a tooltip or context sentence — "You're praying for people consistently. Thank you." |
| **Reason** | "Power" is a gaming/corporate achievement word. The badge appears with no explanation of what it means or how you earned it. Without context it can read as elitist rather than encouraging. |

### 1.5 "Confirm Answered" — button in prayer card testimony form

| | |
|---|---|
| **Current** | "Confirm Answered" (submit button on mark-answered form) |
| **Recommended** | "Share This Testimony" or "Mark as Answered" |
| **Reason** | "Confirm" is a form-processing verb, not a spiritually resonant one. This is a significant moment — someone's prayer was answered. The button should honor that. |

### 1.6 "Prayer Sent" — confirmation state on prayer share page

| | |
|---|---|
| **Current** | "Prayer Sent" (PrayForButton after praying, with a Check icon) |
| **Recommended** | "I Prayed for This" (consistent with guided-prayer.tsx CTA; also more personal and specific) |
| **Reason** | "Prayer Sent" sounds like a form submission was processed. The guided prayer flow uses "I Prayed for This" — the two flows should use the same language for the same action. |

### 1.7 "+ New Request" — CTA button on My Prayers page

| | |
|---|---|
| **Current** | "+ New Request" |
| **Recommended** | "Add a Prayer" or "Share a Prayer" |
| **Reason** | "Request" is clinical. "+ New Request" reads like a support ticket system, not a place to share something you're carrying. The About page uses "Add a Prayer" language consistently. |

### 1.8 Status badge — raw status word "active"

| | |
|---|---|
| **Current** | Status badge reads "active" (lowercase, raw enum value) in prayer-card.tsx |
| **Recommended** | "In the Jar" or "Active" (capitalized at minimum) |
| **Reason** | The badge displays the raw database enum in lowercase. "active" is a technical state, not a human label. "In the Jar" would be on-brand with the product metaphor; "Active" is the minimum acceptable fix. |

---

## 2. Tone Inconsistencies

Places where the copy voice shifts from warm/spiritual to corporate/transactional.

### 2.1 Browse page description

> "Search and filter active prayer requests from the community."

This reads like a search engine help text. The rest of the product speaks warmly about burdens, carrying things, being witnessed. Suggested replacement:

> "Find a prayer to stand with someone who needs it right now."

### 2.2 My Prayers page description

> "Manage your prayer requests and share testimonies."

"Manage" is a CRM verb. This is the page where someone looks at everything they've brought before God. Suggested replacement:

> "Your prayers — active, answered, and remembered."

### 2.3 Browse page empty search result

> "No prayers found for '[query]'."

This is a database error message wearing a UI costume. Suggested replacement:

> "Nothing came up for that search. Try a different word, or browse by category below."

### 2.4 Contact page description

> "Have a question, feedback, or want to partner with us? We'd love to hear from you."

"Partner with us" is business-speak. Suggested replacement:

> "Have a question or want to reach the team? We read every message."

### 2.5 Contact action success toast

> "Message sent! We'll get back to you soon."

This is fine but cold for a spiritual product. Suggested:

> "Message received — we'll be in touch soon."

### 2.6 Notification bell — empty state

> "No notifications yet"

This is fine functionally, but reads like a default placeholder. Suggested:

> "Nothing yet — you'll hear when someone prays for you."

This makes the emptiness feel like anticipation rather than absence.

### 2.7 Profile page default username

> "Intercessor" (shown as fallback when user has no name set)

"Intercessor" as a default username is an interesting choice — it's theologically loaded and may not resonate with users who came to Prayer Jar without a church background. The About page explicitly says "This is not a religious platform." Suggested fallback: the user's email prefix, or "Friend."

### 2.8 Footer copyright

> "© 2026 The Prayer Jar"

The header nav says "Prayer Jar." The footer says "The Prayer Jar." Pick one. "Prayer Jar" without "The" is cleaner and matches the domain name.

### 2.9 Share buttons — bar label

> "Share" (small label to the left of share buttons in guided-prayer done state)

Works fine. No issue.

### 2.10 Onboarding step 3 — "Submit a Prayer" button

> "Submit a Prayer"

"Submit" is a form verb. On a spiritually-oriented product, this should be warmer. Suggested:

> "Add My Prayer"

Consistent with the homepage language and removes the transactional connotation.

### 2.11 Prayer card — "Renew (30 days)" button

> "Renew (30 days)"

The parenthetical "(30 days)" makes this feel like a subscription plan. The renewal confirmation message already says "expires in 30 days." Suggested button label:

> "Keep It Active" or "Renew Prayer"

---

## 3. Missing Copy

Empty states, error messages, or loading states with no copy or insufficient copy.

### 3.1 Browse page — no "no results" empty state component

The browse page uses an inline `<div>` with a bare `<p>` for zero results. It has no icon, no actionable suggestion beyond "Clear filters," and no warmth. This should use the `<EmptyState>` component with an icon and a real prompt to act.

**File:** `src/app/(public)/browse/page.tsx`, line 147–152

### 3.2 Prayer card — no error message for copyLink failure on HTTPS failure

The copy-link error message reads:

> "Could not copy link. Try long-pressing Share."

"Long-pressing Share" is an iOS/Android metaphor that doesn't translate to desktop browsers. Suggested:

> "Couldn't copy — try selecting the link manually."

**File:** `src/components/prayer-card.tsx`, line 139

### 3.3 Onboarding step 2 — no-prayer fallback

> "No prayers available right now. You can still continue."

Technically correct but does nothing for the user emotionally. This happens when the prayer feed is empty. Suggested:

> "The jar is quiet right now. Come back soon — you can still pray when you're ready."

**File:** `src/components/onboarding-overlay.tsx`, line 240–243

### 3.4 Guided prayer — encouragement fallback (catch case)

> "Your prayer matters. Thank you for interceding for others."

This is the catch fallback when the AI encouragement call fails. It's fine — warm, human, brief. But it's used as both a fallback *and* a placeholder before content loads. The loading skeleton handles the latter — this copy only shows if the API fails. No change needed, but note that it's doing double duty.

**File:** `src/components/guided-prayer.tsx`, line 46–47

### 3.5 Billing errors — generic fallback

> "Something went wrong. Please try again."

Used in both billing action errors (lines 66, 122 of billing.actions.ts). When billing fails, users need more direction than this. Even a link to contact support would help:

> "Something went wrong. Please try again or contact us if the problem continues."

**File:** `src/app/actions/billing.actions.ts`, lines 66, 122

### 3.6 Prayer card — status "expired" with no explanation

Expired prayers show the "expired" badge but give no explanation to the author about what to do. The `PrayerCard` shows no prompt to renew an expired prayer (the renew button only shows when `status === 'active'`). An expired prayer with no action is a dead end.

**File:** `src/components/prayer-card.tsx` — missing empty state / action for expired status

### 3.7 Browse page — category count display

Category grid shows a raw number (e.g., `14`) with no label beneath it. "14 what?" needs a label. Suggested: "14 prayers" or "14 active."

**File:** `src/app/(public)/browse/page.tsx`, line 123

---

## 4. Wins — Copy That's Working

These are well-executed — preserve and benchmark against them.

### 4.1 About page opening — "2am moment"

> "It started at 2am on a Tuesday. Someone was sitting alone in their car outside a hospital..."

This is exceptional product storytelling. It's specific, human, and immediately creates empathy without being sentimental. This is the voice the whole product should aspire to.

**File:** `src/app/(public)/about/page.tsx`, line 25

### 4.2 Prayer share page headline

> "Will you stand with them?"

Three words. Immediately understood. Invites without demanding. Perfectly on-brand.

**File:** `src/app/(public)/p/[id]/page.tsx`, line 82

### 4.3 Guided prayer — pause prompt

> "Take a moment to pause and bring this before God."

Quiet, specific, and reverent without being churchy. Exactly the right register for this moment in the flow.

**File:** `src/components/guided-prayer.tsx`, line 209

### 4.4 Know Jesus page subheadline

> "You don't have to have it all together. You just have to come as you are."

Warm, low-barrier, non-judgmental. Matches the product's stated mission of not requiring church membership or theology credentials.

**File:** `src/app/(public)/know-jesus/page.tsx`, line 22

### 4.5 Onboarding step 0 — welcome headline

> "You're not alone."

Three words with genuine emotional weight for someone who just arrived at a prayer app at a hard moment. This should never be changed.

**File:** `src/components/onboarding-overlay.tsx`, line 138

### 4.6 About page — "What it is not"

> "Comments are not a feature here. If you pray for someone, you pray — you don't critique, correct, or counsel unsolicited."

Clear, opinionated, and values-forward. This is the product's ethical stance expressed as plain language.

**File:** `src/app/(public)/about/page.tsx`, line 82

### 4.7 Prayed-for page — section header

> "Still Praying (N)"

"Still Praying" is much warmer than "Active" would be in this context. It frames continued prayer as faithfulness, not unresolved status.

**File:** `src/app/(dashboard)/prayed-for/page.tsx`, line 53

### 4.8 Prayer share page — "What is Prayer Jar?" description

> "Prayer Jar is a quiet place online where people bring their real burdens — health, family, grief, hope — and ask others to pray. No accounts required to pray. Just you, this moment, and someone who needs to know they are not alone."

This is the best product description in the app. It should probably be on the homepage hero section, not just at the bottom of the shared prayer page.

**File:** `src/app/(public)/p/[id]/page.tsx`, line 166

### 4.9 Notifications page — all-caught-up state

> "You're all caught up!"

Simple, conversational, and human. Better than "No unread notifications."

**File:** `src/app/(dashboard)/notifications/page.tsx`, line 71

### 4.10 Guided prayer — "I Prayed for This" CTA

The primary CTA in the guided prayer moment. Specific ("for This"), first-person, spiritually grounded. This is the right label for this button. The inconsistency (vs. "Prayer Sent" on the share page) is the problem — this version is the correct one.

**File:** `src/components/guided-prayer.tsx`, line 222

---

## 5. Priority Fix List

Ranked by user-facing impact. Impact factors: frequency (how often users see it), emotional weight of the moment, and degree of mismatch with brand voice.

| Rank | Issue | Current Copy | Recommended | File | Line |
|------|-------|-------------|-------------|------|------|
| 1 | "Lights Released" nav label — opaque to first-time visitors | "Lights Released" | "Answered Prayers" (nav label only) | `src/app/layout.tsx` | 73 |
| 2 | "Lights" mobile nav — incomprehensible truncation | "Lights" | "Answered" | `src/components/mobile-nav.tsx` | 52 |
| 3 | "Prayer Sent" vs "I Prayed for This" — inconsistent primary action label | "Prayer Sent" | "I Prayed for This" | `src/components/pray-for-button.tsx` | 63 |
| 4 | "+ New Request" button — clinical CRM language | "+ New Request" | "Add a Prayer" | `src/app/(dashboard)/my-prayers/page.tsx` | 46 |
| 5 | "Manage your prayer requests" — "Manage" kills the tone | "Manage your prayer requests and share testimonies." | "Your prayers — active, answered, and remembered." | `src/app/(dashboard)/my-prayers/page.tsx` | 44 |
| 6 | "Confirm Answered" button — form verb at an emotional moment | "Confirm Answered" | "Share This Testimony" | `src/components/prayer-card.tsx` | 316 |
| 7 | Raw status badge "active" — lowercase enum on card | "active" | "Active" (min) or "In the Jar" | `src/components/prayer-card.tsx` | 162 |
| 8 | Browse page description — search-engine tone | "Search and filter active prayer requests from the community." | "Find a prayer to stand with someone who needs it right now." | `src/app/(public)/browse/page.tsx` | 64 |
| 9 | Browse category count — raw number, no label | `{count}` (bare number) | `{count} prayers` | `src/app/(public)/browse/page.tsx` | 123 |
| 10 | "My Account" user menu label — generic SaaS language | "My Account" | Remove, or replace with user's first name | `src/components/user-menu.tsx` | 33 |

---

## Appendix: Additional Observations

- **Consistency of product name:** The product is called "Prayer Jar" in the nav logo, "The Prayer Jar" in the About page title, page metadata, and footer copyright. Should standardize to one form. Recommend "Prayer Jar" (no "The") to match the domain prayerjar.org.

- **"Someone" vs. "Anonymous":** In guided-prayer.tsx the prayer card says `prayer.isAnonymous ? 'Anonymous' : 'Someone'`. Both phrasings are oddly dehumanizing — "Anonymous" is a privacy status, not a person description. Suggested: "Someone who chose to stay anonymous" or simply "Someone" for both cases (since the pray-er doesn't need to know the distinction).

- **"Pray for someone like this →" (Browse page):** The CTA in browse search results links to `/pray/{category}` which starts a new random prayer, not the one the user is viewing. The label implies continuity but the action is a new flow. Either change the label ("Pray for someone in this category →") or link to `/p/{prayer.id}`.

- **`work_career` category display:** The category `work_career` is rendered with `replace('_', ' ')` which produces "work career" instead of "Work/Career" (the design spec name). Only one underscore is replaced (not all). Use `replaceAll` or a lookup table.
