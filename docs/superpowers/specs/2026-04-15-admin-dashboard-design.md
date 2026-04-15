# Platform Admin Dashboard — Design Spec

**Date:** 2026-04-15
**Status:** Approved (pending user review of this doc)
**Scope:** Platform-admin only (gated by `ADMIN_EMAILS`). Not church-admin.

---

## 1. Goals

Give the platform owner one place to:
- See if anything urgent needs attention (self-harm flags, harassment reports, contact form messages).
- Audit what the AI moderator is auto-blocking and why.
- Audit what admins (currently just one) have done.
- Read user feedback/contact submissions without losing them in email.
- See basic site health (signups, prayers, churches).

**Non-goals (deferred):**
- Church-admin tooling.
- User-facing appeals workflow.
- Full analytics (cohorts, funnels) — use a real analytics tool later.
- Reply-from-dashboard for contact form — email replies still happen in your normal mail client.

---

## 2. Architecture

### 2.1 Routes

```
/admin                   Overview — stats snapshot + critical-items banner
/admin/queue             Existing reports queue (kept as-is)
/admin/moderation        AI rejections + admin action audit log (filterable)
/admin/feedback          Contact form inbox (read-only + mark-as-read)
```

All routes share `src/app/admin/layout.tsx` with a left-rail nav. Each nav link shows an unread/pending count; the icon turns red only for *critical* items (unresolved self-harm flags, unread harassment reports).

### 2.2 Critical-items banner

`/admin` shows a dismissible banner at the top **only** when at least one of:
- An unresolved `selfHarm` moderation log from the last 24h
- An unresolved `harassment` report
- An unread contact submission older than 24h

Empty state: no banner. The page is otherwise just stat cards.

### 2.3 Stats snapshot (Overview page)

Five cards, each one query:
- Total users / users active in last 7d
- Total prayers / prayers in last 7d
- Total churches signed up
- Pending reports count (unresolved)
- AI rejections in last 7d

No charts. No trends. If we want trends later, add sparklines from the existing tables — no new schema needed.

---

## 3. Database schema

Three new tables in `drizzle/schema.ts`, one migration `00XX_admin_dashboard.sql`.

### 3.1 `moderation_logs`
Logs every `moderateContent` rejection.

| Column            | Type                              | Notes                                          |
|-------------------|-----------------------------------|------------------------------------------------|
| id                | uuid pk                           |                                                |
| user_id           | uuid fk users, nullable           | null for anonymous submissions                 |
| content_type      | enum                              | prayer / testimony / partner_message / group_post / group_meta |
| content_snippet   | text, nullable                    | NULLed after 90 days by cron                   |
| category          | enum                              | selfHarm / spam / harassment / hate / sexual / other |
| ai_confidence     | numeric, nullable                 |                                                |
| source_route      | text                              | e.g. /api/v1/groups/:id/prayers                |
| resolved_at       | timestamp, nullable               | admin acknowledged                             |
| resolved_by       | text, nullable                    | admin email                                    |
| created_at        | timestamp default now             |                                                |

Indexes: `(category, created_at desc)`, `(resolved_at)` partial where null.

### 3.2 `admin_actions`
Audit trail. Kept forever.

| Column        | Type                              | Notes                                            |
|---------------|-----------------------------------|--------------------------------------------------|
| id            | uuid pk                           |                                                  |
| admin_email   | text                              |                                                  |
| action        | enum                              | hide_prayer / unhide_prayer / delete_prayer / resolve_report / dismiss_report / mark_feedback_read / acknowledge_moderation_log / purge_user |
| target_type   | text                              | prayer / report / contact_submission / moderation_log / user |
| target_id     | uuid                              |                                                  |
| notes         | text, nullable                    |                                                  |
| created_at    | timestamp default now             |                                                  |

Index: `(created_at desc)`.

### 3.3 `contact_submissions`
Persisted contact form. Kept forever.

| Column      | Type                | Notes                            |
|-------------|---------------------|----------------------------------|
| id          | uuid pk             |                                  |
| name        | text                |                                  |
| email       | text                |                                  |
| subject     | enum                | matches existing form enum       |
| message     | text                |                                  |
| read_at     | timestamp, nullable |                                  |
| read_by     | text, nullable      | admin email                      |
| created_at  | timestamp default now |                                |

