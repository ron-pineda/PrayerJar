# Church Acquisition Funnel — Event Specification

**Spec version:** 1.0  
**Date:** 2026-04-17  
**Author:** Analytics Agent  
**Sprint:** 17 (`pj-s17-funnel-instrumentation`)  
**Paired implementation task:** `pj-s17-funnel-instrumentation-fe`

---

## 1. Analytics Tooling

### What is installed

| Tool | Package | Version | Evidence |
|------|---------|---------|---------|
| Vercel Analytics | `@vercel/analytics` | `^2.0.1` | `package.json` line 35; `<Analytics />` mounted in `src/app/layout.tsx` line 15 |

**No PostHog is installed.** Despite the task description noting "PostHog is already in stack — verify," no `posthog-js` or `posthog-node` package appears in `package.json` and no PostHog import exists under `src/`. The existing `src/lib/analytics.ts` re-exports `track` from `@vercel/analytics` only.

### Decision: Vercel Analytics custom events

All funnel events in this spec use `@vercel/analytics`'s `track()` API. This keeps the stack simple, avoids an additional vendor, and matches the existing `trackPrayer` / `trackTestimony` pattern already in `src/lib/analytics.ts`.

**If PostHog is added in a future sprint** (for session replay, feature flags, or cohort analysis), a dual-emit wrapper can be added to `src/lib/analytics.ts` without changing call sites. Document that schema change with a date and backward-compatibility note at that time.

### Firing model

| Event type | Where to fire | Reason |
|-----------|--------------|--------|
| Page view events | Client component `useEffect` (once on mount) | No server-side equivalent; tied to user viewport |
| Interaction events | Client event handler | UI-only signal |
| Conversion completion events (`signup_complete`) | Server action (after DB write succeeds) — via `track()` from `@vercel/analytics/server` | Prevents double-counting on retries and blocks ad blockers from dropping the signal |
| Payment events (`plan_activated`, `plan_upgraded`) | Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`) — server-side only | Authoritative; client may never load after payment redirect |
| Demo form submission (`demo_requested`) | Server action in `src/app/(public)/for-churches/demo/actions.ts` after successful DB write | Ensures the event fires only when data is persisted |

---

## 2. Global Properties

Every event must include these properties in addition to event-specific properties below.

```
user_id:      string | null   // anonymized Supabase user UUID — null for unauthenticated visitors
session_id:   string          // Vercel Analytics auto-generates; include when track() is called
timestamp:    ISO 8601 string // auto-set by @vercel/analytics
```

**PII policy:** Never pass email addresses, names, church names as free-text, or any field that directly identifies a natural person. Church `slug` and `church_id` are acceptable identifiers.

---

## 3. Event Dictionary

### 3.1 `for_churches_view`

**Trigger:** User loads `/for-churches`. Fire once per page mount.  
**Firing location:** Client — `src/app/(public)/for-churches/page.tsx` `useEffect([])`.  
**Side:** Client.

| Property | Type | Description |
|----------|------|-------------|
| `referrer` | `string \| null` | `document.referrer` truncated to domain only (no path, no query) |
| `utm_source` | `string \| null` | From URL search param `utm_source` |
| `utm_medium` | `string \| null` | From URL search param `utm_medium` |
| `utm_campaign` | `string \| null` | From URL search param `utm_campaign` |
| `is_authenticated` | `boolean` | Whether a session cookie is present at page load |

**Why this event matters:** Top of funnel. Measures raw reach of the church acquisition page. UTM params reveal which channels drive traffic.

**Expected volume:** 100–500 events/week at current scale; grows proportionally with paid/organic church-focused marketing.

---

### 3.2 `pricing_view`

**Trigger:** User scrolls or navigates to the pricing tier section on `/for-churches` (or a dedicated `/pricing` page if one is created). Fire once per session per page.  
**Firing location:** Client — intersection observer on the tier card container, or on mount if pricing is above the fold.  
**Side:** Client.

| Property | Type | Description |
|----------|------|-------------|
| `page_path` | `string` | `window.location.pathname` — distinguishes `/for-churches` vs future `/pricing` |
| `tier_count` | `number` | Number of pricing tiers rendered at the time of view |
| `referrer_event` | `string \| null` | Last funnel event in the same session (e.g. `"for_churches_view"`) — to be set by the analytics wrapper |

**Why this event matters:** Conversion checkpoint. A visitor who sees pricing but does not proceed to signup is a measurable drop-off.

**Expected volume:** 60–80% of `for_churches_view` volume (visitors who scroll past the fold).

---

### 3.3 `calculator_interacted`

**Trigger:** User changes any input on the church member/pricing calculator widget.  
**Firing location:** Client — `onChange` handler; debounce 500 ms, fire once per distinct value change, cap at 1 event per 5 seconds to avoid flooding.  
**Side:** Client.

| Property | Type | Description |
|----------|------|-------------|
| `calculator_field` | `string` | Which input changed: `"member_count"`, `"group_count"`, `"plan_type"` |
| `new_value` | `string` | Stringified new value — for numeric fields, bucket into ranges: `"1-25"`, `"26-100"`, `"101-500"`, `"500+"` to avoid PII-adjacent church-size fingerprinting |
| `resulting_plan` | `string \| null` | Which plan the calculator recommends after this input (e.g. `"community"`, `"growth"`, `"enterprise"`) |

**Why this event matters:** Intent signal. Users who interact with the calculator are actively evaluating pricing fit — high-intent segment worth cohort analysis.

**Expected volume:** 30–60% of `pricing_view` volume; each session may generate multiple events (expected 2–4 per session).

---

### 3.4 `signup_start`

**Trigger:** User initiates the church signup flow. Fire when the signup form first becomes interactive (first field focus or dedicated "Start signup" button click).  
**Firing location:** Client — signup page or modal mount / first-field focus.  
**Side:** Client.

| Property | Type | Description |
|----------|------|-------------|
| `signup_method` | `string` | `"email"`, `"google"`, `"apple"` — which auth option the user chose |
| `plan_intent` | `string \| null` | Which plan the user clicked through from (if carried via URL param or session storage) |
| `source_page` | `string` | Path of the page the user came from (e.g. `"/for-churches"`) |

**Why this event matters:** Defines the top of the signup conversion funnel. `signup_start` → `signup_complete` ratio is the primary church onboarding conversion metric.

**Expected volume:** 20–40% of `pricing_view` volume.

---

### 3.5 `signup_complete`

**Trigger:** Church account creation succeeds — user record + church record written to DB.  
**Firing location:** Server action — after successful DB insert in the signup server action, using `import { track } from '@vercel/analytics/server'`.  
**Side:** Server.

| Property | Type | Description |
|----------|------|-------------|
| `user_id` | `string` | Anonymized Supabase user UUID (newly created) |
| `signup_method` | `string` | `"email"`, `"google"`, `"apple"` |
| `plan_at_signup` | `string` | Plan selected at signup time: `"free"`, `"community"`, `"growth"`, `"enterprise"` |
| `church_size_bucket` | `string` | Self-reported size from signup form, bucketed: `"1-25"`, `"26-100"`, `"101-500"`, `"500+"` |

**Why this event matters:** The most important top-of-funnel completion event. Measures how many church accounts are created per week and which plans they target at signup.

**Expected volume:** 10–30% of `signup_start` volume (assuming friction in email verification and form completion).

---

### 3.6 `plan_activated`

**Trigger:** A church's Stripe subscription moves to `active` status for the first time (first payment confirmed).  
**Firing location:** **Server-side only** — Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts`, on `customer.subscription.updated` or `checkout.session.completed` where the subscription is new and `status === "active"`.  
**Side:** Server.

