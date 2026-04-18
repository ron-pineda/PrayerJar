# PrayerJar Pricing Decision — Sprint 17

**Date:** 2026-04-17
**Author:** Strategist agent
**Status:** Decision — awaiting PM sign-off before downstream tasks execute
**Unblocks:** pj-s17-plans-gating-fix, pj-s17-for-churches-rewrite, pj-s17-for-churches-build, pj-s17-enterprise-demo-flow

---

## Decision Summary

| Tier | Display Name | Internal Slug | Monthly | Annual (billed yearly) | Annual/mo equivalent | Member cap | Group cap |
|------|-------------|---------------|---------|------------------------|---------------------|------------|-----------|
| Free | Free | `free` | $0 | $0 | — | 50 | 3 |
| Starter | Small Church | `starter` | $19 | $193.80/yr | $16.15/mo | 150 | 5 |
| Pro | Growing Church | `pro` | $49 | $499.80/yr | $41.65/mo | Unlimited | Unlimited |
| Enterprise | Network | `enterprise` | Starting at $199 | Contact for pricing | — | Unlimited | Unlimited |

**Trial policy:** No 30-day Starter trial. Free tier is the permanent on-ramp. Churches upgrade when they hit member/group caps or need pastoral tools.

**Annual discount:** 15% (not 17%, not 20%).

**Enterprise anchor copy:** "Starting at $199/mo — bespoke agreement, unlimited everything, custom subdomain and SSO on roadmap. Contact for pricing."

---

## Tier Feature Matrix

| Feature | Free | Small Church ($19) | Growing Church ($49) | Network ($199+) |
|---------|------|-------------------|----------------------|-----------------|
| Member cap | 50 | 150 | Unlimited | Unlimited |
| Group cap | 3 | 5 | Unlimited | Unlimited |
| Event cap | 0 | 2 | 12 | Unlimited |
| Admin cap | 1 | 3 | 10 | Unlimited |
| Public prayer wall | ✓ | ✓ | ✓ | ✓ |
| Private church prayer wall | — | ✓ | ✓ | ✓ |
| Basic notifications | ✓ | ✓ | ✓ | ✓ |
| Custom welcome message | — | ✓ | ✓ | ✓ |
| Email digest for pastors | — | ✓ | ✓ | ✓ |
| Basic analytics | — | ✓ | ✓ | ✓ |
| **Pastoral Dashboard** | — | **✓** | ✓ | ✓ |
| **Pastoral Care Inbox** | — | **✓** | ✓ | ✓ |
| **Prayer Team Assignments** | — | — | **✓** | ✓ |
| **Testimony Approval Queue** | — | — | **✓** | ✓ |
| **Small Groups** | — | **✓** (up to 5) | ✓ (unlimited) | ✓ |
| Live event prayer wall | — | — | ✓ | ✓ |
| Custom branding (logo + colors) | — | — | ✓ | ✓ |
| Advanced analytics & PDF reports | — | — | ✓ | ✓ |
| Priority support | — | — | ✓ | ✓ |
| Custom subdomain | — | — | — | Coming soon |
| SSO / SAML | — | — | — | Coming soon |
| Custom agreement available | — | — | — | ✓ |
| AI-Flagged Care | — | — | — | — |

Notes:
- AI-Flagged Care is removed from all tiers following the Sprint 17 hotfix (`pj-s17-hotfix-ai-claim`). Do not reintroduce.
- Custom subdomain and SSO / SAML are "coming soon" per `docs/decisions/enterprise-claims-2026-04.md`. These are not on any current tier as delivered features.
- SLA and Dedicated account manager are removed from Enterprise entirely (legal exposure — see enterprise-claims-2026-04.md).

---

## Rationale

### 1. Tier names: Free / Small Church / Growing Church / Network

**Decision: Adopt Brand's recommendation.**