Index: `(read_at)` partial where null, `(created_at desc)`.

### 3.4 Retention

Daily cron at 03:00 UTC (in `vercel.ts`):
```sql
UPDATE moderation_logs
SET content_snippet = NULL
WHERE content_snippet IS NOT NULL
  AND created_at < now() - interval '90 days';
```
Row stays so aggregate stats still work; the sensitive text is gone.

`admin_actions` and `contact_submissions` are never auto-purged.

---

## 4. Security hardening

### 4.1 `requireAdmin()` helper (`src/lib/admin-auth.ts`)
```ts
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  const email = session?.user?.email;
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim()).filter(Boolean);
  if (!email || !allowed.includes(email)) notFound();
  return { email };
}
```
Used by every admin server component and server action. Returns 404 (not redirect) so probes can't tell whether the route exists.

### 4.2 `withAdmin()` API wrapper
```ts
export function withAdmin<T>(
  handler: (req: Request, ctx: { email: string }) => Promise<T>
): (req: Request) => Promise<T | Response> {
  return async (req) => {
    const session = await auth();
    const email = session?.user?.email;
    const allowed = (process.env.ADMIN_EMAILS ?? '')
      .split(',').map(e => e.trim()).filter(Boolean);
    if (!email || !allowed.includes(email)) {
      return new Response('Not Found', { status: 404 });
    }
    return handler(req, { email });
  };
}
```
Every `/api/v1/admin/*` route uses this.

### 4.3 Middleware change (`src/proxy.ts`)
Switch the `/admin/*` non-admin response from `redirect('/sign-in')` to `new NextResponse(null, { status: 404 })`. Disclosure-minimizing.

### 4.4 Startup assertion (`src/lib/env.ts`)
On boot, in production only:
```ts
if (process.env.NODE_ENV === 'production') {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (admins.length === 0) throw new Error('ADMIN_EMAILS must be set in production');
}
```

### 4.5 Rate limit
60 admin actions/min per admin email via existing `checkRateLimit('admin', email)`. Returns 429 on burst.

### 4.6 Audit log
Every admin mutation writes to `admin_actions` *before* the mutation returns success. The mutation and the log row share a transaction where possible.

### 4.7 No client-side gating
All admin checks happen server-side. Admin UI is never rendered (or even sent to client) unless `requireAdmin()` succeeded on the server.

### 4.8 Out of scope (future hardening if a co-admin is added)
- 2FA enforcement on admin sessions
- IP allowlist
- Separate admin subdomain
- Per-action approval workflows

---

## 5. Notifications (hybrid push)

Single helper `src/lib/admin-notify.ts`:
```ts
export async function notifyAdmins(opts: {
  subject: string;
  body: string;       // plain text
  link?: string;      // absolute URL into /admin
}): Promise<void>
```
Fire-and-forget (`.catch(() => {})`). Sends to every email in `ADMIN_EMAILS` via Resend.

**Triggers:**
- `moderateContent` flags `selfHarm` → notify with link to `/admin/moderation?category=selfHarm`
- User submits a report with type `harassment` → notify with link to `/admin/queue`
- New row in `contact_submissions` → notify with link to `/admin/feedback`

No digesting, no dedupe in v1. If volume bites, batch into hourly digest.

---

## 6. Service-layer wiring

### 6.1 `src/services/moderation-log.service.ts`
- `logModerationRejection(input)` — insert row, then if `category === 'selfHarm'` call `notifyAdmins`.
- `listModerationLogs({ category?, resolved?, limit, cursor })` — paginated query.
- `acknowledgeLog(id, adminEmail)` — set `resolved_at`, write `admin_actions` row.

Wire into the **5 existing rejection sites** (no behavior change for users — the 422 still goes back, we just log first):
1. `src/app/actions/lifecycle.actions.ts` — `updatePrayerAction`
2. `src/services/group.service.ts` — `postGroupPrayer`
3. `src/app/api/v1/partner-messages/route.ts`
4. `src/app/api/v1/groups/[id]/route.ts` — PATCH (name + description)
5. Prayer create flow (verify exact path during implementation)

