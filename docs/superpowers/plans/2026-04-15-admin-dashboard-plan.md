# Platform Admin Dashboard — Implementation Plan

**Date:** 2026-04-15
**Author:** Architect
**Spec:** `docs/superpowers/specs/2026-04-15-admin-dashboard-design.md`
**Sprint:** 13 (new — Sprint 12 remains in-flight)
**Status:** Proposed — awaiting PM approval before engineer handoff

---

## Spec deviations (please review before engineers start)

The spec is largely accurate, but a few concrete paths and counts drifted from the actual codebase. These do **not** change the spec's intent, only the file list; please confirm and I will update the spec after approval.

1. **Directory paths — `drizzle/` vs `src/db/`.** The spec repeatedly references `drizzle/schema.ts` and `drizzle/migrations/00XX_admin_dashboard.sql`. The project actually stores schema at `src/db/schema.ts` and migrations at `src/db/migrations/` (confirmed by `drizzle.config.ts`). The next sequential migration file will be `0025_admin_dashboard.sql` (last applied is `0024_zippy_rockslide.sql`). This plan uses the real paths.

2. **Cron configuration file — `vercel.ts` does not exist.** Vercel crons in this project are declared in `vercel.json` (9 existing entries). The daily snippet-purge cron should be added there, pointing at a new route such as `src/app/api/cron/purge-moderation-snippets/route.ts`. Plan uses this pattern.

3. **Middleware file — `src/middleware.ts` does not exist.** The middleware lives at `src/proxy.ts` (as spec notes) and is wired via `next.config.ts` / Next 16's proxy option. The 404-instead-of-redirect change applies to `src/proxy.ts` — confirmed.

4. **Existing `requireAdmin` and `admin.actions.ts` already exist.** `src/app/actions/admin.actions.ts` (33 lines, three actions: approveReport/rejectContent/dismissReport) and an inline `requireAdmin()` inside it already exist. Phase 1 must extract the helper to `src/lib/admin-auth.ts`, switch failure mode from `throw new Error('Unauthorized')` to `notFound()`, and refactor existing actions to (a) call the extracted helper and (b) write an `admin_actions` audit row.

5. **`src/app/actions/contact.actions.ts` already exists** (untracked in git, 60 lines). Spec says "persist before Resend" — Phase 3 modifies existing file, does not create new one.

6. **`src/lib/env.ts` does not exist.** Plan creates it new as spec directs. Alternatively we could put the startup assertion in `src/db/index.ts` or `src/lib/auth.ts` (both are import-graph roots). Recommendation: create `src/lib/env.ts` and import it from `src/lib/auth.ts` (always imported at boot).

7. **Moderation rejection sites — spec lists 5, codebase has 7.** Verified via `grep moderateContent src/` for production (non-test) call sites:

   | # | File | Function | Spec? |
   |---|------|----------|-------|
   | 1 | `src/app/actions/lifecycle.actions.ts:101` | `updatePrayerAction` | yes |
   | 2 | `src/services/group.service.ts:246` | `postGroupPrayer` | yes |
   | 3 | `src/app/api/v1/partner-messages/route.ts:98` | POST partner message | yes |
   | 4 | `src/app/api/v1/groups/[id]/route.ts:24` | PATCH group name | yes |
   | 4b | `src/app/api/v1/groups/[id]/route.ts:30` | PATCH group description | yes (same file, two moderations) |
   | 5 | **`src/services/prayer.service.ts:28`** | **`createPrayer`** | **this is the "prayer create flow" the spec flagged for verification** |
   | 6 | `src/services/interaction.service.ts:27` | `prayForRequest` (when a message is attached) | **MISSING from spec** |
   | 7 | `src/services/church.service.ts:288` | `submitChurchRecommendation` (note field) | **MISSING from spec** |

   **Recommendation:** wire `logModerationRejection` into all 7 sites in Phase 2. Sites 6 and 7 are behaviorally identical to the listed 5 (silent 422-style rejection). Content types in use need two additions to the enum: `church_note` and `interaction_message`.

