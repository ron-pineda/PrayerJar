# Sprint 17 — Enterprise & Security Posture Audit

**Date:** 2026-04-17
**Reviewer:** Security Agent
**Scope:** What the `for-churches` marketing page (and the Enterprise tier in `plans.ts`) promises vs. what the code actually delivers.

## Executive summary

The **Enterprise tier advertises "SSO / SAML", "Custom subdomain", "SLA", and "Dedicated support"**. Of these, only a subdomain *text field* exists — everything else is marketing. Meanwhile, foundational enterprise-buyer requirements that no tier mentions (audit logs, church-scoped data export, session revocation, DPA, SOC 2) are also missing. **Do not sell Enterprise to anyone who will actually exercise the promises until we close the SSO gap or remove it from the page.**

---

## 1. SSO / SAML — **MISSING**
- `src/lib/auth.ts` registers only Google OAuth and Resend email magic links. No SAML/OIDC provider, no per-tenant IdP config.
- Grep for `SAML`/`OIDC`/`saml` returns zero hits in `src/` (only planning docs and `plans.ts` marketing string).
- **`plans.ts` line 83 promises "SSO / SAML" on Enterprise.** We cannot deliver this today.

## 2. Audit logs — **MISSING**
- No `audit_log`/`activity_log` table in `src/db/schema.ts` (grep: zero matches for `auditLog`/`audit_log`).
- Pastoral actions (flag review, testimony approval, member removal at `church-platform.service.ts:149`, branding change) write no audit record — enterprise buyers require "who did what, when" before they sign.

## 3. Data export — **PARTIAL (user-level only)**
- `src/services/export.service.ts` + `src/app/api/v1/export/route.ts` export **the signed-in user's own data** as JSON. Good for personal GDPR right-of-access.
- **No church-admin export.** A church admin cannot self-service download all prayers, members, notes, flags for their church. This will block every enterprise procurement checklist.

## 4. Access controls — **PARTIAL**
- `church_member_role` enum = `admin | pastor | member` (`schema.ts:529`). Role checks exist (e.g. `branding/route.ts:36–42`).
- **Gap:** the `prayers` table (`schema.ts:84`) has no `visibility`/`scope` column. The "Private church wall" claim relies entirely on filtering by `churchId` at query time (`church-platform.service.ts:185–190`) plus a membership check at the wall page (`wall/page.tsx:42–59`). A single missing `WHERE church_id = ...` on any new endpoint leaks private prayers to the public feed.
- No row-level security in Postgres — enforcement is 100% application-layer.
- `groupRole` enum also exists (`owner | member`) — consistent model.

## 5. Subdomain isolation — **COSMETIC ONLY**
- `churches.subdomain` is a `text().unique()` column (`schema.ts:537`) written by `PUT /api/v1/church/[slug]/branding` (`branding/route.ts:65`). There is no middleware, no DNS wiring, no host-based routing — Grep for `middleware.ts` finds none in the project root or `src/`.
- All church data sits in a **shared multi-tenant Postgres** with no schema- or row-level-isolation boundary. Marketing says "Custom subdomain" (true, eventually) and elsewhere implies "your tool, not a third-party platform" — procurement will read this as logical isolation. Today it is a vanity label only.

## 6. Secrets & infra — **MOSTLY BUILT**
- **Security headers:** HSTS `max-age=63072000; includeSubDomains; preload`, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy set (`next.config.ts:5–32`). Solid.
- **HTTPS:** forced by Vercel platform + HSTS.
- **Cookies:** NextAuth defaults (Secure + httpOnly in prod). `auth.ts` sets no custom cookie options; DB-session strategy is used (sessionsTable supplied to DrizzleAdapter) — sessions are server-revocable in principle.
- **CSRF:** NextAuth provides it on its own routes. Server actions inherit Next 16's built-in origin checks. No extra library.
- **Rate limiting:** `src/lib/rate-limit.ts` has DB-backed limits for submit/pray/message/report/contact/church_search/church_claim/admin. **No limit on the auth magic-link / sign-in endpoint** — a user email can be spammed to send verification emails until Resend's own quota kicks in.
- **Sentry:** correct split — `NEXT_PUBLIC_SENTRY_DSN` client, `SENTRY_DSN` server, `SENTRY_AUTH_TOKEN` build-time only (`sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.ts`). Replay masks all text + blocks media. Good.
- **Env guards:** `src/lib/env.ts` asserts `ADMIN_EMAILS` in production.