### 6.2 `src/services/contact.service.ts`
- `createContactSubmission(input)` — insert and return the row.
- `listContactSubmissions({ read?, limit, cursor })` — paginated.
- `markContactRead(id, adminEmail)` — set `read_at`, write `admin_actions` row, no notify.

`submitContactAction` (`src/app/actions/contact.actions.ts`) writes to DB **before** Resend so a Resend outage doesn't lose the submission. Also calls `notifyAdmins` after the DB write.

### 6.3 `src/app/actions/admin.actions.ts`
New server actions, each gated by `requireAdmin()` and writing to `admin_actions`:
- `markFeedbackReadAction(id)`
- `acknowledgeModerationLogAction(id)`
- (Existing report resolve/dismiss actions get the audit-log write added)

---

## 7. File plan

### Database Engineer
- `drizzle/schema.ts` — three new tables + enums
- `drizzle/migrations/00XX_admin_dashboard.sql`

### Backend Engineer
- `src/lib/admin-auth.ts` — `requireAdmin`, `withAdmin`
- `src/lib/admin-notify.ts` — `notifyAdmins`
- `src/lib/env.ts` — startup assertion
- `src/services/moderation-log.service.ts`
- `src/services/contact.service.ts`
- 5 existing reject sites — call `logModerationRejection`
- `src/app/actions/contact.actions.ts` — persist before Resend, call `notifyAdmins`
- `src/app/actions/admin.actions.ts` — new actions + audit-log writes on existing
- `vercel.ts` — daily snippet-purge cron
- `src/proxy.ts` — admin 404 instead of redirect

### Frontend Engineer
- `src/app/admin/layout.tsx` — left-rail nav with badge counts
- `src/app/admin/page.tsx` — overview (stat cards + critical banner)
- `src/app/admin/moderation/page.tsx` — combined log view, filterable
- `src/app/admin/feedback/page.tsx` — contact inbox
- Small client components: mark-read buttons, filter controls, banner dismiss

### QA
- Non-admin email gets 404 on every `/admin/*` route and every `/api/v1/admin/*` endpoint
- `requireAdmin` rejects when `ADMIN_EMAILS` is empty
- Production boot fails if `ADMIN_EMAILS` is unset
- Rate limit kicks in at 60/min
- Cron purges `content_snippet` but keeps row
- Push email fires on selfHarm flag (manual)
- Contact submission persists even when Resend errors (mock failure)
- Audit log row is written for every admin mutation

### Reviewer
- No admin route bypasses `requireAdmin`/`withAdmin`
- Every admin mutation writes to `admin_actions`
- No sensitive content leaks to client beyond the 90d window
- No client-side gating

---

## 8. Rollout order

One PR per phase. Each is independently shippable.

1. **Schema + auth helpers + middleware hardening** — `requireAdmin`, `withAdmin`, 404 middleware, startup assertion, three migrations. No UI.
2. **Moderation log wiring** — `logModerationRejection` called from 5 sites. Logging starts.
3. **Contact form persistence** — `createContactSubmission` + write before Resend.
4. **Admin UI** — layout, overview, moderation page, feedback page.
5. **Push notifications** — `notifyAdmins` triggers wired to selfHarm/harassment/contact.

---

## 9. Open risks

- **Resend deliverability for admin notifications** — if Resend silently drops, you miss an urgent flag. Mitigation: dashboard banner is the source of truth; email is the nudge.
- **Audit log write failure mid-mutation** — if the `admin_actions` insert fails after the mutation succeeded, we have an action with no audit row. Mitigation: wrap in transaction where Drizzle supports it; otherwise log the failure to console.error and accept it.
- **Snippet purge cron failure** — if the cron stops running, sensitive content lives past 90d. Mitigation: the cron is idempotent and safe to re-run; add a Vercel cron failure alert later.
- **`ADMIN_EMAILS` getting unset on Vercel** — the startup assertion catches this on next deploy, but if a redeploy never happens the existing instances keep working. Acceptable.