Brand's rationale is correct — names that describe who the tier is for reduce sales friction more than names that describe price position. A pastor looking at "Small Church / Growing Church" self-qualifies without reading four bullet lists. The internal slugs (`free | starter | pro | enterprise`) stay unchanged to avoid a database migration on `church.plan_tier`. Only the `name` display strings change.

### 2. Free member cap: 50 members / 3 groups

**Decision: Raise from 25/1 to 50/3.**

The current 25-member / 1-group cap is the least generous in the direct-competitor set (PrayerMate gives 25 subscribers / 3 groups; Uplift gives everything free). A new church plant or a small congregation piloting PrayerJar cannot realistically evaluate the product with one group. 50 members / 3 groups lets a real small church use the product through its first 6 months of growth before hitting an upgrade wall. Finance analysis confirms the break-even conversion rate is 3.2% — well within the published 2–8% range for church SaaS. Raising the cap does not push break-even materially higher; it removes the "too small to pilot" objection that is currently costing trial-to-paid conversions.

### 3. Starter price: Hold at $19/mo monthly, $193.80/yr (15% annual discount)

**Decision: Hold $19/mo. Publish annual pricing.**

Research correctly identifies that Prayer Platform (~$10) and PrayerMate Medium ($12-15) undercut Starter on headline price. Finance's analysis also correctly identifies that dropping to $15 is not justified without measurement infrastructure in place — the $2,400/yr revenue delta at 50 Starters is not worth the uncertainty. The right response to the price-perception gap is feature differentiation, not repricing: moving Pastoral Dashboard and Pastoral Care Inbox to Small Church (Starter) tier gives the $19 product a concrete reason to exist above the $10-15 floor. If that move does not improve Starter conversion by Sprint 19, repricing becomes the next lever.

Annual pricing at 15% discount (not 17%) lands Starter at $193.80/yr ($16.15/mo effective), which is competitive with PrayerMate Medium at its monthly rate while offering the cash-flow and churn-reduction benefits of annual commitment.

### 4. Pastoral Dashboard → Small Church (Starter) tier

**Decision: Move Pastoral Dashboard from Pro to Starter.**

This is the most significant tier realignment. Three inputs converge on this outcome:

- Legal flagged a three-surface contradiction (plans.ts said Pro, the FAQ said "Starter and Pro," and the dashboard route had no plan gate at all). The path of least legal risk is to match the most permissive claim — Starter and above.
- Research identified that Starter at $19 lacks a visible feature justification over $10-15 competitors. A dedicated pastoral dashboard is the differentiator that no competitor at that price point has.
- Finance margins support this — gross margin at Starter is 91%, so there is no cost-driven reason to hold the feature back.

Pro (Growing Church) retains its differentiation through Prayer Team Assignments, Testimony Approval Queue, live event prayer wall, custom branding, advanced analytics, and unlimited group/member caps. The pastoral dashboard is not the only Pro differentiator — it was just the most visible one.

### 5. Pastoral Care Inbox → Small Church (Starter) tier

**Decision: Move to Starter alongside Pastoral Dashboard.**

The Pastoral Care Inbox is the operational companion to the Pastoral Dashboard — one surfaces who needs care, the other is the workflow for acting on it. Separating them across tier boundaries creates confusion ("I can see who needs care but I can't do anything about it until I upgrade"). They ship together and gate together. The inbox is also the feature that carries the most pastoral urgency claim — keeping it out of Starter would undermine the brand promise on the most affordable tier.

### 6. Prayer Team Assignments → Growing Church (Pro) tier

**Decision: Keep at Pro (Growing Church).**

Assignment workflows imply team coordination — multiple staff members, routing, accountability. This is a genuine Pro-tier capability because it requires a church large enough to have a structured care team (not just a solo pastor). Starter churches are typically small enough that the pastor handles follow-up directly; they do not need assignment routing. Keeping this at Pro preserves a meaningful upgrade incentive for churches that have grown past informal care practices.

### 7. Testimony Approval Queue → Growing Church (Pro) tier