8. **`content_type` enum gap.** Spec enumerates `prayer / testimony / partner_message / group_post / group_meta`. Proposed additions: `interaction_message` (site 6) and `church_note` (site 7). `testimony` is not a current rejection site — leave in the enum for future-proofing.

**Open questions for the user before Phase 2 begins:**
- (Q1) Confirm we add the 2 missing sites to Phase 2's rejection-logging scope.
- (Q2) Confirm `content_type` enum additions above.
- (Q3) Should the snippet-purge cron live at `/api/cron/purge-moderation-snippets`? (convention match with the other 9 crons.)

---

## Phase overview

Each phase is one PR, independently shippable, merged in order. Phases 1–3 ship **without** user-visible changes. Phase 4 lights up the UI. Phase 5 wires notifications last to avoid email noise during dev.

| Phase | PR theme | Primary agent(s) | Dependencies |
|-------|----------|------------------|--------------|
| 1 | Schema + auth helpers + middleware hardening | Database + Backend | none |
| 2 | Moderation log wiring (7 sites) | Backend | Phase 1 |
| 3 | Contact form persistence | Backend | Phase 1 |
| 4 | Admin UI (layout, overview, moderation, feedback) | Frontend | Phases 1–3 |
| 5 | Push notifications (selfHarm / harassment / contact) | Backend | Phases 2–3 |

---

## Phase 1 — Schema + auth helpers + middleware hardening

**Goal:** Ship the foundation with zero user-visible change. New tables, admin-auth helpers, 404-not-redirect middleware, startup assertion.

### Parallelizable subtasks

**1A (Database Engineer) — parallel with 1B, 1C.** Add three tables to `src/db/schema.ts`:
- `moderationLogs` with enums `moderationContentType`, `moderationCategory`
- `adminActions` with enum `adminActionType`
- `contactSubmissions` with enum `contactSubject` (must match existing Zod enum in `contact.actions.ts`: General / Church Partnership / Feedback / Bug Report / Other)
- Indexes per spec §3.1–3.3 (including partial indexes where `resolved_at IS NULL` / `read_at IS NULL`)
- Generate migration `src/db/migrations/0025_admin_dashboard.sql` via `drizzle-kit generate`
- Do **not** modify retention cron in this phase — Phase 1 is schema only.

**1B (Backend Engineer) — parallel with 1A, 1C.** Admin auth primitives:
- `src/lib/admin-auth.ts` (new) — export `requireAdmin()` (uses `notFound()`) and `withAdmin()` API wrapper. Both parse `ADMIN_EMAILS` comma-separated.
- `src/lib/env.ts` (new) — production-only startup assertion on `ADMIN_EMAILS`. Import side-effect-only from `src/lib/auth.ts`.
- Refactor `src/app/actions/admin.actions.ts` — replace inline `requireAdmin()` with the new import. Failure behavior becomes `notFound()`.

**1C (Backend Engineer) — parallel with 1A, 1B.** Middleware hardening:
- `src/proxy.ts` — change the non-admin branch from `NextResponse.redirect('/sign-in')` to `new NextResponse(null, { status: 404 })`. Keep non-auth protected-prefix redirect unchanged.
- Add `admin` window to `src/lib/rate-limit.ts` (limit 60, windowMs 60_000). Export a helper used by admin actions in Phase 2+.

### Definition of Done (Phase 1)
- Migration runs cleanly on Neon (verified via `drizzle-kit push` against dev DB by DB Engineer, then checked into repo).
- `npm run build` passes; existing `/admin/queue` still loads for admin; non-admin gets 404 on `/admin/queue` (not a `/sign-in` redirect).
- No new routes; no UI; no moderation sites changed yet.
- Reviewer confirms: no admin-bypassable surface introduced, `requireAdmin` used by every existing admin action, 404 payload is an empty body.