## 7. Session invalidation on staff removal — **MISSING**
- `removeChurchMember` (`church-platform.service.ts:149`) deletes the `church_members` row only.
- It does **not** delete the user's rows from the `sessions` table. Because role is re-checked per request via `getChurchMembers(...)`, a dismissed staffer's dashboard *should* fail authorization on the next request — BUT any client they left open with pre-rendered data (pastoral notes, flagged prayers, member lists) is already exposed, and there is no force-logout. Revocation should also invalidate sessions and tombstone any cached SSE streams.

## 8. SOC 2 / ISO readiness — **NOT STARTED**
- No DPA template, no privacy-impact doc, no subprocessor list, no incident-response runbook under `docs/security/` (directory did not exist before this report).
- No vulnerability-disclosure policy, no `SECURITY.md`.
- No vendor inventory (Vercel, Neon/Postgres, Stripe, Resend, Google OAuth, Google Places, Sentry, OpenAI) with data-flow mapping.
- Backups/retention policy not documented.

---

## Marketing claims we cannot back up today

| Claim on `/for-churches` or `plans.ts` | Status |
|---|---|
| Enterprise: **SSO / SAML** | Not built — **remove or fix before Sprint 17 ships.** |
| Enterprise: **SLA** | No published SLA document, no uptime monitoring alert threshold, no credit policy. |
| Enterprise: **Dedicated support** | No ticketing, no contact-routing — same `mailto:hello@prayerjar.org` as everyone else. |
| Enterprise: **Custom subdomain** | Column exists; no host routing. Works as a label only. |
| "Private Prayer Wall — separate from the public feed" | Enforced app-side only. No DB-level isolation; one buggy query leaks it. |

---

## Tasks to add to Sprint 17

**CRITICAL (block marketing)**
- `s17-sec-01` — Remove "SSO / SAML" from `plans.ts` Enterprise features **or** scope an OIDC-per-tenant build. Cannot ship the page with current copy.
- `s17-sec-02` — Replace "SLA" with "Custom agreement available" until a real SLA doc exists in `docs/legal/`.
- `s17-sec-03` — Replace "Custom subdomain" with "Custom subdomain (coming soon)" or implement host-based routing in `middleware.ts`.

**HIGH (block enterprise deals)**
- `s17-sec-04` — Add `audit_logs` table + helper, wire it into pastoral actions (flag review, testimony approval, member remove, branding change, welcome message edit, assignment changes).
- `s17-sec-05` — Church-scoped data export endpoint (`GET /api/v1/church/[slug]/export`, admin-only) returning prayers, members, notes, flags, assignments.
- `s17-sec-06` — DPA + subprocessor list + privacy-impact summary in `docs/legal/`. Required for any church with >1 paid staff.
- `s17-sec-07` — On `removeChurchMember`, also delete affected `sessions` rows for that user-scope OR bump a `session_version` to force re-auth.

**MEDIUM (hygiene)**
- `s17-sec-08` — Rate-limit the sign-in email endpoint (`/api/auth/signin/resend`) — add `signin_email` window (e.g. 5/hour per email + 20/hour per IP) to `rate-limit.ts`.
- `s17-sec-09` — Add a `visibility` column to `prayers` (`public | church | group`) and enforce at the service layer so a missed `WHERE church_id` cannot leak.
- `s17-sec-10` — Publish `SECURITY.md` with disclosure policy + `security@prayerjar.org` alias.
- `s17-sec-11` — Document backup/retention policy for Postgres, uploads, Sentry PII scrubbing config.

## What was NOT reviewed
- Stripe webhook signature verification (out of scope; spot-checked presence only).
- Upload endpoints' MIME/size validation.
- SSE/push-subscription authorization boundaries.
- XSS on user-generated prayer content rendering.
- Admin-console routes under `/api/v1/admin/*`.
Schedule a full `security-review` pass on these before the next enterprise deal.