**Decision: Keep at Pro (Growing Church).**

Testimony moderation is a feature for churches running active, public-facing testimony workflows — multi-group, higher volume. A small church on Starter with 1–5 groups does not have the volume that makes approval queuing necessary. Including it in Small Church adds feature weight to a tier that should feel simple. Pro is the right home.

### 8. Small Groups → Small Church (Starter) tier, with cap

**Decision: Starter gets Small Groups (up to 5 groups), Pro gets unlimited.**

Small Groups as a feature is already included in Starter — the 5-group limit in Starter is what creates the upgrade wall. No feature-flag change is needed here; this is already how the code works. The tier matrix above makes this explicit for Copywriter's benefit: Starter includes group functionality, Pro unlocks unlimited groups.

### 9. Trial / free-to-paid path

**Decision: No 30-day Starter trial. Free tier is the permanent on-ramp.**

Two options were evaluated:
- (a) Keep Free as permanent gateway — no time limit, capped at 50 members / 3 groups
- (b) 30-day Starter trial on signup — full Starter features for 30 days, then auto-downgrade

Option (b) is the right long-term path but is premature now. There is no MRR dashboard, no churn tracking, and no funnel instrumentation (those ship in Sprint 17 alongside this decision). A trial flow creates a conversion moment that we currently cannot measure. Shipping a trial before we can measure its effectiveness is wasted engineering work. The raised Free cap (50 members / 3 groups) plus the Pastoral Dashboard at Starter does more to drive conversions now than a timer would. Revisit trial in Sprint 19 after 2–3 months of conversion data from the new funnel instrumentation.

### 10. Enterprise demo flow

**Decision: "Starting at $199/mo, contact for pricing" anchor. Demo form qualification fields defined below.**

$199/mo anchors PrayerJar credibly alongside Pushpay (also ~$199 entry) while remaining above the Breeze/Tithe.ly ChMS tier ($67-72) that is not the competitive set. Finance's reasoning holds: at $199, a typical close must be $299-499/mo to justify support overhead, and the "starting at" language leaves room to negotiate upward.

**Demo form qualification fields (route to demo flow, not self-serve, when any one is true):**
1. "How many members does your church have?" — route to demo at > 500 members
2. "Do you need SSO or SAML authentication?" — route to demo (any answer yes)
3. "Are you a multi-site church or denominational network?" — route to demo (yes)
4. "Do you require a data processing agreement or custom contract?" — route to demo (yes)
5. Contact fields: Name, Church name, Church legal name (for nonprofit verification), Role/title, Email, Phone (optional)

Churches that answer "no" to items 2-4 and have ≤ 500 members should see self-serve Growing Church pricing, not a demo wall.

### 11. Pricing transparency

**Decision: Publish all prices (Free, Small Church, Growing Church) on /for-churches. Enterprise shows "Starting at $199/mo, contact for pricing."**

This is already PrayerJar's practice and is a competitive advantage over Subsplash/Pushpay/Tithe.ly Enterprise which are demo-gated. Keep it.

---

## What Changes in `plans.ts` — Backend Instructions

Backend must make the following changes to `src/lib/plans.ts` in task `pj-s17-plans-gating-fix`. Do not make these changes until PM has signed off on this document.

### 1. Display names — change `name` only, do not change `tier` slugs

```ts
// free: name stays 'Free'
starter: { name: 'Small Church', ... }
pro: { name: 'Growing Church', ... }
enterprise: { name: 'Network', ... }
```

Internal slug `PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'` is unchanged. No database migration required. Every hard-coded display string of "Starter" / "Pro" / "Enterprise" in the codebase must be hunted down and replaced with the new display names — but the type literal and DB column values stay as-is.

### 2. Free tier limits

```ts
free: {
  limits: { members: 50, groups: 3, events: 0, admins: 1 },
  features: [
    'Up to 50 members',
    '3 groups',
    'Public prayer wall',
    'Basic notifications',
  ],
}
```

