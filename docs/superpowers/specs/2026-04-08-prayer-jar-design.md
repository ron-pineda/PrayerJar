# Prayer Jar -- Design Specification

**Date:** 2026-04-08
**Status:** Approved

## Overview

A web-based prayer jar where anyone in the world can submit prayer requests and pray for others. Requesters choose whether to be anonymous and whether to create an account. Other users browse prayers by category, receive a random request, pray for it in a guided moment, and optionally leave encouragement. Answered prayers move to a public Praise Wall.

## Architecture

**Approach:** Next.js Monolith + API Route Layer

Single Next.js App Router project deployed on Vercel. Server Actions handle web mutations, API route handlers (`/api/v1/...`) expose the same logic for a future mobile app. All business logic lives in a shared service layer that both Server Actions and API routes call.

**Tech Stack:**

| Concern | Tool | Rationale |
|---------|------|-----------|
| Framework | Next.js App Router | SSR, Server Actions, API routes in one |
| Database | Neon Postgres (Vercel Marketplace) | Free tier, serverless-friendly |
| ORM | Drizzle | Lightweight, type-safe, great migrations |
| Auth | NextAuth.js v5 | Magic link email auth, session management |
| AI | Vercel AI SDK + Claude API | Categorization, moderation, scripture |
| Email | Resend + React Email | Free tier (100 emails/day), great DX |
| Styling | Tailwind CSS + shadcn/ui | Fast to build, polished components |
| Deployment | Vercel | Zero-config, free tier |

**Project Structure:**

```
src/
  app/                      # Next.js App Router pages
    (public)/               # Public routes (home, pray, praise wall)
    (auth)/                 # Auth routes (sign in, sign up)
    (dashboard)/            # Logged-in routes (my prayers, journal, settings)
    api/                    # API route handlers (future mobile API)
      v1/
        prayers/
        interactions/
        notifications/
        badges/
  services/                 # Shared business logic (the core)
    prayer.service.ts       # Create, fetch, categorize, expire, renew
    interaction.service.ts  # Pray for, leave message
    moderation.service.ts   # AI screening + report handling
    notification.service.ts # In-app + email notifications
    badge.service.ts        # Badge evaluation and awarding
    ai.service.ts           # Categorization, scripture, moderation
  db/                       # Database schema & queries
    schema.ts               # Drizzle ORM schema
    migrations/
  lib/                      # Utilities, auth config, email templates
  components/               # React components
```

**Key architectural rule:** Server Actions and API routes are thin wrappers. They validate input and call into `services/`. All business logic lives in the service layer.

## Data Model

### Users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| email | text (nullable) | Null for anonymous users |
| name | text (nullable) | Display name |
| currentStreak | integer | Current prayer streak (days) |
| lastPrayedDate | date (nullable) | UTC date of last prayer action |
| emailPreference | enum | off (default), realtime, daily, weekly |
| createdAt | timestamp | |

Logged-in users authenticate via email magic link (passwordless). Anonymous users get a session-based temporary identity.

### Prayers

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| authorId | uuid (nullable) | Null for anonymous no-account submissions |
| content | text | The prayer request text |
| isAnonymous | boolean | Whether the author's name is hidden |
| isUrgent | boolean | Whether marked as urgent |
| category | enum | Health, Family, Financial, Grief, Gratitude, Guidance, Relationships, Work/Career, Spiritual Growth, Other |
| tags | text[] | AI-generated sub-tags |
| suggestedVerse | text | AI-generated scripture reference |
| status | enum | active, answered, expired |
| testimony | text (nullable) | Written when marked as answered |
| prayerCount | integer | How many people have prayed for this |
| createdAt | timestamp | |
| expiresAt | timestamp | Auto-set to 30 days from creation |

### PrayerInteractions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| prayerId | uuid | FK to Prayers |
| userId | uuid (nullable) | Null for anonymous pray-ers |
| message | text (nullable) | Optional encouragement message |
| isAnonymous | boolean | Whether the pray-er's name is hidden |
| createdAt | timestamp | |

### Notifications

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| userId | uuid | FK to Users |
| type | enum | someone_prayed, message_received, prayer_answered, badge_earned |
| relatedPrayerId | uuid (nullable) | |
| relatedInteractionId | uuid (nullable) | |
| read | boolean | Default false |
| createdAt | timestamp | |

