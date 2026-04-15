# Prayer Jar Testing Plan

This is a memory aid, not a test suite. Before pushing to prod, run the **Smoke Walkthrough**. When you touch a specific module, run its section.

Every item should be tested **both signed-in and in an incognito window** unless stated otherwise. Session state has been the source of many bugs.

---

## Smoke Walkthrough (before every prod push — 5 min)

- [ ] `/` loads. Home counter matches `/pray` count (subtract your own + group prayers)
- [ ] Sign in with magic link — email arrives from `noreply@prayerjar.org`, clicking it lands on `/`
- [ ] Sign in with Google — lands on `/`
- [ ] Sign out — dropdown disappears, lands on `/`
- [ ] `/pray` → **Any** returns a prayer card (or "no prayers" with a real empty DB)
- [ ] `/browse` shows active prayers, search box works
- [ ] Account dropdown shows: Profile, My Prayers, Groups, Saved Churches, **My Church name + View Church Page + Dashboard** (if admin)
- [ ] `/church/{your-slug}` renders — name, welcome message, member avatars
- [ ] `/sitemap.xml` contains `/church/{slug}` entries for every church that exists
- [ ] Find-a-church: search "Austin TX" → results → click one → click "Back to results" → results still there (no re-search)
- [ ] No console errors on any of the above

---

## Auth Module

### Magic link sign-in
- [ ] Email arrives within 30s
- [ ] From address is `noreply@prayerjar.org` (not `onboarding@resend.dev`)
- [ ] Click-through URL is `https://prayerjar.org/...` (not a tracking-domain rewrite)
- [ ] First sign-in creates user row with `onboardingCompleted=false`
- [ ] After sign-in, onboarding overlay appears on `/`