### Test plan (Phase 1 — QA)
- `/admin/queue` with non-admin email → 404 (body empty), not a redirect.
- `/admin/queue` with admin email → still loads (regression check).
- Unit: `requireAdmin()` with empty `ADMIN_EMAILS` throws/`notFound()` for any email, including a real admin.
- Unit: `requireAdmin()` parses `"a@x.com, b@y.com"` (whitespace tolerance).
- Unit: `withAdmin()` returns `Response(404)` for non-admin, passes through otherwise.
- Start app with `NODE_ENV=production` and `ADMIN_EMAILS=""` → boot throws. Same in dev → boot succeeds.
- Drizzle migration inspect: 3 tables, 4 enums, 5 indexes (2 partial).

### Risks
- **Breaking existing `/admin/queue`** — the refactor in 1B changes error semantics (`throw` → `notFound()`). QA must regression-test the existing queue page.
- **Startup assertion in the wrong import graph** — if `src/lib/env.ts` is tree-shaken out of production, the guard never runs. Import it from `src/lib/auth.ts` (guaranteed loaded at boot) as a bare side-effect import.

### Files (Phase 1)

Database Engineer:
- `src/db/schema.ts` (edit)
- `src/db/migrations/0025_admin_dashboard.sql` (new, generated)
- `src/db/migrations/meta/_journal.json` (auto-updated)

Backend Engineer:
- `src/lib/admin-auth.ts` (new)
- `src/lib/env.ts` (new)
- `src/lib/auth.ts` (edit — add side-effect import of env.ts)
- `src/app/actions/admin.actions.ts` (edit — use extracted requireAdmin)
- `src/proxy.ts` (edit — 404 instead of redirect)
- `src/lib/rate-limit.ts` (edit — add `admin` window)

---

## Phase 2 — Moderation log wiring

**Goal:** Every content rejection writes a `moderation_logs` row before the 422 returns. No user-visible change. Phase 5 layers notifications on top — **do not** add notifications in Phase 2.

### Subtasks (mostly sequential within Backend; the service is shared)

**2A (Backend Engineer).** New service `src/services/moderation-log.service.ts` exporting:
- `logModerationRejection(input)` — insert row; no notify in v1 of this service (Phase 5 adds it).
- `listModerationLogs({ category?, resolved?, limit, cursor })` — for Phase 4's page.
- `acknowledgeLog(id, adminEmail)` — sets `resolved_at`, writes `admin_actions` row in the same transaction (or pair of awaits with error logging, per spec §9).

**2B (Backend Engineer).** Wire `logModerationRejection` into all **7** rejection sites (pending user confirmation on Q1/Q2). Each call site must:
- Pass `userId` (or `null` for unauthenticated / anonymous prayer flows).
- Pass `sourceRoute` as a stable string matching the route/action name.
- Pass `contentType` per the enum.
- Pass `category` = `moderation.selfHarm ? 'selfHarm' : (moderation.reason ?? 'other')` — the existing `moderateContent` returns a narrow signal; map conservatively.
- **Log before throwing**, wrapped in a try/catch that `console.error`s and swallows — a failed log must not change the user-facing 422.

Concrete site changes:
1. `src/app/actions/lifecycle.actions.ts` — `updatePrayerAction` (`prayer`, route `actions/lifecycle.updatePrayer`)
2. `src/services/group.service.ts` `postGroupPrayer` (`group_post`, route `services/group.postGroupPrayer`)
3. `src/app/api/v1/partner-messages/route.ts` POST (`partner_message`, route `/api/v1/partner-messages`)
4a. `src/app/api/v1/groups/[id]/route.ts` PATCH name (`group_meta`, route `/api/v1/groups/[id]#name`)
4b. `src/app/api/v1/groups/[id]/route.ts` PATCH description (`group_meta`, route `/api/v1/groups/[id]#description`)
5. `src/services/prayer.service.ts` `createPrayer` (`prayer`, route `services/prayer.createPrayer`)
6. `src/services/interaction.service.ts` `prayForRequest` (`interaction_message`, route `services/interaction.prayForRequest`)
7. `src/services/church.service.ts` `submitChurchRecommendation` (`church_note`, route `services/church.submitChurchRecommendation`)