### Badges

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| userId | uuid | FK to Users |
| type | enum | See badge definitions below |
| awardedAt | timestamp | |

### Reports

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| reporterId | uuid (nullable) | Who reported |
| prayerId | uuid (nullable) | Reported prayer (one of prayerId/interactionId is set) |
| interactionId | uuid (nullable) | Reported message |
| reason | text | Reason for report |
| status | enum | pending, reviewed, dismissed |
| createdAt | timestamp | |

## Core User Flows

### Submitting a Prayer

1. User lands on homepage, clicks "Add a Prayer"
2. Writes their prayer request in a text field
3. Toggles: anonymous or not, urgent or not
4. Submits
5. AI categorizes it (category + sub-tags + suggested scripture) and moderates it in parallel
6. If safe: prayer appears in the jar with a 30-day expiration
7. If flagged: held in review queue, submitter sees "Your prayer is being reviewed"

### Praying for Someone

1. User clicks "Pray for Someone"
2. Picks a category (or "Any"), optionally filters by urgent
3. A random prayer from that category is shown with the guided moment: prayer text, brief pause prompt, AI-suggested scripture
4. User clicks "I Prayed for This"
5. Optional: write a short encouragement message (toggle anonymous or not)
6. "Pray for Another?" button appears to continue the flow
7. Prayer counter increments, badge progress updates

### Tracking (Logged-In Users)

- **My Prayers**: list of submitted prayers with status, prayer count, and messages received
- **My Prayer Journal**: prayers they've prayed for, with any responses
- **Mark as Answered**: moves prayer to the Praise Wall with an optional testimony
- **Renew Prayer**: resets the 30-day expiration if still needed

### Praise Wall

- Public feed of answered prayers and testimonies
- Shows the original prayer, how many people prayed, and the answered testimony
- Browsable by category

### "Pray with Me" Sharing

- Requester can generate a shareable link to their specific prayer
- Anyone with the link can pray for that request without browsing the jar
- Link works for both logged-in and anonymous visitors

## AI Integration

Three AI jobs, all using Claude Haiku via the Vercel AI SDK:

### 1. Categorization (on prayer submit)

- Input: prayer text
- Output: structured JSON -- `{ category, tags, verse }`
- Example: "Please pray for my mom's surgery next week" -> `{ category: "Health", tags: ["surgery", "family member", "upcoming"], verse: "Isaiah 41:10" }`
- Uses structured output (not free text)

### 2. Moderation (on prayer submit + encouragement messages)

- Input: text content
- Output: `{ safe: boolean, reason?: string, selfHarm?: boolean }`
- Screens for: spam, profanity, hate speech, self-harm indicators, off-topic content, manipulation
- Flagged content goes to review queue (not rejected outright)
- Self-harm detected: held + display crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line)
- Runs in parallel with categorization on prayer submit

### 3. Scripture Suggestion

- Bundled with the categorization call to save an API round-trip
- AI selects a contextually relevant verse based on prayer content and category
- Displayed during the guided prayer moment

### Cost Management

- Claude Haiku for all AI tasks (fast, cheap, sufficient for structured extraction)
- Rate limit submissions to prevent abuse and runaway costs
- Cache common moderation patterns over time

## Badges

Badges are awarded automatically by the badge service after every relevant action.

| Badge | Trigger | Icon |
|-------|---------|------|
| First Light | Submitted first prayer request | Candle |
| First Prayer | Prayed for someone for the first time | Folded hands |
| Intercessor Bronze | Prayed for 10 requests | Bronze shield |
| Intercessor Silver | Prayed for 50 requests | Silver shield |
| Intercessor Gold | Prayed for 100 requests | Gold shield |
| Encourager Bronze | Left 10 encouragement messages | Bronze heart |
| Encourager Silver | Left 50 encouragement messages | Silver heart |
| Encourager Gold | Left 100 encouragement messages | Gold heart |
| Faithful | 7-day prayer streak | Flame |
| Devoted | 30-day prayer streak | Burning flame |
| Witness | Had a prayer marked as answered | Star |
| Testimony | Wrote a testimony on the Praise Wall | Open book |
| Community Builder | First prayer in a group room (future) | People |

