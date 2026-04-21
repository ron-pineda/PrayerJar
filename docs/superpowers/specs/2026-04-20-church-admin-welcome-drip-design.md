# Church Admin Welcome Drip — Design Spec
**Date:** 2026-04-20
**Status:** Approved for implementation

---

## Problem

Individual users get a 3-email welcome drip (welcome-1/2/3) triggered at signup. Church admins get that same generic sequence, but nothing specific to church setup. A church admin who creates a church and leaves mid-setup receives no nudges to return. The 6-step setup checklist exists in-app but nothing re-engages admins who drop off after creation.

---

## Goal

Send a 3-email behavioral sequence to church admins starting at church creation, driving them to: share their join link → get first members → complete setup. Each email fires only if the admin hasn't already taken the relevant action.

---

## Scope

- **In scope:** church admin drip (3 emails, behavioral conditions, cron extension, migration)
- **Out of scope:** individual user drip changes, Resend template management UI, unsubscribe preference center, A/B testing copy

---

## §1 — Data Model

New table: **`church_admin_drip_status`**

```sql
CREATE TABLE "church_admin_drip_status" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "church_id"       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  "admin_user_id"   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "email1_sent_at"  timestamptz,
  "email2_sent_at"  timestamptz,
  "email3_sent_at"  timestamptz,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  UNIQUE("church_id")
);
CREATE INDEX ON "church_admin_drip_status" ("created_at");
```

One row per church. Created when the church is created. `email1_sent_at` is stamped immediately after send; emails 2 and 3 are stamped by the cron.

Migration: `0032_church_admin_drip_status.sql` via the drizzle pipeline (pj-s22-01).

---

## §2 — Email Templates

Three new React-email templates in `src/emails/`. All sent from `noreply@prayerjar.org`. All include an unsubscribe link. No §7 banned phrases.

### `church-welcome-1.tsx`
- **Trigger:** Immediately at church creation
- **Subject:** "Your church is live on PrayerJar"
- **Body:** Congratulates the admin on creating the church. Explains the join link — members use it to join and start praying. Sets expectation: setup takes 5 minutes, prayer starts flowing once the first member joins.
- **CTA 1 (primary):** "Get your join link" → `/church/[slug]/dashboard/team`
- **CTA 2 (secondary):** "Complete your setup" → `/church/[slug]/setup`

### `church-welcome-2.tsx`
- **Trigger:** Day 3 after church creation, only if `churchMembers` count for this church = 0
- **Subject:** "Your prayer wall is waiting"
- **Body:** Warm nudge — the wall is ready but the admin hasn't invited anyone yet. Walks through: copy join link → share with team → members join → prayers flow. No guilt, just a reminder that the hardest step is the first invite.
- **CTA:** "Share your join link" → `/church/[slug]/dashboard/team`

### `church-welcome-3.tsx`
- **Trigger:** Day 7 after church creation, only if church setup step < 4 (has not reached "Invite Prayer Team")
- **Subject:** "Quick wins before Sunday"
- **Body:** 3 specific, actionable items from the setup checklist the admin hasn't completed yet (branding, welcome message, inviting prayer team). Framed around Sunday readiness — "spend 5 minutes now, walk in Sunday with your prayer community ready."
- **CTA:** "Finish your setup" → `/church/[slug]/setup`

---

## §3 — Trigger Logic

### Email 1 — Church creation trigger

In `src/services/church-platform.service.ts`, at the end of `createChurch()`:

```
1. Insert churchAdminDripStatus row: { churchId, adminUserId, email1SentAt: null }
2. Send church-welcome-1 via Resend (wrapped in try/catch — failure must NOT block church creation)
3. On success: update email1SentAt = now()
```

Same fire-and-forget pattern as the existing `createUser` welcome email in `auth.ts`.

### Emails 2 & 3 — Extend `welcome-drip` cron

File: `src/app/api/cron/welcome-drip/route.ts`

Add a second pass after the existing user-drip logic:

**Email 2 pass:**
```
Query: churchAdminDripStatus WHERE created_at <= now() - 3 days AND email2_sent_at IS NULL
For each row:
  count = SELECT COUNT(*) FROM church_members WHERE church_id = row.church_id AND status = 'active'
  if count = 0:
    send church-welcome-2 to admin_user_id's email
    update email2_sent_at = now()
  else:
    update email2_sent_at = now()  -- skip but stamp so we don't re-check
```

**Email 3 pass:**
```
Query: churchAdminDripStatus WHERE created_at <= now() - 7 days AND email3_sent_at IS NULL
For each row:
  setupStep = derive from church record (see below)
  if setupStep < 4:
    send church-welcome-3 to admin_user_id's email
    update email3_sent_at = now()
  else:
    update email3_sent_at = now()  -- admin completed setup, skip
```

**Setup step derivation:** Inspect how the existing `/church/[slug]/setup/page.tsx` computes the current step. If it's a stored field on `churches`, read it directly. If it's derived (e.g., has branding? has members? etc.), replicate the same logic in the cron. The Backend Engineer must audit the setup page before implementing.

---

## §4 — Testing

| Test | Type |
|---|---|
| `church-welcome-1` renders without error, contains join link | Unit |
| `church-welcome-2` renders without error, contains team CTA | Unit |
| `church-welcome-3` renders without error, contains setup CTA | Unit |
| `createChurch()` → drip row created + email 1 sent (mock Resend) | Integration |
| Church with 0 members at day 3 → email 2 sent | Unit (cron) |
| Church with 1+ members at day 3 → email 2 skipped (stamped) | Unit (cron) |
| Church at setup step ≥ 4 at day 7 → email 3 skipped (stamped) | Unit (cron) |
| Church at setup step < 4 at day 7 → email 3 sent | Unit (cron) |
| Email send failure in createChurch() → church creation succeeds anyway | Unit |

---

## §5 — Agents & Task Breakdown

- **Copywriter:** Write the 3 email template bodies (brand guide §7 sweep required)
- **Frontend/Email Engineer:** Build the 3 React-email templates
- **Backend Engineer:** Migration, drip status table, createChurch() trigger, cron extension
- **QA:** Test plan + execution against unit tests and manual Resend sandbox check
- **Reviewer:** Sprint close

---

## Open Questions

None — all design decisions resolved above.