**2C (Backend Engineer).** Add the daily retention cron:
- `src/app/api/cron/purge-moderation-snippets/route.ts` — runs the `UPDATE … SET content_snippet = NULL WHERE created_at < now() - interval '90 days'` statement. Gate on `CRON_SECRET` header per existing cron pattern.
- `vercel.json` — add entry `{ path: "/api/cron/purge-moderation-snippets", schedule: "0 3 * * *" }`.

### Definition of Done (Phase 2)
- Manual test: submit a prayer with banned content → 422 still returned AND one row in `moderation_logs` with correct `content_type`, `source_route`, `category`, `content_snippet` populated.
- All 7 sites instrumented and unit-tested at service layer (mock `logModerationRejection`, assert called with expected args when moderation fails).
- Cron route returns 200 locally and purges >90d rows in a seeded test.
- No change to user-visible behavior (regression test: happy paths still work).

### Test plan (Phase 2 — QA)
- For each of the 7 sites: craft a rejection and verify a log row appears with correct category/route/contentType/userId/snippet.
- For site 3 (anonymous prayer) verify `user_id IS NULL` is accepted.
- Rate-limit behavior unchanged (rejections still count? — keep existing behavior, do not add rate-limit short-circuits).
- Cron: seed 5 rows >90d old with snippets, run cron, confirm snippets set to NULL, rows remain.
- DB failure simulation: force `logModerationRejection` to throw (mock `db.insert` failure); original 422 still returns.

### Risks
- **Hidden rejection sites.** If there is an 8th site we missed, silent gap. Mitigation: pre-Phase-2, Backend runs the `grep moderateContent src/` one more time and confirms the 7 listed are exhaustive (plus any added since 2026-04-15).
- **Transaction semantics in `acknowledgeLog`.** Drizzle transaction support on Neon HTTP driver is limited; document fallback (two awaits + console.error) per spec §9.
- **Snippet length explosion.** `content_snippet` is `text`; store the full user input. Acceptable until Phase 4 truncates on display. Add index only on `(category, created_at desc)` — not on `content_snippet`.

### Files (Phase 2)

Backend Engineer:
- `src/services/moderation-log.service.ts` (new)
- `src/app/actions/lifecycle.actions.ts` (edit)
- `src/services/group.service.ts` (edit)
- `src/app/api/v1/partner-messages/route.ts` (edit)
- `src/app/api/v1/groups/[id]/route.ts` (edit)
- `src/services/prayer.service.ts` (edit)
- `src/services/interaction.service.ts` (edit)
- `src/services/church.service.ts` (edit)
- `src/app/api/cron/purge-moderation-snippets/route.ts` (new)
- `vercel.json` (edit — add cron entry)

---

## Phase 3 — Contact form persistence

**Goal:** Contact submissions survive Resend outages. Still no UI.

### Subtasks (Backend only)

**3A.** `src/services/contact.service.ts` (new) — `createContactSubmission`, `listContactSubmissions`, `markContactRead`. `markContactRead` writes an `admin_actions` row.

**3B.** Edit `src/app/actions/contact.actions.ts`:
- DB write first (`createContactSubmission`).
- Then Resend send, wrapped in try/catch that logs but does not fail the action (since we already persisted).
- No `notifyAdmins` yet — Phase 5 adds it.

### Definition of Done (Phase 3)
- Submitting the contact form persists a `contact_submissions` row.
- Resend can be force-failed (mock `process.env.AUTH_RESEND_KEY` to invalid) and the action still returns `{ success: true }` and the row is present.
- Zod schema in the action still matches the enum in `contact_submissions.subject`.

### Test plan (Phase 3 — QA)
- Submit valid form → row exists, email sent.
- Submit with mocked Resend failure → row exists, action returns success (not error), `console.error` logged.
- Zod validation still returns per-field errors as before (regression).
- Rate limit still enforced at 3/hour per IP.

