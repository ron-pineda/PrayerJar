# Security Review: ChMS Webhook Route — Sprint 18

**Reviewed by:** Security (agent)
**Date:** 2026-04-18
**Decision:** PASS WITH CONDITIONS

Conditions: (1) The `webhookSecret` gap must be documented as a known gap per Option b — not left silently broken. (2) The 404/400 pre-auth response codes are a low-severity finding; acceptable for MVP but documented below for awareness.

---

## Verification checklist

| # | Item | Result | Notes |
|---|------|--------|-------|
| 1 | Raw body for HMAC | PASS | `request.text()` called at route.ts:23 before `JSON.parse()` at :26. Raw string passed via synthetic `x-raw-body` header. HMAC computed over this raw value in adapter. |
| 2 | Timing-safe comparison | PASS | `timingSafeEqual` imported from `node:crypto` and used at PlanningCenterAdapter.ts:536. Both operands are `Buffer.from(hexString)` — consistent UTF-8 encoding of hex digest on both sides. No string `===` comparison. |
| 3 | Signature scope | PASS | Raw body is passed directly from `request.text()` to HMAC `.update(rawBody, 'utf8')` with no prefix stripping, suffix stripping, or encoding transformation between read and compute. |
| 4 | Secret source | PASS | `this.config?.webhookSecret` at adapter:523 — sourced from the decrypted `chmsConfig` object populated by `connect()`. Not hardcoded; not from env vars. |
| 5 | Replay protection | PASS | `Date.now() - createdAt.getTime() > 5 * 60 * 1000` at adapter:554. Timestamp sourced from `event.attributes.created_at` in event payload (not the request arrival time). Window is exactly 5 minutes. Comparison direction is correct (older events → positive delta → reject). |
| 6 | 401 responses don't differentiate failure modes | PASS WITH NOTE | `result === null` (sig failure), church not found, and missing pcoOrgId in payload all return `new Response('Unauthorized', { status: 401 })` with identical body. **However**, unknown provider slug returns 404 and malformed JSON returns 400 at the pre-auth stage (route.ts:19, :28). These minor differentiators are low severity (they reveal nothing about org IDs or secrets) but are noted. |
| 7 | Sentry scope | PASS | `Sentry.captureException` is called only on `result === null` (signature failure) at route.ts:75–78. Church-not-found at :59 returns 401 silently with no Sentry call. No org-ID enumeration via Sentry volume. |
| 8 | webhookSecret gap | FAIL (documented gap) | `webhookSecret` is never populated by `exchangeCodeForTokens`. Every real PCO church will have `webhookSecret = undefined`, causing `handleWebhook` to return `null` immediately and disabling delta sync entirely. See assessment below. |

---

## Issues

### Issue 1 — Pre-auth response differentiation (Low Severity)

**File:** `src/app/api/webhooks/chms/[provider]/route.ts:19, :28`

**Severity:** Low

**Detail:** An unknown `provider` slug returns HTTP 404, and unparseable JSON body returns HTTP 400. Both responses are emitted before any authentication attempt. An external attacker learns:
- which provider slugs are registered (404 vs accepted path)
- whether their POST body was valid JSON

Neither leaks org IDs, signing secrets, or church identity. For an MVP this is acceptable. If hardening is desired post-launch, collapse all pre-auth failures to 401.

**Required action for this review:** None (document only).

---

### Issue 2 — `webhookSecret` gap effectively disables delta sync (Critical Functional Gap)

**File:** `src/lib/chms/adapters/PlanningCenterAdapter.ts:523–524`

**Severity:** Critical functional gap (not a security regression — the feature was never operational)

**Detail:** `handleWebhook` returns `null` immediately when `this.config?.webhookSecret` is falsy (adapter:523–524). `webhookSecret` is never set in `exchangeCodeForTokens` (adapter:89–172). No PCO webhook registration call is made anywhere in the codebase. Result: every incoming PCO webhook event is rejected as a signature failure, and Sentry logs an exception for each. Delta sync is non-functional for all connected churches.

See assessment section below for recommended path forward.

---

## webhookSecret gap assessment

### Option evaluation

**Option a — Best (PCO webhook registration during OAuth):**
PCO exposes a webhook subscription API at `POST https://api.planningcenteronline.com/webhooks/v2/subscriptions`. After token exchange, the app would call this endpoint with the desired event types and a secret of its choosing, then store the returned subscription ID and that secret as `webhookSecret` in `chmsConfig`. This is the correct long-term solution — it makes delta sync operational for every new OAuth connection. Implementation belongs in `exchangeCodeForTokens` as a non-fatal best-effort step (similar to how `pcoOrgId` is fetched). Estimated effort: 1–2 hours Backend work.

**Option b — Acceptable for MVP (document as known gap):**
Acknowledge that webhook delta sync is non-functional. Document it clearly so it is not silently broken. Ensure the nightly full-sync cron covers member data freshness until Option a is implemented. This is the recommended path for the current sprint given the gap is already built with correct security structure — the only missing piece is registration plumbing.

**Option c — Not acceptable:** Leave `webhookSecret` undefined with no documentation. Rejected. This results in silent Sentry noise on every PCO event and creates the false impression that webhook delivery is active.

### Recommendation

**Option b is acceptable for Sprint 18.** The signing, replay protection, and timing-safe comparison are all correct. The webhook route is architecturally sound — it will work correctly the moment a `webhookSecret` is populated. The gap should be:

1. Documented in `docs/integrations/pco-webhook-registration.md` (Integrations agent) describing the PCO subscription API endpoint and the registration step needed.
2. A new task created for Sprint 19 (Backend/Integrations) to implement webhook registration during OAuth.
3. Sentry alerting on `result === null` should be temporarily suppressed or tagged as `expected` until the secret is in place, to avoid alarm fatigue.

---

## Sign-off

**For Backend and Integrations agents:**

The webhook route (`src/app/api/webhooks/chms/[provider]/route.ts`) and Planning Center adapter (`src/lib/chms/adapters/PlanningCenterAdapter.ts`) pass all cryptographic security checks. HMAC computation uses raw bytes, comparison is timing-safe, the secret comes from decrypted church config, and replay protection is correctly implemented and directionally correct.

The `webhookSecret` gap is a known functional gap, not a security regression. Delta sync is non-operational until PCO webhook subscription registration is added to the OAuth flow. This must be tracked as a Sprint 19 task and must not be left undocumented.

**Decision: PASS WITH CONDITIONS.** Conditions met when: (1) `webhookSecret` gap is documented in `docs/integrations/` and a Sprint 19 task is filed, (2) Sentry noise from `null` returns is tagged/suppressed until registration is implemented.
