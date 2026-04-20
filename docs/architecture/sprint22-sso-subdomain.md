# Sprint 22 — Custom Subdomain Architecture

**Author:** Architect
**Date:** 2026-04-19 (revised 2026-04-20)
**Status:** Approved — Subdomain shipping Sprint 22, SSO deferred

> **Note:** pj-s14-wildcard-subdomains (parked) is superseded by this document and pj-s22-16. pj-s14 should be marked abandoned (done as of 2026-04-20).

## Context

Sprint 22 ships **custom church subdomains** (`takeheart.prayerjar.org`). SSO/SAML has been **deferred** to a future sprint — see §1 for rationale.

**Current state — verified, not assumed:**

- Auth: NextAuth v5 with Drizzle adapter, Google + Resend magic-link providers (`src/lib/auth.ts`).
- Middleware: named `proxy.ts` in Next.js 15/16 (not `middleware.ts`). Today it only does admin-email gating and protected-prefix redirects — no tenant logic.
- Schema: `churches.subdomain text unique`, `churches.slug text unique notnull`, `churchMembers` with role enum. **`churches.subdomain` already exists — no migration needed for the subdomain feature itself.**
- Route groups: `(church)/church/[slug]/...` and `(public)/...`. The pretty path today is `/church/<slug>`.
- Plan gating: `PLANS[tier].features` strings + predicate fns like `hasPastoralDashboard(tier)` in `plans.ts`.

---

## 1. SSO Deferred

SSO/SAML integration is **not shipping in Sprint 22**. There is zero enterprise church demand today, and the engineering cost (5–8 days for WorkOS integration alone) is better spent on subdomain routing and other sprint items.

**WorkOS remains the decision for when SSO ships.** Rationale in brief: the WorkOS Admin Portal eliminates a custom SAML-metadata upload UI (the main cost of self-hosting), SCIM is the same integration surface, and we stay on NextAuth v5 via a Credentials-style exchange — no auth rewrite. At 10 enterprise churches, cost is ~$1,250/mo against ~$1,990+/mo revenue, which is margin-compatible.

Deferred to a future sprint when enterprise church demand materializes.

---

## 2. SSO Data Model Delta — DEFERRED

The following are **not being built in Sprint 22:**

- `tenant_sso_connections` table
- `churches.sso_enabled` column
- `churches.sso_email_domains` column

**Schema clarification:** `churches.subdomain` already exists in the DB schema (verified in `src/db/schema.ts` line 544). No new migration is needed for the subdomain feature itself. The migration for pj-s22-08 is for group tables and is unrelated.

When SSO ships, the data model design from the original doc (WorkOS connection table, JIT provisioning, email-domain fallback discovery) remains the reference. No decisions need to be re-made — just un-defer the work.

---

## 3. SSO Integration Flow — DEFERRED

The full WorkOS SAML flow (Admin Portal setup, webhook activation, IdP redirect, assertion callback, JIT provisioning) is deferred with SSO. See git history for the original design if needed when SSO is revisited.

---

## 4. SSO Tier Gating — DEFERRED

The `hasSso()` predicate is **not added in Sprint 22.** The `enterprise` tier feature copy ("SSO / SAML + SCIM provisioning") will remain "coming soon" until SSO ships.

---

## 5. Subdomain DNS / Vercel Config

**DNS (one-time, manual):**
- Add wildcard `CNAME *.prayerjar.org → cname.vercel-dns.com.` at the registrar.
- Keep apex `prayerjar.org` unchanged.

**Vercel:**
- Add `*.prayerjar.org` as a domain on the project. Vercel provisions a wildcard Let's Encrypt cert automatically (one-time, takes a few minutes on first add).
- **Do not** use the Vercel Domains API for per-church provisioning. Wildcard covers all subdomains with a single cert; adding/removing a church is a database write, not a DNS operation. Per-church Vercel Domains API usage would only matter for bring-your-own-domain (out of scope — see Open Questions).

**Slug-to-subdomain mapping:**
- `churches.subdomain` is **separate from `churches.slug`** and has been from day one (schema confirms). Churches can pick a subdomain different from their slug. If `churches.subdomain IS NULL`, the church does not have a subdomain — they are served exclusively via `/church/<slug>`.
- Validation (already in BrandingForm.tsx): `/^[a-z0-9-]{1,32}$/`. Keep as-is for now; tighten to RFC-1035-safe (no leading/trailing hyphen) in validation before write.

**Reserved subdomains** (matched case-insensitively, rejected at the save step and also blocked at the proxy.ts edge as a defense-in-depth):