Change `members: 25 → 50`, `groups: 1 → 3`. Update the features array string accordingly.

### 3. Starter (Small Church) annual price — 15% discount

```ts
starter: {
  yearlyPriceCents: 19380,  // $193.80/yr ($16.15/mo × 12). Was 18000 (21% discount).
}
```

Also add a `yearlyMonthlyEquivalentCents: 1615` display helper if the component needs it for "save X%" rendering.

### 4. Pro (Growing Church) annual price — 15% discount

```ts
pro: {
  yearlyPriceCents: 49980,  // $499.80/yr ($41.65/mo × 12). Was 46800 (20% discount).
}
```

### 5. Pastoral Dashboard tier constant

```ts
export const PASTORAL_DASHBOARD_TIER: PlanTier = 'starter';
```

Change from `'pro'` to `'starter'`. This single change cascades to:
- `hasPastoralDashboard()` predicate
- `PASTORAL_DASHBOARD_TIER_NAME` display string
- The FAQ at `for-churches/page.tsx:222` (already dynamic via `PASTORAL_DASHBOARD_TIER_NAME`)
- Any server-side gate that calls `hasPastoralDashboard()`

### 6. Pastoral Care Inbox — add gate constant (new)

Add a new constant alongside the existing pattern:

```ts
/** The minimum plan tier that unlocks the Pastoral Care Inbox. */
export const PASTORAL_CARE_INBOX_TIER: PlanTier = 'starter';

export function hasPastoralCareInbox(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[PASTORAL_CARE_INBOX_TIER];
}
```

If Pastoral Care Inbox is currently gated at Pro (or ungated), update the server action / route handler to use this predicate.

### 7. Prayer Team Assignments — add gate constant (new, keep at Pro)

```ts
/** The minimum plan tier that unlocks Prayer Team Assignments. */
export const PRAYER_TEAM_ASSIGNMENTS_TIER: PlanTier = 'pro';

export function hasPrayerTeamAssignments(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[PRAYER_TEAM_ASSIGNMENTS_TIER];
}
```

### 8. Testimony Approval Queue — add gate constant (new, keep at Pro)

```ts
/** The minimum plan tier that unlocks the Testimony Approval Queue. */
export const TESTIMONY_APPROVAL_QUEUE_TIER: PlanTier = 'pro';

export function hasTestimonyApprovalQueue(tier: PlanTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[TESTIMONY_APPROVAL_QUEUE_TIER];
}
```

### 9. Starter features array — add Pastoral Dashboard and Pastoral Care Inbox

```ts
starter: {
  features: [
    'Up to 150 members',
    '5 groups',
    'Private church prayer wall',
    'Custom welcome message',
    'Email digest for pastors',
    'Basic analytics',
    'Pastoral dashboard',
    'Pastoral care inbox',
  ],
}
```

### 10. Pro (Growing Church) features array — remove Pastoral Dashboard, add assignments and approval queue

```ts
pro: {
  features: [
    'Unlimited members',
    'Unlimited groups',
    'Pastoral dashboard',
    'Pastoral care inbox',
    'Prayer team assignments',
    'Testimony approval queue',
    'Live event prayer wall',
    'Custom branding',
    'Advanced analytics & PDF reports',
    'Priority support',
  ],
}
```

Note: Pastoral Dashboard and Pastoral Care Inbox appear in Pro too (inherited via `TIER_RANK >= TIER_RANK[starter]`). The features array for Pro should list them explicitly so tier card copy is complete.

### 11. Enterprise display price

Enterprise `monthlyPriceCents` stays at `0` (custom pricing). Add a `displayPrice` string field to `PlanDefinition` (or handle in the UI component) so the tier card renders "Starting at $199/mo" without implying a fixed Stripe price:

```ts
enterprise: {
  displayPrice: 'Starting at $199/mo',  // UI display only; Stripe price is custom
  monthlyPriceCents: 0,  // unchanged — no Stripe self-serve
}
```