**Design principles:**
- Badges are personal milestones, not competitive
- No leaderboards
- Badges display on user profile (visible to others if user is not anonymous)
- Badge evaluation runs in the service layer after each interaction (simple threshold checks)

**Prayer Streaks:**
- Tracked as `currentStreak` and `lastPrayedDate` on the user record
- If `lastPrayedDate` is yesterday: increment streak. If today: no change. Otherwise: reset to 1.
- Uses UTC date to avoid timezone complexity

## Moderation & Safety

### Layer 1: AI Screening (on submit)

Every prayer request and encouragement message passes through Claude Haiku before going live.

- **Safe**: published immediately
- **Flagged**: held in review queue, submitter sees "Your prayer is being reviewed"
- **Self-harm detected**: held + display crisis resources

### Layer 2: Community Reporting

- Any user can report a prayer or message via a flag icon
- Report includes a reason (dropdown: inappropriate, spam, harassment, other)
- Reports go into the review queue

### Admin Review Queue

- Simple admin page (protected route, accessible only by designated admin emails)
- Shows flagged/reported content with context
- Actions: approve (publish), reject (remove + notify submitter), ban session/user

### Rate Limiting

| Action | Limit |
|--------|-------|
| Prayer submissions | 5 per hour per session |
| Pray-for actions | 20 per hour per session |
| Encouragement messages | 10 per hour per session |

## Notifications

### In-App

- Bell icon in site header with unread count badge
- Dropdown shows recent notifications, click for full list
- Notification types:
  - "X people prayed for your request" (batched)
  - "You received an encouragement message" (individual)
  - "A prayer you prayed for was answered"
  - "You earned a new badge!"
- Click navigates to relevant prayer/message
- "Mark all as read" button

### Email (opt-in, logged-in users only)

- **Real-time**: email per event, batched (max 1 email per 15 minutes, groups events)
- **Daily digest**: one email at end of day summarizing activity
- **Weekly digest**: one email per week
- **Off**: no emails (default)

**Implementation:**
- Notifications created synchronously (fast DB insert)
- Emails sent asynchronously via Vercel Function after response returns
- Resend free tier: 100 emails/day, 3,000/month
- React Email for templates
- Unsubscribe link in every email

## Prayer Lifecycle

1. **Created**: prayer enters the jar with a 30-day expiration, status = active
2. **Active**: visible to pray-ers, collecting prayers and messages
3. **Answered**: submitter marks it answered with optional testimony, moves to Praise Wall
4. **Renewed**: submitter resets the 30-day expiration (can renew indefinitely)
5. **Expired**: auto-archived after 30 days if not renewed or answered. Not deleted, just no longer served to pray-ers.

Unmanaged prayers (anonymous, no account) auto-expire with no renewal path.

## Group Rooms (Future -- Not in v1)

Not built in v1, but the architecture accommodates it:

- Future `rooms` and `roomMembers` tables
- Prayers table gets optional `roomId` column (null = global jar)
- Service layer prayer queries already filter by context -- adding `roomId` filter is a one-line change
- "Community Builder" badge defined but not awardable until rooms exist

No premature abstractions -- just clean boundaries.

## Additional Features

### Prayer Counter

- Displayed on each prayer request: "7 people have prayed for this"
- Stored as `prayerCount` on the prayer record (incremented on each interaction)

### "Pray with Me" Sharing

- Shareable link per prayer request for friends/family
- Works for logged-in and anonymous visitors

### Urgency Filter

- Requesters can mark a prayer as urgent
- Pray-ers can filter for urgent requests

### Scripture in Guided Moment

- AI-suggested verse displayed during the prayer moment
- Contextually relevant to the prayer content

## Non-Functional Requirements

- **Mobile-responsive**: works well on phones via browser (no native app in v1)
- **Performance**: pages load fast via Server Components, AI calls don't block page renders
- **Privacy**: anonymous users' identities are never exposed, even to admins
- **Accessibility**: semantic HTML, keyboard navigable, screen reader friendly
- **Cost**: architected for free tiers, scales to paid tiers without rewrites