```
www, api, app, admin, mail, blog, help, docs, status, support, billing,
auth, sso, scim, assets, cdn, static, staging, dev, preview,
events, wall, partners, giving, embed, wrapped, press, trust, map,
world-prayer, know-jesus, find-a-church, for-churches, contact,
praise-wall, testimony, campaigns, legal, privacy, terms, about,
pray, p, browse, journal, my-prayers, notifications, settings,
badges, notifications, saved-churches, adopted, partner, prayed-for,
profile, error, 404, favicon
```

This list is derived from actual route dirs under `src/app/(public)/` and `src/app/(dashboard)/` — keep it colocated with the validator so adding a new top-level route can't accidentally collide with a church's subdomain.

---

## 6. Subdomain Tenant Resolution in proxy.ts

Today `src/proxy.ts` does two things: admin-email gating on `/admin/*` and redirect to `/sign-in` on protected prefixes.

Add a new first step — **tenant resolution** — before both. This works standalone: no SSO tables are required in the DB.

```
1. Read Host header.
2. If Host matches /^(?<sub>[a-z0-9-]{1,32})\.prayerjar\.org$/i:
     - If sub is in RESERVED set → return 404 (treat as apex miscommunication).
     - Look up churches.subdomain = sub (use Edge-compatible DB or a cached kv lookup
       — Vercel Edge Config or a lightweight in-memory LRU keyed off the subdomain string).
       The lookup must be fast; do not issue a full Neon query on every request.
     - If hit → attach x-pj-church-id header to the request, rewrite URL from
       /<path> to /church/<slug>/<path> internally (so the user's URL stays
       takeheart.prayerjar.org/wall but the route served is /church/takeheart/wall).
     - If miss → 302 to apex with a ?unknown_subdomain=1 banner.
3. Otherwise fall through to existing admin/auth logic.
```

The lookup resolves **church identity only** (church_id, slug). No SSO state is read or forwarded. The `x-pj-sso-required` header from the original design is **eliminated** — it does not exist.

**Cache approach:** use Vercel Edge Config for the subdomain→churchId map. It's <10ms reads at the edge, synced via a `/api/admin/rebuild-subdomain-cache` endpoint invoked on church save. Fallback: in-memory LRU inside the Node runtime (less consistent across regions but acceptable given the small set size).

**Precedence rules if both `/church/<slug>` and a subdomain exist for the same church:**
- Both remain live and functional. This is important for backwards compatibility.
- Canonical URL: use `<link rel="canonical" href="https://<sub>.prayerjar.org/...">` on all pages served from a church that has a subdomain. **No 301 from `/church/<slug>` to subdomain** — every currently-shared link would break, and churches have been sharing `/church/<slug>` URLs for months.
- SEO fold: `rel=canonical` pushes indexation to the subdomain over time without breaking existing links.

---

## 7. Per-Subdomain Auth Model

Each subdomain is a **separate, independent auth surface**. There is no cross-domain session sharing.

1. **Each subdomain is its own auth island.** Signing in on `takeheart.prayerjar.org` produces a session cookie scoped to `takeheart.prayerjar.org` only (host-scoped, not `.prayerjar.org`). That session is invisible to every other host.

2. **Apex is also its own island.** Signing in on `prayerjar.org` produces a session cookie scoped to `prayerjar.org` only. The apex session does not authenticate the user on any subdomain.

3. **No session sharing in either direction.** An apex session does not grant access on a subdomain. A subdomain session does not grant access on the apex or on any sibling subdomain.

4. **Users sign in separately on each surface they use.** This is expected behavior — it matches how most SaaS multi-tenant systems work (e.g., Slack workspaces). A church member who uses both `prayerjar.org` (personal prayers) and `takeheart.prayerjar.org` (church wall) will sign in twice — once per host. This is a known and intentional UX tradeoff.

5. **Existing apex users are completely unaffected.** Their session cookie is host-scoped to `prayerjar.org` and remains unchanged by the subdomain rollout. No forced logout.

6. **The forced-logout problem is eliminated.** The original cross-domain design required changing the NextAuth cookie domain from host-only `prayerjar.org` to `.prayerjar.org` — a one-time forced-logout of every signed-in user. That is entirely avoided by this per-subdomain model. No cookie migration is needed.

7. **Forward-compatibility with SSO.** When SSO ships, the model will be: WorkOS org → subdomain → NextAuth session scoped to that subdomain. The per-subdomain auth surface design is fully forward-compatible with this. SSO will authenticate the user into the subdomain's host-scoped session, exactly as magic-link does today. No rearchitecting needed when SSO is revisited.

