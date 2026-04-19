# Sprint 22 — SSO/SAML + Custom Subdomain Architecture

**Author:** Architect
**Date:** 2026-04-19
**Status:** Proposed — awaiting PM/Ron sign-off on Open Questions before engineering handoff

## Context

Two Sprint 22 features block large-church (500+ member) marketing:

1. **SSO/SAML** — currently "coming soon" copy in `src/lib/plans.ts` (enterprise tier features list). No implementation.
2. **Custom subdomain** — `churches.subdomain` column already exists (`src/db/schema.ts` line 544) and BrandingForm collects the value, but `src/proxy.ts` does no tenant resolution. Task `pj-s14-wildcard-subdomains` is parked; Ron wants it un-parked.

Both are covered here because they share integration points (session cookies, tenant discovery for SSO).

**Current state — verified, not assumed:**

- Auth: NextAuth v5 with Drizzle adapter, Google + Resend magic-link providers (`src/lib/auth.ts`).
- Middleware: named `proxy.ts` in Next.js 15/16 (not `middleware.ts`). Today it only does admin-email gating and protected-prefix redirects — no tenant logic.
- Schema: `churches.subdomain text unique`, `churches.slug text unique notnull`, `churchMembers` with role enum.
- Route groups: `(church)/church/[slug]/...` and `(public)/...`. The pretty path today is `/church/<slug>`.
- Plan gating: `PLANS[tier].features` strings + predicate fns like `hasPastoralDashboard(tier)` in `plans.ts`.

---

## 1. SSO Decision Table

| Option | SAML | SCIM | Setup burden on church IT | Cost at our scale (≤30 enterprise churches in Y1) | Time to integrate | Vendor risk | Fits NextAuth v5 |
|---|---|---|---|---|---|---|---|
| **WorkOS** | Yes | Yes | Low — embeddable Admin Portal, self-serve IdP config | $125/connection/mo up to 15, $100 16–30 (no free tier as of 2026) — see note below | 5–8 eng days | Low — well-funded, SSO-first | Yes — SDK + Credentials provider |
| **Auth0 Enterprise** | Yes | Yes | Medium — Auth0-branded tenant flow | B2B plan starts ~$800/mo + per-connection — higher floor | 6–10 eng days (also need to reconcile with NextAuth) | Medium — Okta pricing moves aggressively | Partial — typically replaces NextAuth |
| **Clerk Enterprise** | Yes | Yes | Low | Clerk Pro + B2B add-on, ~$100 base + per-org | 15–25 eng days — **replaces NextAuth entirely** | Medium — lock-in | **No — rewrite, not addition** |
| **NextAuth + custom SAML provider** | Yes via `@node-saml/passport-saml` | No (would build) | High — we build admin UI to upload IdP metadata | ~$0 | 12–20 eng days + ongoing maintenance | None | Yes |
| **Ory / self-host BoxyHQ SAML Jackson** | Yes | Yes | Medium | Infra cost + ops | 10–15 eng days | Medium — BoxyHQ was acquired by Ory in 2025, OSS roadmap unclear | Yes via OIDC bridge |

**Decision: WorkOS.**

Justification:
- Admin Portal means **we don't build a SAML metadata upload UI** — WorkOS hosts that, embedded via an iframe/redirect, and the church's IT admin self-configures against Okta/Entra/Google Workspace. For large churches this is the difference between a 30-minute onboarding and a 2-week support ticket.
- SCIM is the same integration surface — not a separate product build.
- We stay on NextAuth v5 and add WorkOS as a Credentials-style provider that exchanges a WorkOS-issued session code for a NextAuth session. No rewrite.
- Cost: at 10 enterprise churches, ~$1,250/mo in IdP cost against ~$1,990+/mo in revenue (Network tier starts at $199/mo per church) — margin-compatible. Flag for Finance review anyway (see Open Questions).

**Rejected:**
- Clerk: full auth replacement, out of sprint scope.
- Auth0: higher floor cost, also fights NextAuth.
- Self-host (SAML Jackson / custom): removes vendor cost but adds ongoing SAML spec maintenance. Large-church IT expects the integration to *just work* with their Okta/Entra tenant; we will hit edge cases (signed vs unsigned assertions, encrypted NameID, IdP-initiated SSO) that we don't want to debug ourselves during a market-entry sprint.
- BoxyHQ acquisition by Ory adds uncertainty — deprioritize as fallback.

**Fallback plan:** if WorkOS pricing is a blocker, revisit in Sprint 23 with SAML Jackson on Railway/Fly (OSS self-host).

---

## 2. SSO Data Model Delta