| Property | Type | Description |
|----------|------|-------------|
| `user_id` | `string` | Anonymized Supabase user UUID of the church admin |
| `church_id` | `string` | Church UUID (not slug) |
| `plan` | `string` | Plan name: `"community"`, `"growth"`, `"enterprise"` |
| `billing_interval` | `string` | `"monthly"` or `"annual"` |
| `stripe_subscription_id` | `string` | Stripe subscription ID (for deduplication — not PII) |

**Why this event matters:** Revenue event. Tracks the full funnel completion from `/for-churches` view to paid conversion. `signup_complete → plan_activated` ratio is the paywall conversion rate.

**Expected volume:** Expected to be low initially (single digits/week at current scale). Must be measured against `signup_complete` to compute paywall conversion rate.

**Schema note:** Do NOT fire this from client code. The webhook is the only authoritative signal. Client-side payment redirects may fail, be blocked, or fire twice.

---

### 3.7 `plan_upgraded`

**Trigger:** A church's Stripe subscription changes from a lower plan to a higher plan (e.g. `community` → `growth`).  
**Firing location:** **Server-side only** — Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts`, on `customer.subscription.updated` where `plan.id` changes to a higher-tier plan and the prior subscription was already `active`.  
**Side:** Server.

| Property | Type | Description |
|----------|------|-------------|
| `user_id` | `string` | Anonymized Supabase user UUID of the church admin |
| `church_id` | `string` | Church UUID |
| `from_plan` | `string` | Prior plan name |
| `to_plan` | `string` | New plan name |
| `billing_interval` | `string` | `"monthly"` or `"annual"` |
| `days_since_activation` | `number` | Days between `plan_activated` timestamp and this upgrade — requires querying DB at webhook time |
| `stripe_subscription_id` | `string` | For deduplication |

**Why this event matters:** Expansion revenue signal. Upgrade velocity and timing reveal which features or thresholds prompt a church to move up-tier.

**Expected volume:** Very low initially (1–5/week). Monitor for acceleration after new feature launches.

**Schema note:** Server-side only. Same rationale as `plan_activated`.

---

### 3.8 `demo_requested`

**Trigger:** Church submits the enterprise demo/lead-capture form at `/for-churches/demo` and the server action successfully writes the record to `church_enterprise_leads`.  
**Firing location:** Server action — `src/app/(public)/for-churches/demo/actions.ts`, after successful DB persist and Resend notification email.  
**Side:** Server.

| Property | Type | Description |
|----------|------|-------------|
| `church_size_bucket` | `string` | Bucketed self-reported size: `"1-25"`, `"26-100"`, `"101-500"`, `"500+"` |
| `has_calendly_booked` | `boolean` | Whether the user proceeded to the Calendly embed on the thank-you step (requires a follow-up `calendly_booked` event or polling — mark `false` at form submit time; update logic TBD Sprint 18) |
| `referrer_plan` | `string \| null` | Which plan page the user navigated from, if determinable |
| `source_utm` | `string \| null` | `utm_campaign` from session if passed through |

**Why this event matters:** Enterprise pipeline event. Demo requests are the top of the enterprise sales funnel. `demo_requested` → `plan_activated` (enterprise) is the enterprise conversion rate.

**Expected volume:** Very low initially (1–3/week). Any volume here is high signal.

---

## 4. Funnel Map

```
for_churches_view
    ↓ (60–80% expected)