---

## 8. Migration / Rollout Plan

Order of shipping, each step independently deployable behind feature flags (`feature_flags` table already exists):

1. **Schema check.** `churches.subdomain` already exists — no migration needed for subdomain itself. Confirm no other schema delta is needed for Sprint 22 subdomain shipping. (The pj-s22-08 migration is for group tables and is independent.)

2. **Wildcard DNS + Vercel domain.** Infra-only, no code. Ron action: add wildcard `CNAME *.prayerjar.org → cname.vercel-dns.com.` and add `*.prayerjar.org` as a Vercel domain on the project. Zero user impact if proxy.ts doesn't route yet.

3. **proxy.ts tenant resolution behind flag `subdomain_routing`.** Flag on for Ron's test church only. Verify rewrites work. No SSO dependencies — lookup is church_id/slug only.

4. **BrandingForm "Claim Subdomain" UI promoted from behind flag.** After flag is verified, promote for eligible churches (see Open Questions on tier floor). Reserved list enforced server-side.

5. **`/for-churches` copy updated** (pj-s22-21) — reflect subdomain as a live feature on the appropriate tier.

There is no forced-logout step. There is no cookie-domain change step. The rollout is clean.

---

## 9. Test Surface

High-value integration tests (not exhaustive):

**Subdomain routing:**
- `takeheart.prayerjar.org/wall` serves the same HTML as `/church/takeheart/wall`.
- Reserved subdomain `www.prayerjar.org` serves a 404, not a church page.
- Unknown subdomain `nonexistent.prayerjar.org` redirects to apex with banner.
- Apex `prayerjar.org` is unchanged by proxy.ts changes.

**Tenant isolation:**
- A session signed in on `takeheart.prayerjar.org` accessing `gracechurch.prayerjar.org/wall` does not see Take Heart data (authz check on `church_members`).
- Prayer wall queries on subdomain-scoped routes filter by `church_id` derived from proxy-injected header, not from user session alone.

**Session isolation (new — required by the per-subdomain auth model):**
- Apex session does not authenticate on any subdomain: a cookie from `prayerjar.org` is not accepted on `takeheart.prayerjar.org`.
- Subdomain session does not authenticate on apex: a cookie from `takeheart.prayerjar.org` is not accepted on `prayerjar.org`.
- Subdomain A session does not authenticate on subdomain B: a cookie from `takeheart.prayerjar.org` is not accepted on `gracechurch.prayerjar.org`.

Most likely to catch regressions: the subdomain cross-tenant isolation tests and the session isolation tests. Tenant-leak bugs and session-bleed bugs are the top two risks in a wildcard-subdomain architecture.

---

## 10. Open Questions

1. **Subdomain tier floor.** Still open. Recommendation: `pro` and above. Makes subdomain a concrete upsell lever for Small Church → Growing Church, and matches the S14 original note. Alternative: `enterprise`-only. **PM to decide — recommend `pro` and above.**

2. **Bring-your-own-domain** (`prayer.takeheart.church` via CNAME). Confirmed deferred to Sprint 23. Vercel Domains API supports it, but it adds cert issuance flow, TXT-record verification UI, and apex-vs-subdomain CNAME ambiguity — out of scope for S22. Network churches have asked for it; "Custom domains coming soon" line on Network tier as placeholder.

3. **SCIM provisioning.** Confirmed deferred with SSO. No Sprint 22 work.

4. **Cookie-domain migration.** RESOLVED — no forced logout needed. Per-subdomain host-scoped cookies require no cookie migration. Existing apex users retain their current session cookie untouched.

5. **Marketing timing.** Still open — when does `/for-churches` update subdomain copy? Recommendation: update at the same time as pj-s22-21 (after flag verified). **Defer to PM coordinating with Growth.**

6. **Finance review of WorkOS IdP cost.** Deferred with SSO — no WorkOS spend in Sprint 22.

---

## Summary of Sprint 22 Subdomain Scope

Sprint 22 ships **subdomain routing only**: wildcard DNS, proxy.ts tenant resolution, Claim Subdomain UI, tier gating, and `/for-churches` copy update. SSO, SCIM, bring-your-own-domain, and WorkOS integration are all deferred. The per-subdomain auth model eliminates the forced-logout that the original cross-domain design required, simplifies cookie handling, and is forward-compatible with SSO when it ships.