If modifying `PlanDefinition` type is too invasive, the UI can special-case the enterprise tier display. Backend decides implementation; what must not happen is the enterprise card showing "$0/mo" to users.

### 12. Annual discount percentage constant

Add for UI rendering:

```ts
export const ANNUAL_DISCOUNT_PERCENT = 15;
```

UI can use this to render "Save 15%" or derive the equivalent monthly price from `yearlyPriceCents / 12 / 100`.

### 13. Regression test requirement

Backend must add a test asserting that `PASTORAL_DASHBOARD_TIER_NAME` equals `'Small Church'` and that `hasPastoralDashboard('starter')` returns `true`, `hasPastoralDashboard('free')` returns `false`. This prevents the three-surface drift Legal flagged from recurring.

---

## What Changes in Marketing Copy — Copywriter Instructions

Copywriter picks these up in `pj-s17-for-churches-rewrite`.

### 1. Tier names in all copy

Replace every instance of:
- "Starter" → "Small Church" (display; internal slug untouched in code)
- "Pro" → "Growing Church"
- "Enterprise" → "Network"

### 2. Tier card headers and fit statements (per Brand Guide §6)

```
Free — $0/mo
[no badge; no "Most Popular"]

Small Church — $19/month (or $16.15/mo billed annually)
Best for churches under 150 members.

Growing Church — $49/month (or $41.65/mo billed annually)
Best for churches 150–500 members.

Network — Starting at $199/mo
Best for multi-site churches and denominations.
```

### 3. "Most Popular" badge — remove

Replace with the fit-statement pattern above per Brand Guide §6. No starburst, no "Recommended," no "Best Value."

### 4. Annual pricing CTA

Add to each paid tier card: "Save 15% with annual billing." Link to or reveal the annual price. Do not use "save 2 months free" (that math works at 17%, not 15%).

### 5. Pastoral Dashboard now appears in Small Church tier

Update all copy that positions Pastoral Dashboard as a Pro/Growing Church exclusive. The feature now appears on Small Church ($19). Reframe: the dashboard is available from Small Church; Growing Church adds team-scale tools (assignments, approval queue, live event wall, unlimited everything).

### 6. Feature names in copy — use these verbatim (do not create variants)

- "Pastoral dashboard" (lowercase "dashboard")
- "Pastoral care inbox"
- "Prayer team assignments"
- "Testimony approval queue"
- "Live event prayer wall"

### 7. Enterprise / Network section

Use: "Network — Starting at $199/mo. Bespoke agreement, unlimited everything. Custom subdomain and SSO on the roadmap. Contact us for pricing."

Do NOT use: "SLA," "dedicated account manager," "dedicated support" as standalone claims. Do NOT use "SSO / SAML" without "(coming soon)" or equivalent roadmap qualifier.

### 8. AI-Flagged Care — do not mention

The feature name "AI-Flagged Care" and any copy that implies automated crisis surfacing must not appear on any public page. The underlying quiet-surface behavior (prayer moderation) is not mentioned in marketing copy at all per the Sprint 17 hotfix.

### 9. Annual pricing display

Show as: "$16.15/mo billed annually" under the $19/mo headline for Small Church. Show as: "$41.65/mo billed annually" under the $49/mo headline for Growing Church. The `/yr` total is optional secondary text.

### 10. Demo CTA for Network tier

The Network tier card should have a "Contact for pricing" or "Book a call" CTA that routes to the enterprise demo form (to be built in `pj-s17-enterprise-demo-flow`). Do not include a self-serve Stripe checkout link on the Network card.

---

## What This Assumes

1. **Finance instrumentation ships alongside or before pricing change.** The MRR dashboard (`pj-s17-mrr-dashboard`) must capture a baseline before the new prices go live. Without it, we cannot evaluate whether the redesign worked. If that task slips, delay the price change — not this document.