### Google OAuth
- [ ] Google sign-in works for a fresh email
- [ ] Google sign-in with an email that previously used magic link **links to existing user** (doesn't create duplicate). Check the `accounts` table.

### Sign-out
- [ ] Clicking Sign Out clears session cookie
- [ ] Attempting to access `/profile` while signed out redirects to `/sign-in`
- [ ] Sign-out from mobile nav works identically

### Session persistence
- [ ] Sign in, close browser tab, reopen — still signed in
- [ ] Sign in on one device, check session on another — both valid until sign-out

---

## Prayers Module

### Submit a prayer
- [ ] Signed-in: submit a prayer → appears in `/my-prayers`, counts toward home stats
- [ ] Signed-in: submit with `isAnonymous=true` → author hidden on `/pray` and `/browse`
- [ ] Incognito: submit a prayer → no author, still appears in feeds
- [ ] Very long content (>500 chars) — either truncated gracefully or rejected with a clear error
- [ ] AI moderation catches obvious spam/obscenity — check `ai.service`
- [ ] Category auto-assigned if not specified
- [ ] Verse suggestion appears on submission (if AI is configured)

### Pray for someone (`/pray`)
- [ ] `/pray → Any` shows a prayer card (excluding your own + group-wall prayers)
- [ ] `/pray → {category}` shows only prayers in that category
- [ ] `/pray?urgent=1` shows only urgent prayers
- [ ] Anonymous prayers (`authorId=NULL`) **are visible** — this was a 3VL bug, don't regress
- [ ] Clicking "I prayed" increments `prayerInteractions`, increments home counter
- [ ] "I prayed" with a message — recipient gets a notification
- [ ] Trying to pray for your own request shouldn't happen (excluded from feed) — verify by manually visiting `/pray/{your-prayer-id}` if routes allow

### Browse prayers
- [ ] `/browse` shows all active non-group prayers
- [ ] Search by keyword works (ILIKE)
- [ ] Category filter works
- [ ] Urgent-only filter works
- [ ] Collections section shows only when no filter is active
- [ ] Pagination / load-more works past 20 results

### Answered / testimonies
- [ ] Mark a prayer answered → appears on `/praise-wall`
- [ ] Testimony with image uploads correctly
- [ ] `/testimony/{id}` renders publicly, has OG image

---

## Home Page

- [ ] "Prayers waiting" counter **matches** count in `/pray → Any`
- [ ] "Lights released" shows answered prayers count
- [ ] Daily verse rotates (different each day)
- [ ] Animated counters animate on scroll-into-view
- [ ] "Praying now" counter updates (or gracefully handles 0)
- [ ] Onboarding overlay appears on **first sign-in only**
  - [ ] Step 1 → 2: category chips save
  - [ ] Step 2 → 3: "pray for someone" fetches real prayer, button works, flips to ✓
  - [ ] Step 3 → complete: `onboardingCompleted=true`, overlay never reappears
  - [ ] Esc / backdrop click / X closes and marks complete
- [ ] Signed-out home shows sign-in CTA, no dropdown

---

## Churches Module (platform)

### Create church
- [ ] `/church/create` requires auth, redirects to `/sign-in` otherwise
- [ ] Creating a church makes the creator an `admin` in `churchMembers`
- [ ] Slug auto-generated, 4-char suffix ensures uniqueness
- [ ] Duplicate slug attempt handled gracefully

### Public church page `/church/{slug}`
- [ ] Public (no auth required) — renders for incognito users
- [ ] Welcome message renders (if set)
- [ ] Member count + initial avatars (privacy-safe, first letter only)
- [ ] CTA logic:
  - [ ] Signed out → "Sign in to join"
  - [ ] Signed in + not a member → "Join this church"
  - [ ] Signed in + member → "View Prayer Wall"
  - [ ] Signed in + admin/pastor → extra "Dashboard" button
- [ ] 404 for non-existent slug
- [ ] OG tags render with church name

### Church dashboard `/church/{slug}/dashboard`
- [ ] Requires admin or pastor role — other users redirected/403
- [ ] Team page shows member list with roles
- [ ] Copy invite link works (clipboard API), shows "Copied!" toast
- [ ] Member limits enforced per subscription tier (free: 10, starter: 50, etc.)

### Join church
- [ ] `/church/join?code={slug}` — unauthenticated user sees church preview + sign-in CTA
- [ ] Authenticated user can join (idempotent — clicking twice doesn't duplicate)
- [ ] Already a member → message + link to wall
- [ ] Join redirects to `/church/{slug}/wall`

### Remove member
- [ ] Admin can remove a member
- [ ] Admin cannot remove themselves if they're the last admin
- [ ] Removed member loses access to wall, dashboard

---

## Find-a-Church Module

- [ ] Geocode by address works (Google Places API)
- [ ] Map renders without covering header dropdown (z-index isolation)
- [ ] Radius slider applies (clamped to 30mi max)
- [ ] Denomination filter narrows results
- [ ] Search state encoded in URL (`?lat&lng&radius&address`)
- [ ] Click result → `/find-a-church/{placeId}` detail page
- [ ] Click "Back to results" → results restored from URL, no re-geocode needed
- [ ] Save church → appears in `/saved-churches`
- [ ] Unsave → disappears
- [ ] Church claim flow:
  - [ ] Submit claim → verification email sent
  - [ ] Click verification link → claim marked verified
  - [ ] Verified claim shows "Claimed" badge on result card
  - [ ] Recommendations (newcomer-friendly, services, etc.) show on detail page

---

## Groups Module

- [ ] Create a group — creator is `owner`
- [ ] Invite members by email / link
- [ ] Group prayer wall shows only prayers with `groupId = this.id`
- [ ] **Group prayers do NOT appear in global `/pray` or `/browse`** (was isolation bug before, don't regress)
- [ ] Member list shows display name (not "Unknown" for null-name users — falls back to email username)
- [ ] Leaving the group removes you from member list
- [ ] Owner transfer works (if implemented)

---

## Billing / Stripe Module

Use Stripe test mode cards:
- `4242 4242 4242 4242` — succeeds
- `4000 0000 0000 9995` — declined
- `4000 0025 0000 3155` — requires 3DS auth

### Donations
- [ ] `/give` → enter amount → redirects to Stripe Checkout
- [ ] Successful payment creates `donations` row, awards `donor` badge
- [ ] Webhook processes even if user navigates away mid-checkout
- [ ] Failed payment doesn't create a donation row
- [ ] Duplicate webhook delivery doesn't create duplicate row (idempotency via `stripePaymentIntentId`)

### Subscriptions (church plans)
- [ ] Upgrade from `/billing` → Stripe Checkout → returns to `/billing?success=1`
- [ ] Webhook creates `subscriptions` row AND updates `churches.subscriptionId` (critical — was broken in Sprint 8)
- [ ] `getChurchTier()` returns the correct tier after upgrade
- [ ] Cancel subscription → sets `cancelAtPeriodEnd=true`, tier remains active until period end
- [ ] `customer.subscription.updated` webhook updates status, period dates
- [ ] `customer.subscription.deleted` webhook sets `status='canceled'`

### Event licenses
- [ ] Purchase flow from `/church/{slug}/events` works
- [ ] License valid for 1 year from purchase
- [ ] Capacity tier pricing correct ($99/$199/$499)

### Environment-specific
- [ ] `STRIPE_SECRET_KEY` is `sk_live_...` on prod, `sk_test_...` on preview
- [ ] `STRIPE_WEBHOOK_SECRET` matches the environment's webhook endpoint

---

## Settings / Profile Module

- [ ] `/profile` shows current user info, doesn't crash for users with no church membership
- [ ] Display name field updates `users.name`
- [ ] Quiet hours settings save and respect timezone
- [ ] Email preferences (off / realtime / daily / weekly) persist
- [ ] Preferred categories multi-select saves

---

## Notifications Module

- [ ] Notification bell shows unread count badge
- [ ] Clicking bell opens list, marks notifications as read
- [ ] Notification types fire correctly:
  - [ ] `someone_prayed` — when someone prays for your request
  - [ ] `message_received` — when someone includes a message
  - [ ] `prayer_answered` — when author marks answered
  - [ ] `badge_earned` — on badge threshold crossed
  - [ ] `group_joined` — new member in your group
- [ ] Respects user email preference (realtime/daily/weekly/off)

---

## Prayer Partner / Partnerships

- [ ] Send a partner request → recipient gets notification
- [ ] Accept/decline works both ways
- [ ] Active partnership shows on `/partner`
- [ ] Ending partnership notifies the other person, removes from list

---

## Collections / Browse

- [ ] Published collections appear on `/browse`
- [ ] `/browse/collections/{slug}` shows collection's prayers
- [ ] Category counts on `/browse` match actual active-prayer counts per category
- [ ] Unpublished collections hidden from public

---

## API Routes (spot-check with curl or DevTools Network)

- [ ] `GET /api/v1/prayers/random?category=any` returns `{prayer: {...}}` or `{prayer: null}`
- [ ] `POST /api/v1/prayers/{id}/pray` with valid body → 201
- [ ] `POST /api/v1/prayers/{id}/pray` with invalid body → 400
- [ ] `GET /api/v1/churches/search?lat=...&lng=...` returns churches
- [ ] `POST /api/v1/checkout` rejects missing body, validates discriminated union
- [ ] `POST /api/webhooks/stripe` rejects missing signature (400)
- [ ] Rate-limited endpoints return 429 after threshold

---

## SEO / Infra

- [ ] `/sitemap.xml` includes all static routes + every church's `/church/{slug}`
- [ ] Sitemap uses `https://prayerjar.org` as base (not vercel.app)
- [ ] `/robots.txt` allows crawlers, points to sitemap
- [ ] `/opengraph-image` returns 1200x630 image
- [ ] Individual prayer pages have custom OG images
- [ ] `manifest.json` valid (PWA install prompt works on mobile)
- [ ] Service worker registers without errors (`/sw.js`)
- [ ] Security headers present (HSTS, X-Frame-Options, etc.) — check DevTools Network

---

## Pre-Deploy Config Audit

Check Vercel dashboard **Settings → Environment Variables** before any "deploy looks weird" debug:

| Variable | Production | Preview | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://prayerjar.org` | (unset or preview URL) | Used in sitemap, OG, emails, Stripe returns |
| `DATABASE_URL` | prod Neon branch | preview Neon branch | Don't mix — preview shouldn't write prod |
| `STRIPE_SECRET_KEY` | `sk_live_...` | `sk_test_...` | **Never** ship test to prod |
| `STRIPE_WEBHOOK_SECRET` | matches prod webhook | matches preview webhook | |
| `AUTH_EMAIL_FROM` | `Prayer Jar <noreply@prayerjar.org>` | same or test domain | |
| `AUTH_SECRET` | set, 32+ chars | set | Different per env OK but not required |
| `GOOGLE_PLACES_API_KEY` | set | set | |
| `RESEND_API_KEY` | prod key | test key | |

---

## When This Plan Is Wrong

This file gets stale fast. Every new feature or route should add its section here within a day of merge. If you find a bug that **should** have been caught by this plan and wasn't, add the missing check. That's how the plan earns its keep.