New table **`tenant_sso_connections`** (one row per church that has enabled SSO; typically 1 per church, but the model allows multiple IdPs):

```
id                  uuid pk
church_id           uuid fk → churches.id (cascade delete)
provider            text  — 'workos' initially; leaves room for future
workos_connection_id text unique  — returned from WorkOS Admin Portal
workos_organization_id text      — WorkOS org this church maps to
status              text  — 'pending' | 'active' | 'disabled'
jit_provisioning    boolean default true  — auto-create users on first SSO login
default_member_role church_member_role default 'member'  — role assigned to JIT'd users
created_at          timestamptz default now()
updated_at          timestamptz default now()

unique(church_id, provider)
index on (workos_organization_id)
```

Delta to existing `churches` table:
- `sso_enabled boolean not null default false` — fast-path check in proxy.ts without a join.
- `sso_email_domains text[] default '{}'` — e.g. `['takeheartchurch.org']`; used as a fallback tenant-discovery signal when a user lands on the apex domain with no subdomain context (see §7).

Delta to `accounts` (NextAuth):
- No schema change. WorkOS-authenticated sessions get rows with `provider='workos'` and `providerAccountId=<workos user id>`, reusing NextAuth's existing shape. `allowDangerousEmailAccountLinking: true` is already set in `auth.ts`, so a user who existed via magic-link will have their WorkOS identity merged by email.

**Migration:** `src/db/migrations/0031_sso_connections.sql`, ~40 lines — one CREATE TABLE, two ALTER TABLE ADD COLUMN, two CREATE INDEX, one enum reuse.

---

## 3. SSO Integration Flow

**Existing (non-SSO) flow — unchanged:**
User → `/sign-in` → magic link or Google → NextAuth session cookie on `prayerjar.org` → session callback attaches `user.id` → done.

**New SSO flow:**

1. Church admin clicks **Enable SSO** on `/church/<slug>/dashboard/settings/sso` (new page).
2. Server action creates a WorkOS Organization (if not already), opens Admin Portal (hosted by WorkOS) in a new tab. Returns `tenant_sso_connections.id` in pending state.
3. Church IT admin configures their IdP (Okta/Entra/Google) inside WorkOS Admin Portal. WorkOS webhook `connection.activated` → we POST to `/api/v1/sso/webhook` → flip `tenant_sso_connections.status` to `active` and `churches.sso_enabled` to `true`.
4. User hits `takeheart.prayerjar.org/<anything>` unauthenticated:
   - proxy.ts resolves tenant = Take Heart Church, church.sso_enabled = true.
   - Redirects to `/api/auth/sso/start?church_id=<id>&returnTo=<path>`.
5. `/api/auth/sso/start` calls WorkOS `getAuthorizationUrl(organization_id)` and 302s the user to the IdP.
6. IdP authenticates user, POSTs SAML assertion back to WorkOS, WorkOS redirects user to `/api/auth/sso/callback?code=<...>`.
7. Callback exchanges code for profile via WorkOS SDK, verifies the profile's `organization_id` matches a `tenant_sso_connections` row, upserts the user (JIT), creates a `church_members` row with `default_member_role` if none exists, then mints a NextAuth session using the Credentials pattern (`signIn('credentials', {...})` or programmatic session creation via the adapter).
8. User lands on `returnTo`.

**Where existing auth stops, SSO takes over:** `/api/auth/signin` pages remain for users on the apex domain or churches without SSO. On an SSO-enabled subdomain, proxy.ts preempts the `/sign-in` route with a 302 to `/api/auth/sso/start` — users never see the magic-link form for that tenant.

**What breaks for existing non-SSO users?**
- Nothing **functionally**. They keep using magic-link / Google on apex.
- **However**, cookie domain must change from host-only `prayerjar.org` to `.prayerjar.org` so the NextAuth session survives the apex→subdomain rewrite. This is a one-time force-logout for every currently-signed-in user. We cannot prove "nothing breaks" — we must own this tradeoff. See Migration Plan (§8).

---

## 4. SSO Tier Gating

Add to `src/lib/plans.ts` (mirrors existing `hasPrayerTeamAssignments` pattern):

```
export const SSO_TIER: PlanTier = 'enterprise';
export function hasSso(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[SSO_TIER];
}
```

Server-side gate in the SSO-enable server action:
- Read church's current tier (`churches.currentPlan`).
- If `!hasSso(tier)`, return a typed error `{kind:'upsell', requiredTier:'enterprise'}`.

