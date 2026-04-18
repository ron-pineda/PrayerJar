# MRR Dashboard — Internal Finance Spec

**Version:** 1.0  
**Sprint:** 17  
**Status:** Approved  
**Access path:** `/admin/finance`  
**Permissions:** Admin-only (see [Permissions](#permissions))

---

## Overview

This spec defines the metrics, formulas, data sources, and access controls for the internal MRR dashboard at `/admin/finance`. It documents what the `src/lib/finance/mrr.ts` library computes and how the `/admin/finance` page presents it to finance stakeholders.

The dashboard answers: how much revenue are we generating, from which acquisition sources, and how is that changing month over month?

---

## Metrics Computed

| Metric | Category | Description |
|---|---|---|
| New MRR | Flow | MRR added by churches that became paying customers this month |
| Expansion MRR | Flow | MRR gained from churches that upgraded to a higher tier |
| Contraction MRR | Flow | MRR lost from churches that downgraded to a lower paid tier |
| Churned MRR | Flow | MRR lost from churches that cancelled (dropped to free) |
| Net New MRR | Flow | Net change = New + Expansion − Contraction − Churned |
| Total MRR | Stock | Sum of MRR across all currently active paying churches |
| Net Revenue Retention (NRR) | Ratio | Revenue retained from existing customers across periods |
| 3-month Rolling Trend | Trend | New/Expansion/Contraction/Churn plotted across last 3 months |
| Paying-Church Count | Stock | Count of churches on a paid plan (Starter, Pro, or Enterprise) |
| Acquisition-Source Breakdown | Attribution | MRR and paying-church count grouped by `acquisition_source` |

---

## Formulas

All formulas operate over a **time window** `[from, to)` (inclusive start, exclusive end). "Within the window" means the relevant timestamp falls in `[from, to)`.

### 1. New MRR

**Definition:** MRR attributable to churches that first became paying customers within the window.

**Data source:** `churches.first_paid_at`, `churches.current_plan`

**Formula (plain English):**  
For each church where `first_paid_at` is within the window and `current_plan` is a paid tier (Starter, Pro, or Enterprise), add that tier's monthly price in cents.

**Pseudocode:**
```
new_mrr = 0
for church in churches:
  if church.first_paid_at in [from, to) AND isPaying(church.current_plan):
    new_mrr += PLANS[church.current_plan].monthlyPriceCents
```

---

### 2. Expansion MRR

**Definition:** MRR gained from plan upgrades within the window.

**Data source:** `churches.previous_plan`, `churches.current_plan`, `churches.updated_at`

**Formula (plain English):**  
For each church where `updated_at` is within the window, both `previous_plan` and `current_plan` are paid tiers, and `current_plan` costs more than `previous_plan`, add the price delta.

**Pseudocode:**
```
expansion_mrr = 0
for church in churches:
  if church.updated_at in [from, to) AND church.previous_plan != null:
    delta = PLANS[current_plan].cents - PLANS[previous_plan].cents
    if isPaying(current_plan) AND isPaying(previous_plan) AND delta > 0:
      expansion_mrr += delta
```

Excludes new churches (they are counted in New MRR, not Expansion).

---

### 3. Contraction MRR

**Definition:** MRR lost from plan downgrades where the church remains on a paid tier.

**Data source:** `churches.previous_plan`, `churches.current_plan`, `churches.updated_at`

**Formula (plain English):**  
For each church where `updated_at` is within the window, both plans are paid tiers, and `current_plan` costs less than `previous_plan`, add the price delta as a positive loss.

**Pseudocode:**
```
contraction_mrr = 0
for church in churches:
  if church.updated_at in [from, to) AND church.previous_plan != null:
    delta = PLANS[current_plan].cents - PLANS[previous_plan].cents
    if isPaying(current_plan) AND isPaying(previous_plan) AND delta < 0:
      contraction_mrr += abs(delta)
```

---

### 4. Churned MRR

**Definition:** MRR lost from churches that cancelled — specifically those that moved from a paid plan to the free tier within the window.

**Data source:** `churches.previous_plan`, `churches.current_plan`, `churches.updated_at`

**Formula (plain English):**  
For each church where `updated_at` is within the window, `previous_plan` was a paid tier, and `current_plan` is free, add the previous plan's monthly price.

**Pseudocode:**
```
churned_mrr = 0
for church in churches:
  if church.updated_at in [from, to) AND church.previous_plan != null:
    if isPaying(previous_plan) AND NOT isPaying(current_plan):
      churned_mrr += PLANS[previous_plan].monthlyPriceCents
```

---

### 5. Net New MRR

**Definition:** The net change in MRR across all movement types within the window.

**Formula:**
```
net_new_mrr = new_mrr + expansion_mrr - contraction_mrr - churned_mrr
```

A positive value means the business grew MRR this period. A negative value means MRR shrank.

---

### 6. Total MRR

**Definition:** The current steady-state MRR — the sum of monthly prices of every actively paying church as of the window end.

**Data source:** `churches.current_plan` (for all churches, evaluated at window end)

**Formula:**
```
total_mrr = 0
for church in churches:
  if isPaying(church.current_plan):
    total_mrr += PLANS[church.current_plan].monthlyPriceCents
```

Enterprise churches with a negotiated price: in v1, Enterprise is flagged as "MRR unknown" because `plans.ts` does not have a fixed enterprise price. Enterprise is counted in `payingChurchCount` but its MRR contribution is 0 until negotiated pricing is tracked.

---

### 7. Net Revenue Retention (NRR)

**Definition:** Fraction of starting MRR retained at the end of the period, including expansion and contraction from existing customers (excludes new customer MRR).

**Formula:**
```
nrr = (starting_mrr + expansion_mrr - contraction_mrr - churned_mrr) / starting_mrr
```

Where:
```
starting_mrr = total_mrr_at_window_end - new_mrr
             = total_mrr - new_mrr
```

In words: take the MRR from customers who existed at the start of the window, then apply all changes from those existing customers (expansion, contraction, churn), and divide by what you started with.

**Example:**
- Starting MRR = $1,000  
- Expansion = $100 (existing customers upgraded)  
- Contraction = $50 (existing customers downgraded)  
- Churn = $80 (cancellations)  
- NRR = (1000 + 100 − 50 − 80) / 1000 = 97%

NRR > 100% means existing customers are generating more revenue than they were at the start of the period (net-positive dollar expansion).

---

### 8. 3-Month Rolling Trend

**Definition:** The New / Expansion / Contraction / Churn MRR components computed for each of the past 3 calendar months.

**Formula:** Apply `computeMRR(churches, from, to)` three times:
```
month[-2]: from = startOf(currentMonth - 2), to = startOf(currentMonth - 1)
month[-1]: from = startOf(currentMonth - 1), to = startOf(currentMonth)
month[0]:  from = startOf(currentMonth),     to = now
```

Each month returns a full `MRRBreakdown` object. The dashboard plots these as a grouped bar chart.

---

### 9. Paying-Church Count

**Definition:** The number of churches currently on a paid plan.

**Formula:**
```
paying_church_count = count of churches where isPaying(current_plan) = true
```

`isPaying` returns `true` for `starter`, `pro`, `enterprise`; `false` for `free`.

---

### 10. Acquisition-Source Breakdown

**Definition:** Current-state grouping of churches and their MRR by `acquisition_source`.

**Data source:** `churches.acquisition_source`, `churches.current_plan`

**Formula:**
```
for each unique acquisition_source (null → 'unknown'):
  bucket.payingCount  = count of paying churches with this source
  bucket.totalCount   = count of all churches with this source
  bucket.mrr          = sum of PLANS[current_plan].cents for paying churches
  bucket.shareOfPaying = bucket.payingCount / total_paying_churches
```

Results sorted by MRR descending, then paying count descending.

Sources are populated at church creation from UTM parameters on the signup URL (`utm_source ?? 'direct'`). Churches created before UTM capture was added will show as `'unknown'`.

---

## Data Sources and Refresh Cadence

### Source tables

| Column(s) | Table | Purpose |
|---|---|---|
| `current_plan`, `previous_plan` | `churches` | Plan state, materialized by Stripe webhook on subscription events |
| `first_paid_at` | `churches` | When the church first converted to a paid plan |
| `acquisition_source`, `utm_*` | `churches` | Attribution data, written at signup from UTM query params |
| `updated_at` | `churches` | Timestamp of last plan change (used to window plan-change events) |

The library does **not** use the `subscriptions` table for MRR computations. `subscriptions` stores raw Stripe events; `churches` materializes the derived plan state. Using the materialized columns gives us one-row-per-church semantics instead of having to reconstruct plan history from subscription lifecycle events.

### Refresh cadence decision: **Live query**

The dashboard at `/admin/finance` runs live queries against the `churches` table on each page load. No nightly snapshot is used.

**Rationale:**
- The dataset is small (hundreds of churches, not millions of rows). A full table scan completes in milliseconds.
- Snapshots introduce staleness and a new cron job to maintain. For an internal finance dashboard checked occasionally by admins, real-time data is more valuable than the marginal performance gain of a cached snapshot.
- If row count exceeds ~50,000, add a nightly materialized view. At current scale, the live-query approach is correct.

---

## Permissions

The `/admin/finance` page is **admin-only**. It uses the existing `requireAdmin()` pattern from `src/lib/admin-auth.ts`:

```ts
// src/app/admin/finance/page.tsx
import { requireAdmin } from '@/lib/admin-auth';

export default async function FinancePage() {
  await requireAdmin(); // returns 404 if not an admin — never redirects
  // ... render dashboard
}
```

`requireAdmin()` checks the current session email against the `ADMIN_EMAILS` environment variable (comma-separated list). If the email is absent or not in the list, it calls Next.js's `notFound()` — returning a 404 rather than a redirect, to minimize disclosure of the admin path's existence.

**Who has access:** Anyone whose email is listed in `ADMIN_EMAILS`. This is configured at deployment time in Vercel environment variables. For production, this should be limited to the founder and finance stakeholders.

---

## Access Path

**URL:** `/admin/finance`  
**Route file:** `src/app/(admin)/admin/finance/page.tsx`  
**Auth guard:** `requireAdmin()` from `src/lib/admin-auth.ts`  
**Navigation:** Not linked from the public nav. Accessible by direct URL only (intentional — security through obscurity for internal tools).

---

## Implementation Notes

- `tierMonthlyCents('enterprise')` returns `0` in the current `plans.ts`. The dashboard should render enterprise-plan churches with an "MRR unknown" label rather than $0, to avoid misleading the total.
- All MRR values are stored and computed in **cents** (integers). Convert to dollars only at display time using `formatCents()` from `src/lib/finance/mrr.ts`.
- The `netNewMRR` can be negative. The dashboard should style it red when negative, green when positive.
- Churn rate = `churnedCount / payingAtWindowStart`. See `computeChurn()` for the approximation of `payingAtWindowStart`.