### Risks
- **Enum drift.** The Zod subject enum and the DB enum must stay in lockstep. Mitigation: define both from a single TS constant exported from the schema file and imported by the action.
- **Silent failures for existing monitoring.** If Resend was the only signal that contact forms arrive, now operators may miss broken email. Mitigation: Phase 5 wires `notifyAdmins` for every new contact submission.

### Files (Phase 3)

Backend Engineer:
- `src/services/contact.service.ts` (new)
- `src/app/actions/contact.actions.ts` (edit)
- `src/db/schema.ts` (edit — if Zod enum needs to move next to DB enum)

---

## Phase 4 — Admin UI

**Goal:** Light up the four routes. Every page server-gated by `requireAdmin()`.

### Subtasks (mostly Frontend; one Backend assist)

**4A (Backend Engineer) — small, parallel with 4B–4E.** Read-side helpers for the UI:
- `getOverviewStats()` — 5 counts for the Overview page (see spec §2.3). Add to `src/services/admin-stats.service.ts` (new).
- `getCriticalItems()` — checks for unresolved selfHarm log in last 24h, unresolved harassment report, unread contact >24h. Returns typed banner payload.
- Extend `contact.service.ts` and `moderation-log.service.ts` with the list queries used by Phase 4 pages (if not already added in 2A / 3A).
- New server actions in `src/app/actions/admin.actions.ts`:
  - `markFeedbackReadAction(id)`
  - `acknowledgeModerationLogAction(id)`
  - Both gated by `requireAdmin()`, both write `admin_actions`, both use the `admin` rate-limit window.

**4B (Frontend Engineer).** `src/app/admin/layout.tsx` (new) — left-rail nav. Server component that calls `requireAdmin()` once; children inherit the guarantee. Nav link count badges come from a small server fetch; red "critical" icon driven by `getCriticalItems()`.

**4C (Frontend Engineer).** `src/app/admin/page.tsx` (new) — Overview. Five stat cards + dismissible banner (client component for dismiss state, but banner content is server-rendered).

**4D (Frontend Engineer).** `src/app/admin/moderation/page.tsx` (new) — combined log view. Query-string filters (`?category=selfHarm&resolved=false`). Table with content snippet, category, route, user (email if present), created_at, "acknowledge" button → calls `acknowledgeModerationLogAction`.

**4E (Frontend Engineer).** `src/app/admin/feedback/page.tsx` (new) — contact inbox. List sorted by unread-first then recency. Mark-as-read action. No reply UI per spec.

**4F (Frontend Engineer).** Small client components in `src/components/admin/`:
- `mark-read-button.tsx`
- `acknowledge-log-button.tsx`
- `moderation-filters.tsx`
- `critical-banner.tsx` (dismiss state held in localStorage keyed by banner-hash)

### Definition of Done (Phase 4)
- All four routes render for an admin, 404 for non-admin (middleware + server check both).
- Banner appears only when criteria met (spec §2.2).
- All three mutating actions write to `admin_actions` and respect the `admin` rate limit.
- No client-side secret-holding, no admin email leaked into client bundle.

### Test plan (Phase 4 — QA)
- Non-admin probes every route and admin API: 404 on all.
- Admin loads every page, stat cards populate, banner appears/disappears per seed data.
- Mark-read and acknowledge-log actions: row updated, `admin_actions` row written, UI refreshes.
- Rate limit: 61st admin action within a minute returns 429.
- Verify page source (view-source) for `/` and `/sign-in` does not contain any `/admin` references (no accidental link leakage).
- Lighthouse/PSI not required; just verify no obvious regressions in bundle size.