**UX when a non-Enterprise admin clicks "Enable SSO":**
- The SSO settings card is visible on all tiers (so the feature is discoverable) but the primary button says **"Upgrade to Network"** and links to `/for-churches/demo` instead of initiating WorkOS.
- Copy under it: "SSO / SAML and SCIM provisioning are included on the Network plan. Talk to our team about enabling SSO for your church."

Remove "coming soon" from the Network tier feature list in `plans.ts` once shipped:
```
  'Custom subdomain',
  'SSO / SAML + SCIM provisioning',
```

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

Add a new first step — **tenant resolution** — before both:

```
1. Read Host header.
2. If Host matches /^(?<sub>[a-z0-9-]{1,32})\.prayerjar\.org$/i:
     - If sub is in RESERVED set → return 404 (treat as apex miscommunication).
     - Look up churches.subdomain = sub (use Edge-compatible DB or a cached kv lookup — Vercel Edge Config or a lightweight in-memory LRU keyed off the subdomain string). The lookup must be fast; do not issue a full Neon query on every request.
     - If hit → attach x-pj-church-id header to the request, rewrite URL from `/<path>` to `/church/<slug>/<path>` internally (so the user's URL stays `takeheart.prayerjar.org/wall` but the route served is `/church/takeheart/wall`).
     - If miss → 302 to apex with a `?unknown_subdomain=1` banner.
3. Otherwise fall through to existing admin/auth logic.
```

**Cache approach:** use Vercel Edge Config for the subdomain→churchId map. It's <10ms reads at the edge, synced via a `/api/admin/rebuild-subdomain-cache` endpoint invoked on church save. Fallback: in-memory LRU inside the Node runtime (less consistent across regions but acceptable given the small set size).

**Precedence rules if both `/church/<slug>` and a subdomain exist for the same church:**
- Both remain live and functional. This is important for backwards compatibility.
- Canonical URL: use `<link rel="canonical" href="https://<sub>.prayerjar.org/...">` on all pages served from a church that has a subdomain. **No 301 from `/church/<slug>` to subdomain** — every currently-shared link would break, and churches have been sharing `/church/<slug>` URLs for months.
- SEO fold: `rel=canonical` pushes indexation to the subdomain over time without breaking existing links.

---

## 7. Subdomain ↔ SSO Interaction (the integration point most likely to be wrong)

Scenario: unauthenticated request to `takeheart.prayerjar.org/wall`.

1. proxy.ts → tenant resolved → Take Heart Church, `sso_enabled=true`.
2. proxy.ts attaches `x-pj-church-id` and `x-pj-sso-required` headers.
3. The `/wall` route (rewritten to `/church/takeheart/wall`) is protected; the auth check sees `sso_enabled=true` and redirects to `/api/auth/sso/start?church_id=<id>&returnTo=/wall`.
4. `/api/auth/sso/start` reads `tenant_sso_connections.workos_organization_id` and calls `workos.sso.getAuthorizationUrl({ organization: orgId, ... })`. **Tenant discovery is subdomain-based — we always know which IdP to hit because the subdomain resolved before the redirect.**
5. IdP → WorkOS → callback → session → user sees `/wall` on their subdomain.

**Fallback tenant discovery** (when a user hits apex `prayerjar.org/sign-in` but belongs to an SSO-enabled church): prompt for email, match `sso_email_domains` array across `tenant_sso_connections`, and route accordingly. This is why `sso_email_domains` is on the schema — churches with IT admins who want SSO but haven't picked a subdomain yet still have a working flow.

**Design rule:** subdomain is the primary tenant discovery mechanism. Email-domain is the fallback. Never both in the same request path.

---

## 8. Migration / Rollout Plan

Order of shipping, each step independently deployable behind feature flags (`feature_flags` table already exists):

1. **Migration 0031 + plans.ts `hasSso` predicate.** No behavior change. Ships first so other work has a stable schema.
2. **Subdomain wildcard DNS + Vercel domain.** Infra-only, no code. Zero user impact if proxy.ts doesn't route yet.
3. **proxy.ts tenant resolution behind flag `subdomain_routing`.** Flag on for Ron's test church only. Verify rewrites work.
4. **NextAuth cookie domain change to `.prayerjar.org`.** This is the forced-logout event. Schedule for a low-traffic window (Monday 3am ET). Pre-announce in the weekly pastor email. Post-deploy: monitor sign-in success rate.
5. **BrandingForm "Claim Subdomain" UI promoted from behind flag.** Churches on pro+ (Open Question: or enterprise-only?) can set their subdomain. Reserved list enforced server-side.
6. **WorkOS integration behind flag `sso_workos`.** One internal test church connected to a WorkOS sandbox. End-to-end assertion handling verified.
7. **`/for-churches` marketing copy updated** — remove "coming soon" from Network tier features.
8. **SSO settings page enabled for enterprise churches.** Admin Portal link live.