pricing_view
    ↓ (40–60% expected)
calculator_interacted          ← intent cohort branches here
    ↓
signup_start
    ↓ (10–30% expected)
signup_complete
    ↓
    ├── plan_activated          ← paid conversion (Stripe webhook, server)
    │       ↓
    │   plan_upgraded           ← expansion (Stripe webhook, server)
    │
    └── demo_requested          ← enterprise pipeline (server action)
            ↓
        plan_activated (enterprise)
```

**Conversion hypothesis:** The primary drop-off will occur between `pricing_view` and `signup_start`, because visitors who cannot self-serve pricing clarity (calculator not prominent, tier names unclear) will abandon before committing to create an account. Validating this hypothesis requires at least 4 weeks of data across at least 200 `pricing_view` events.

---

## 5. Weekly Funnel Review Template

Run every Monday. PM and Finance review together.

### Funnel Metrics Table

| Event | Count (this week) | Count (last week) | WoW Delta | Conversion from prior step |
|-------|-------------------|-------------------|-----------|---------------------------|
| `for_churches_view` | — | — | — | — (top of funnel) |
| `pricing_view` | — | — | — | `pricing_view / for_churches_view` |
| `calculator_interacted` | — | — | — | `calculator_interacted sessions / pricing_view sessions` |
| `signup_start` | — | — | — | `signup_start / pricing_view` |
| `signup_complete` | — | — | — | `signup_complete / signup_start` |
| `plan_activated` | — | — | — | `plan_activated / signup_complete` |
| `plan_upgraded` | — | — | — | `plan_upgraded / plan_activated (prior weeks)` |
| `demo_requested` | — | — | — | `demo_requested / pricing_view` |

### Key Ratios to Compute

| Ratio | Formula | Target (TBD after 4 weeks baseline) |
|-------|---------|-------------------------------------|
| Page-to-pricing rate | `pricing_view / for_churches_view` | ≥ 60% |
| Calculator engagement rate | `sessions with calculator_interacted / sessions with pricing_view` | ≥ 30% |
| Pricing-to-signup rate | `signup_start / pricing_view` | ≥ 20% |
| Signup completion rate | `signup_complete / signup_start` | ≥ 50% |
| Paywall conversion rate | `plan_activated / signup_complete` | ≥ 10% |
| Enterprise pipeline rate | `demo_requested / pricing_view` | ≥ 2% |
| Upgrade rate (trailing 30d) | `plan_upgraded / plan_activated (30d prior)` | ≥ 5% |

### Weekly Summary Format

```markdown
## Church Funnel Review — Week of [YYYY-MM-DD]