### Risks
- **Next 16 App Router specifics** — `notFound()` inside a layout affects all children, good. But route handlers using `withAdmin` need their own 404 since middleware doesn't match `/api`. Mitigation: `withAdmin` already returns a `Response`, and middleware `matcher` already excludes `api`. Verified.
- **Action-based state invalidation** — `revalidatePath('/admin/...')` must be called after every mutation or stats go stale. Add this to a shared helper used by all admin actions.
- **Badge counts causing N+1** — layout fetches counts on every admin page load. Acceptable at this volume; revisit with cached query if admin-UX becomes slow.

### Files (Phase 4)

Backend Engineer:
- `src/services/admin-stats.service.ts` (new)
- `src/app/actions/admin.actions.ts` (edit — new actions + audit-log writes for existing three)

Frontend Engineer:
- `src/app/admin/layout.tsx` (new)
- `src/app/admin/page.tsx` (new)
- `src/app/admin/moderation/page.tsx` (new)
- `src/app/admin/feedback/page.tsx` (new)
- `src/components/admin/mark-read-button.tsx` (new)
- `src/components/admin/acknowledge-log-button.tsx` (new)
- `src/components/admin/moderation-filters.tsx` (new)
- `src/components/admin/critical-banner.tsx` (new)

---

## Phase 5 — Push notifications

**Goal:** Email the platform admin(s) on urgent events. Last to ship so prior phases are already visible in-dashboard.

### Subtasks (Backend only)

**5A.** `src/lib/admin-notify.ts` (new) — `notifyAdmins({ subject, body, link? })`. Uses Resend. Fire-and-forget. Sends to each email in `ADMIN_EMAILS`.

**5B.** Wire triggers:
- `src/services/moderation-log.service.ts` — inside `logModerationRejection`, if `category === 'selfHarm'`, call `notifyAdmins` (post-insert, non-blocking).
- `src/services/report.service.ts` (or wherever reports are created — verify path in Phase 5 kick-off) — when a report with type `harassment` is inserted, call `notifyAdmins`.
- `src/app/actions/contact.actions.ts` — after the DB write, call `notifyAdmins` (post-Resend, same try/catch).

### Definition of Done (Phase 5)
- Manual test of each trigger sends to every `ADMIN_EMAILS` entry.
- If Resend fails, the originating action still succeeds (fire-and-forget confirmed).
- Non-trigger categories (e.g., `spam`) do **not** page.

### Test plan (Phase 5 — QA)
- Trigger each of the 3 paths with a test admin email; verify Resend log.
- Force Resend failure; verify originating action returns success.
- Verify no digest or dedupe in v1 — two selfHarm flags 10s apart send two emails.

### Risks
- **Email fatigue / Resend quota.** If selfHarm rate is non-trivial, admins may be flooded. Mitigation: spec explicitly defers digesting; add hourly digest if volume bites.
- **PII in email body.** Do not include raw `content_snippet` in the email — only category + link to `/admin/moderation`. The dashboard is the only place sensitive content is rendered.

### Files (Phase 5)

Backend Engineer:
- `src/lib/admin-notify.ts` (new)
- `src/services/moderation-log.service.ts` (edit)
- `src/services/report.service.ts` (edit — or adjacent; verify)
- `src/app/actions/contact.actions.ts` (edit)

---

## Cross-phase DoD & conventions

- Every admin mutation writes one `admin_actions` row **before** returning success.
- Every admin page component starts with `const { email } = await requireAdmin();`.
- Every `/api/v1/admin/*` route (if introduced — not required by current spec) uses `withAdmin()`.
- Rate limit: use the new `admin` window, keyed by admin email.
- Next 16 note: App Router server components must use `notFound()` from `next/navigation`, and we avoid rendering any admin-conditional JSX before the await resolves.

## Recommended kickoff

**Phase 1, 1A (Database Engineer) — start first.** Produce the schema diff and the generated migration `0025_admin_dashboard.sql` as the first PR patch so 1B and 1C can review enum names. 1B and 1C can proceed in parallel immediately after 1A pushes the schema stub.

PM sign-off needed on: (a) the 7-site moderation wiring scope (Q1/Q2 above), (b) the cron route path (Q3), (c) promoting these tasks from `proposed` to `approved`.