2. **Email volume estimates are low-confidence.** Finance flagged that 8 notifications/mo per member is an untested guess. If actual email volume is 2-3x higher, Pro-heavy margin at large churches drops significantly. This does not change the tier structure decided here, but it does mean the Enterprise anchor at $199 must be validated against real cost-to-serve data before the first Enterprise close.

3. **Pastoral Dashboard is already permissively gated.** Legal's audit noted the dashboard route is gated by member role, not plan tier. Moving `PASTORAL_DASHBOARD_TIER` to `'starter'` aligns marketing with the most permissive current behavior — it does not open a previously closed gate. If Backend discovers the actual gate is stricter than Legal's audit found, that must surface before this document is approved.

4. **Conversion rate at or above 3.2%.** The free-tier expansion to 50 members / 3 groups is financially sound at ≥3.2% free-to-paid conversion. If conversion falls below 3% for two consecutive months after the changes go live, revisit the free cap — tighten it or add a time-limited trial.

5. **No 501(c)(3) verification discount.** Legal flagged this as a sales enabler but it is not in scope for Sprint 17. The pricing matrix above does not include a nonprofit discount SKU. When nonprofit verification ships (`pj-s17-nonprofit-verify` or similar), the pricing page and plans.ts will need an additional price variant.

---

## What Needs Human Decision

1. **PM sign-off before any downstream task starts.** The task acceptance criteria are explicit: no downstream task (plans-gating-fix, for-churches-rewrite, for-churches-build, enterprise-demo-flow) starts until PM has confirmed this document in task notes.

2. **Annual billing and churn tracking launch sequencing.** Finance recommends shipping churn tracking before annual billing launches, because annual subscriptions hide churn signal for 12 months. PM must confirm whether annual billing ships in Sprint 17 or is gated on `pj-s17-churn-tracking` completing. This document recommends the conservative path: publish annual pricing in the UI but do not activate annual Stripe price IDs until churn tracking is confirmed live.

3. **$19 repricing in Sprint 19.** This document holds Starter at $19 because instrumentation is not yet in place to measure whether a price drop increases conversion. PM should schedule a review at Sprint 19 using the funnel data from `pj-s17-funnel-instrumentation`. If conversion data shows Starter price is a barrier, that is when to evaluate a drop.

4. **Enterprise pricing floor.** "Starting at $199/mo" is the anchor. PM should decide the floor below which a Network deal is declined rather than accommodated (Finance's note: do not go below $149). Codify this in an internal sales runbook before the first Network demo call.

---

## Open Questions

One item could not be resolved without PM input:

**Annual billing launch timing vs. churn tracking dependency.** Finance and Legal both recommend having measurement infrastructure before annual billing goes live. The sprint plan does not currently sequence these tasks as a hard dependency. PM should confirm: does `pj-s17-annual-billing-activation` (activating the annual Stripe price IDs) block on `pj-s17-churn-tracking` completing, or do they ship in parallel? If parallel, we accept 2-3 months of blind annual-churn data.

---

## Recommendation

**Adopt this tier structure in full.**

Free / Small Church ($19) / Growing Church ($49) / Network ($199+) with 50/3 free cap, 15% annual discount, Pastoral Dashboard and Pastoral Care Inbox at Small Church, Prayer Team Assignments and Testimony Approval Queue at Growing Church, no 30-day trial, and the Enterprise demo form qualification triggers as specified above.

The Pastoral Dashboard move to Small Church is the single highest-leverage change: it gives the $19 tier a concrete pastoral differentiator that no $10-15 competitor has, addresses the Legal/FTC mismatch, and does not require building anything new — only reconciling what already works in the code.

*Reasoning: Every competing path was considered — holding Dashboard at Pro (leaves the Legal mismatch open and gives Starter no justification for $19), adding a 30-day trial (premature without measurement infrastructure), dropping Starter price to $15 (Finance correctly ruled this out without conversion data). The decisions above represent the least-risk, highest-fidelity path from the current codebase state to a defensible, competitive, legally clean tier structure.*
