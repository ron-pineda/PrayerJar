# Morning Email (Daily Verse + Activity) — Design Spec

## Goal

Replace the existing `daily-brief` cron with a redesigned morning email that opens with a verse of the day, shows a personalized activity summary, then presents 3 prayers to pray for — all in one email, no new opt-in required.

## Background

The existing `daily-brief` cron sends 3 random prayers to opted-in users every morning at 7am. It works but is purely outward-facing (pray for others) with no personal re-engagement hook. This redesign folds in a verse of the day and a personal activity summary to make the email more meaningful and drive re-engagement.

Prayer Partners (C) and Group Prayer Rooms (D) are already built. This feature complements them by surfacing activity from those features in the morning email.

---

## Architecture

**New files:**

| File | Responsibility |
|------|---------------|
| `src/lib/verses.ts` | 365 curated `{ text, reference }` objects; exports `getDayVerse(date?: Date)` |
| `src/emails/morning-email.tsx` | React Email template — Designer + Frontend own visual polish |
| `src/app/api/cron/morning-email/route.ts` | Cron handler — auth, DB queries, batch send |

**Deleted files:**

| File | Reason |
|------|--------|
| `src/app/api/cron/daily-brief/route.ts` | Replaced by morning-email cron |
| `src/emails/daily-brief.tsx` | Replaced by morning-email template |

**Updated files:**

| File | Change |
|------|--------|
| `vercel.json` | Replace `daily-brief` entry with `morning-email` at same schedule (`0 7 * * *`) |

**No schema changes.** Uses existing `users.notifyOnDigest`, `users.currentStreak`, `users.quietHoursStart/End/Timezone`, and `prayerInteractions`.

---

## Verse Selection

- `src/lib/verses.ts` exports an array of 365 `{ text: string, reference: string }` objects
- `getDayVerse(date?)` returns `verses[(dayOfYear(date) - 1) % 365]`
- `dayOfYear` = day number 1–365 from Jan 1 of the current year
- Everyone gets the same verse on a given day (shared "word for the day")
- If the array is somehow empty, fall back to a single hardcoded default: `{ text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" }`

---

## Cron Handler (`morning-email/route.ts`)

1. Verify `Authorization: Bearer <CRON_SECRET>` — return 401 if mismatch
2. Select today's verse once: `getDayVerse()`
3. Query all users where `notifyOnDigest = true` AND `email IS NOT NULL`
4. Process in batches of 50 using `Promise.allSettled`
5. Per user:
   a. Skip if `isInQuietHours(user)` — increment `skipped`
   b. Query `prayersReceivedCount`: count of `prayerInteractions` joined to `prayers` where `prayers.userId = user.id` AND `prayerInteractions.createdAt >= yesterday midnight UTC`
   c. Query `encouragementsCount`: same join, additionally filter `prayerInteractions.message IS NOT NULL`
   d. Read `user.currentStreak` (already in the user row from step 3)
   e. Query 3 random active prayers (`prayers.status = 'active'`, `ORDER BY RANDOM()`, `LIMIT 3`) — skip user if 0 returned
   f. Render `MorningEmail` component with verse, activity, and prayers
   g. Send via Resend — increment `sent`
6. Return `NextResponse.json({ sent, skipped })`

---

## Email Template (`morning-email.tsx`)

**Props:**
```typescript
interface MorningEmailProps {
  userName?: string;
  date: string;               // e.g. "Friday, April 18"
  verse: { text: string; reference: string };
  activity: {
    prayersReceived: number;
    encouragements: number;
    streak: number;
  };
  prayers: Array<{
    content: string;
    category: string;
    prayerCount: number;
  }>;
}
```

**Layout (top to bottom):**

1. **Header** — indigo/purple gradient, "Good morning, {name}" + date
2. **Verse of the Day** — lavender background, italic verse text, bold reference. Always shown.
3. **Your Activity Yesterday** — three stat cards (prayers received, encouragements, streak). Section is hidden entirely if all three values are zero. Cards for zero-value stats are individually hidden.
4. **3 Prayers to Pray For** — same card style as current daily-brief. Each prayer card has its own "Pray Now" button linking to `https://prayerjar.org/pray/{category}`. A secondary "Browse all prayers →" link at the bottom points to `https://prayerjar.org/browse`.
5. **Footer** — "You're receiving this because you have morning emails enabled." with unsubscribe link to `/settings/notifications`

Designer + Frontend agents own the visual polish of this template.

---

## Error Handling

- Per-user failures are caught by `Promise.allSettled` — counted as `skipped`, do not stop the batch
- Resend errors are swallowed per-user (logged to Sentry via `captureException` if thrown)
- Missing verse falls back to the hardcoded default
- Cron returns 200 with `{ sent, skipped }` even if some users were skipped

---

## Testing

**Unit — `src/lib/verses.test.ts`:**
- `getDayVerse()` returns an object with non-empty `text` and `reference` for every day 1–365
- No out-of-bounds error on day 365
- Returns the fallback verse when the array is empty

**Integration — `src/app/api/cron/morning-email/route.test.ts`:**
- Follow the pattern in `src/app/api/cron/church-digest/route.test.ts`
- Mock Resend (`resend.emails.send`)
- Seed one test user with `notifyOnDigest = true`, `email = 'test@example.com'`, `currentStreak = 5`
- Seed 3 active prayers
- Seed one `prayerInteraction` on the user's own prayer from yesterday
- Call `GET /api/cron/morning-email` with valid `CRON_SECRET`
- Assert response is `{ sent: 1, skipped: 0 }`
- Assert Resend mock was called once with `to: 'test@example.com'`
- Assert user in quiet hours returns `{ sent: 0, skipped: 1 }`

---

## What's Out of Scope

- Personalized verse selection per user (everyone gets the same verse)
- New opt-in preference (reuses `notifyOnDigest`)
- Verse source API (hardcoded curated list only)
- Per-user send-time optimization (fires for all users at 7am UTC, quiet hours as the only filter)