**Top of funnel:** [N] for_churches_view this week ([+/-N]% WoW)
**Pricing engagement:** [N] pricing_view ([X]% of visitors reached pricing)
**Signups:** [N] signup_complete ([X]% pricing-to-signup conversion)
**New paid churches:** [N] plan_activated ([X]% paywall conversion)
**Upgrades:** [N] plan_upgraded
**Demo requests:** [N] demo_requested

### Notable changes
[Any ratio that moved more than 10% WoW — flag and add hypothesis]

### Action items
[Specific next steps if any ratio is below target]
```

---

## 6. Dashboard Definition

These are the saved views that PM and Finance will check weekly in Vercel Analytics.

### View 1: Funnel Drop-off (Vercel Analytics Custom Events)

**Query approach (Vercel Analytics dashboard):**
- Navigate to: Vercel Dashboard → Project → Analytics → Custom Events
- Filter by event name for each step
- Set date range to last 7 days vs prior 7 days
- Export CSV for the Weekly Summary table above

**Events to pull in order:**
1. `for_churches_view`
2. `pricing_view`
3. `calculator_interacted` (unique sessions)
4. `signup_start`
5. `signup_complete`
6. `plan_activated`
7. `plan_upgraded`
8. `demo_requested`

### View 2: Plan Distribution at Activation

Filter `plan_activated` by `plan` property. This shows which plan tier is most frequently chosen at first activation — informs pricing page emphasis.

### View 3: Calculator-to-Signup Cohort

Compare `signup_complete` rates for sessions that include `calculator_interacted` vs sessions that do not. This directly tests the hypothesis that calculator engagement predicts conversion.

**Implementation note:** Vercel Analytics does not natively support cross-event session cohort analysis. If this cohort view is required before a more capable tool is added, export raw events via Vercel Analytics data export and compute in a spreadsheet or a simple SQL query against the export.

### View 4: Enterprise Pipeline

`demo_requested` count by week + `plan_activated` where `plan = "enterprise"`. Track the lag between `demo_requested` and `plan_activated` once volume allows.

---

## 7. Implementation Handoff Notes for Frontend (`pj-s17-funnel-instrumentation-fe`)

- Extend `src/lib/analytics.ts` with typed wrappers for all 8 events. Event names must match this spec exactly — no aliasing.
- Client events (`for_churches_view`, `pricing_view`, `calculator_interacted`, `signup_start`): use `import { track } from '@vercel/analytics'` (client bundle).
- Server events (`signup_complete`, `demo_requested`): use `import { track } from '@vercel/analytics/server'` (available in `@vercel/analytics >= 1.2`).
- Webhook events (`plan_activated`, `plan_upgraded`): fire from `src/app/api/webhooks/stripe/route.ts` using the server import. Do not fire from any client component.
- The `calculator_interacted` event must debounce — fire at most once per 5 seconds of continuous input. Avoid flooding.
- Pass `user_id` from session context where available; pass `null` for unauthenticated visitors.

---

## ChMS Integration Events (Sprint 18)

These events instrument the Planning Center Online (PCO) connection and sync pipeline. All are server-side only.

| Event | Trigger | Properties | Server/Client |
|---|---|---|---|
| `chms_connection_started` | Pastor clicks Connect PCO (after auth, before redirect) | `church_id`, `provider`, `user_id` | Server |
| `chms_connection_completed` | OAuth callback succeeds, tokens stored | `church_id`, `provider`, `user_id`, `sync_job_queued` | Server |
| `chms_sync_failed` | Sync job marked dead in cron runner | `church_id`, `provider`, `job_type`, `error_class`, `attempt` | Server |

**Firing locations:**
- `chms_connection_started` — `src/app/api/auth/chms/connect/planning-center/route.ts` (after role check, before PCO redirect)
- `chms_connection_completed` — `src/app/api/auth/chms/callback/planning-center/route.ts` (after `exchangeCodeForTokens` succeeds)
- `chms_sync_failed` — `src/app/api/cron/chms-sync-runner/route.ts` (when `isDead === true`)

**`error_class` values for `chms_sync_failed`:** `'auth'` (expired/refreshfailed), `'transient'` (rate limit / 5xx), `'permanent'` (all other errors).  
**`sync_job_queued`** is always `true` for `chms_connection_completed` — `exchangeCodeForTokens` unconditionally inserts a `full_sync` job.

---

## 8. Schema Stability Policy

This is version 1.0 of the church funnel event schema. Any future change to an event name, removal of a required property, or type change to an existing property must:
1. Be documented in this file under a new `## Schema Changes` section with date and backward-compatibility impact.
2. Be communicated to PM and Finance before deployment (they will have saved queries that reference old property names).
3. Prefer additive changes (new optional properties) over breaking changes (renames, removals).
