# Subdomain Launch Checklist — pj-s22-16

**Owner:** Ron (all DNS/Vercel steps are manual infra operations)
**Code:** Ships with Sprint 22 behind `SUBDOMAIN_ROUTING=false` flag.
Enable the flag only after all infra steps below are verified.

---

## Pre-launch infra (do once)

### Step 1 — Add wildcard CNAME at Porkbun

1. Log in to Porkbun → DNS management for `prayerjar.org`.
2. Add a new record:
   - **Type:** CNAME
   - **Host:** `*`
   - **Answer:** `cname.vercel-dns.com.`
   - **TTL:** 600 (or default)
3. Keep the existing apex A record (`prayerjar.org → 76.76.21.21`) unchanged.
4. Wait ~5 minutes for DNS propagation. Verify with:
   ```
   nslookup test.prayerjar.org
   ```
   Should resolve to a Vercel IP.

### Step 2 — Add `*.prayerjar.org` domain in Vercel

1. Go to Vercel project → **Settings → Domains**.
2. Click **Add** and enter `*.prayerjar.org`.
3. Vercel automatically provisions a wildcard Let's Encrypt TLS cert.
4. Wait for cert status to show **Valid** (~5 minutes after DNS propagates).

> **Note:** You do NOT need to add individual subdomain records for each
> church. The wildcard cert + CNAME covers all `*.prayerjar.org` subdomains.
> Adding or removing a church subdomain is a database write, not a DNS change.

---

## Enable routing

### Step 3 — Set `SUBDOMAIN_ROUTING=true` in Vercel

1. Go to Vercel project → **Settings → Environment Variables**.
2. Add or edit `SUBDOMAIN_ROUTING`:
   - **Value:** `true`
   - **Environment:** Production only (leave Preview/Development as `false`)
3. Save.

### Step 4 — Redeploy

Trigger a redeploy so the middleware picks up the new env var:
```
git commit --allow-empty -m "chore: trigger redeploy for SUBDOMAIN_ROUTING=true"
git push
```
Or use the Vercel dashboard → **Deployments → Redeploy**.

---

## Smoke test

### Step 5 — End-to-end verify

1. In the Branding dashboard of a test church (must be on Growing Church / pro plan or above),
   set a subdomain, e.g. `testchurch`.
2. Visit `https://testchurch.prayerjar.org/wall` in a browser.
3. Expected: the church's prayer wall loads (same HTML as `/church/testchurch/wall`).
4. Visit `https://www.prayerjar.org` — expected: 404 (reserved subdomain).
5. Visit `https://nonexistent.prayerjar.org` — expected: redirect to `prayerjar.org?unknown_subdomain=1`.

### Step 6 — Session isolation spot-check

1. Sign in on `prayerjar.org` (apex).
2. Open `testchurch.prayerjar.org` in the same browser.
3. Expected: NOT signed in on the subdomain (separate auth surface). You must sign in again.
4. Open DevTools → Application → Cookies. Confirm:
   - Cookie on `prayerjar.org` has **Domain** = `prayerjar.org` (no leading dot).
   - After signing in on the subdomain, its cookie has **Domain** = `testchurch.prayerjar.org`.
   - No cookie is shared between the two hosts.

---

## Monitoring

- Check Vercel function logs after enabling the flag for any middleware errors.
- Watch for `unknown_subdomain=1` in query params on apex — indicates someone
  typed a non-existent subdomain URL (expected to be rare; monitor for spikes).

---

## Tier downgrade behaviour

Existing subdomains are **NOT automatically cleared** when a church downgrades
below the Growing Church tier. The save-path tier gate prevents the church from
re-setting a new subdomain value after downgrade, but the current value persists
in the database so previously shared URLs keep working through a billing lapse.

If Ron decides to enforce clearing on downgrade, a Stripe webhook handler change
is required (out of scope for Sprint 22 — see Sprint 23 backlog).

---

## Bring-your-own-domain (deferred)

Custom domains like `prayer.takeheart.church` via CNAME are deferred to Sprint 23.
They require Vercel Domains API integration, TXT-record verification UI, and
cert issuance flow — out of scope here.