Each numbered step is a separate deploy. SCIM is intentionally absent — see Open Questions.

---

## 9. Test Surface

High-value integration tests (not exhaustive):

- **Subdomain routing:**
  - `takeheart.prayerjar.org/wall` serves the same HTML as `/church/takeheart/wall`.
  - Reserved subdomain `www.prayerjar.org` serves apex, not a 404 (confirm vs validator).
  - Unknown subdomain `nonexistent.prayerjar.org` redirects to apex with banner.
  - Apex `prayerjar.org` unchanged by proxy.ts changes.
- **Tenant isolation:**
  - A session signed in on `takeheart.prayerjar.org` accessing `gracechurch.prayerjar.org/wall` does not see Take Heart data (authz check on `church_members`).
  - Prayer wall queries on subdomain-scoped routes filter by `church_id` derived from proxy-injected header, not from user session alone.
- **SAML assertion handling:**
  - WorkOS SDK mocked; invalid signature → 401.
  - Organization mismatch (user authenticated against Org A but request came from Church B's subdomain) → 403.
  - JIT provisioning creates `users` + `church_members` atomically (transaction test).
- **Cookie domain migration:**
  - Pre-migration session cookie with host-only `prayerjar.org` is explicitly invalidated (by changing `AUTH_SECRET`? or just accept stale cookies get re-signed in). Verify no "Configuration" error pages.
- **Tier gating:**
  - Non-enterprise admin clicking "Enable SSO" gets the upsell UI, not a WorkOS redirect.
  - `hasSso(tier)` unit tests parallel to existing `hasPastoralDashboard` tests.

Most likely to catch regressions: the subdomain cross-tenant isolation test. Tenant-leak bugs are the #1 risk in a wildcard-subdomain architecture.

---

## 10. Open Questions for PM / Ron

**These must be resolved before sprint kickoff** — any one of them reshapes the task breakdown.

1. **Subdomain tier floor.** Recommendation: `pro` and above. Makes subdomain a concrete upsell lever for Small Church → Growing Church churches, and matches the S14 note. Alternative: `enterprise`-only (keeps it as a Network differentiator). **PM decide.**

2. **Bring-your-own-domain** (`prayer.takeheart.church` via CNAME). Recommendation: **out of scope for Sprint 22.** Vercel Domains API supports it but it adds 3–5 eng days for cert issuance flow, TXT-record verification UI, and apex-vs-subdomain CNAME ambiguity. Network churches have asked for it; defer to Sprint 23 with a "Custom domains coming soon" line on the Network tier.

3. **SCIM provisioning in Sprint 22.** Recommendation: **defer.** Realistic sizing: SSO-auth is 5–8 eng days; subdomain routing is 4–6 eng days; SCIM is another 5–7 days (user/group sync endpoints, conflict resolution, deprovisioning flows). With 8 other sprint items, SSO + subdomain fit. SCIM does not. Marketing can still list "SCIM available on request" since WorkOS supports it — we just won't have the admin UI polish for it in S22.

4. **Cookie-domain migration window.** The change from host-only cookie to `.prayerjar.org` force-logs-out every currently-signed-in user exactly once. Acceptable? If not, we need a sliding-migration approach (dual-cookie read, single-cookie write) which is 2 more eng days. **Ron decide** — my recommendation is one-and-done during a low-traffic window, because a rolling migration leaves us with two auth states to debug for weeks.

5. **Marketing timing.** Does `/for-churches` update the copy the moment SSO ships, or after the first real church onboards via SSO? Recommendation: ship copy at the same time, since the Network tier description has had "coming soon" live for months and we need to drop that to start selling. **PM decide** coordinating with Growth.

6. **Finance review of IdP cost.** WorkOS dropped their free tier in 2024–2025; at $125/connection/mo, the first 10 enterprise churches cost us $1,250/mo against ~$1,990/mo revenue. That's viable but thin. Should Finance sign off before we commit? Recommendation: yes, quick check with Finance before sprint kickoff.

---

## Summary of Capacity Concerns

Sprint 22 can ship **SSO (auth only) + Subdomain routing** alongside the other 8 items if:
- SCIM defers to Sprint 23.
- Bring-your-own-domain defers to Sprint 23.
- The cookie-migration is one-shot (not rolling).
- The WorkOS Admin Portal replaces a custom SAML-metadata UI (that's the main reason WorkOS was picked over self-host).

If PM insists on SCIM in S22, something else in the sprint must cut — this is explicit capacity feedback for PM before finalizing.
