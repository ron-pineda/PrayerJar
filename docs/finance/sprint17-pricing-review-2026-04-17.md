# Sprint 17 Pricing Review — Finance

**Date:** 2026-04-17
**Author:** Finance Agent
**For:** PM + Business Strategist (Sprint 17 pricing decision)
**Status:** Projection — all numbers below are estimates, labeled as such.

---

## Assumptions (stated upfront, applies to all sections)

| Assumption | Value | Confidence |
|---|---|---|
| Vercel plan | Pro ($20/mo flat) | High (current) |
| Neon Postgres | Launch/Scale ~$19-69/mo | Medium |
| Resend | Pro $20/mo, 50k emails | High |
| Sentry | Team $26/mo | High |
| Avg email volume per active member | ~8 notifications/mo | Low — untested |
| Avg DB writes per member/mo | ~30 (prayers, comments, updates) | Low |
| Fixed infra floor (all tiers combined) | ~$85-135/mo | Medium |

---

## 1. Cost to Serve (rough $/month per church)

| Tier | Members | Compute | DB | Email | Storage | **Variable $/church/mo** |
|---|---|---|---|---|---|---|
| Free | 50 | $0.05 | $0.10 | $0.40 | ~$0 | **~$0.55** |
| Starter | 150 | $0.15 | $0.30 | $1.20 | ~$0.05 | **~$1.70** |
| Pro | 500 (typ.) | $0.50 | $1.00 | $4.00 | ~$0.15 | **~$5.65** |
| Pro | 2,000 (heavy) | $2.00 | $4.00 | $16.00 | ~$0.60 | **~$22.60** |

**Interpretation:** Marginal cost per church is small ($1-6/mo typical, $20+ only at Pro-heavy). Fixed infra floor of ~$100/mo dominates until roughly 30-50 paying churches. **Gross margin at Starter $19 = ~91%; at Pro $49 = ~88% typical, ~54% at heavy Pro load.** Good SaaS margins. Enterprise customers requiring dedicated support are the real cost risk (your time, not infra).

---

## 2. Free Tier Break-Even (50 members / 3 groups)

| Variable | Value |
|---|---|
| Cost to serve 1 free church/mo | ~$0.55 |
| Gross profit per Starter conversion/mo | ~$17.30 |
| Free churches subsidized per 1 Starter conversion | ~31 |

**Break-even conversion rate:** **A free → Starter conversion of ~3.2% makes free-tier unit economics neutral.** Any conversion above ~3% is net-positive.

| Conversion | 1,000 free churches → Starter MRR |
|---|---|
| 3% | $570/mo (break-even-ish) |
| 5% | $950/mo |
| 10% | $1,900/mo |

**Realism:** Church SaaS free → paid conversion in published benchmarks runs 2-8%. **5% is a defensible base case; 3% is pessimistic but survivable; 10% is optimistic.** Loosening to 50/3 is safe financially — the free-tier infra cost is trivial. The real risk is cannibalization, not cost.

---

## 3. Annual Discount Recommendation

**Recommendation: 15% annual discount, not 17%, not 10%.**

| Option | Starter annual | Pro annual | Cash capture | Churn protection |
|---|---|---|---|---|
| 10% | $205/yr ($17.10/mo) | $529/yr ($44.10/mo) | Best | Weak signal |
| **15%** | **$194/yr ($16.15/mo)** | **$500/yr ($41.65/mo)** | Strong | Strong |
| 17% (proposed) | $189/yr ($15.77/mo) | $488/yr ($40.67/mo) | Moderate | Strong |
| 20% | $182/yr ($15.20/mo) | $470/yr ($39.20/mo) | Weakest | Strongest |

**Why 15%:** Churches are low-churn but slow buyers. A 10% discount is too weak to feel like a real "deal" and won't convert monthly → annual. 17% is fine but leaves ~$4/seat/yr on the table versus 15% with negligible uplift in take-rate. **15% is the sweet spot for a low-churn, budget-conscious church buyer — round, familiar, and Starter annual lands at $16.15/mo which is still competitive with PrayerMate Medium.**

**Caveat:** If Strategist wants to emphasize "save 2 months free" marketing copy, 17% is the math for that (2/12 ≈ 16.7%) and is worth the $4/yr tradeoff. If the goal is cash flow, 15%.

---

## 4. Starter Repricing Scenarios

**Assume 20 / 50 / 100 Starter customers, 12-month ARR at monthly billing.**

| Option | Price | ARR @ 20 | ARR @ 50 | ARR @ 100 | Notes |
|---|---|---|---|---|---|
| A: Drop to $15 | $15/mo | $3,600 | $9,000 | $18,000 | Matches PrayerMate; easiest conversion |
| B: Hold $19 + annual $16 | $19/mo | $4,560 | $11,400 | $22,800 | Base case |
| C: Raise to $25 + new features | $25/mo | $6,000 | $15,000 | $30,000 | Requires integration/differentiator |

**Revenue delta at 50 Starters (annualized):**
- A vs B: **-$2,400/yr** (you give up ~21% revenue to win conversions)
- C vs B: **+$3,600/yr** (you need ~20% fewer signups to match B — risky)

**Finance recommendation: Option B (hold $19 monthly, publish $16.15 annual).** Reasoning: (1) 50 Starters × $4/mo difference = only $2.4k/yr — not worth the positioning shift; (2) the real lever is conversion rate, not price level — dropping to $15 only pays off if it increases signups by >26%, which is unproven; (3) Option C is the highest-upside path but requires Pro-like features at Starter level, which cannibalizes Pro.

**If Strategist insists on a move:** drop to $15/mo to chase volume only if SEO + funnel instrumentation (pj-s17-funnel-instrumentation) is shipped first, so we can measure whether the lower price actually increases conversion. Do not change price without measurement infrastructure in place.

---

## 5. Enterprise Anchor Price

**Recommendation: "Starting at $199/mo"** (or $2,388/yr).

Reasoning:
- Pushpay starts at ~$199/mo with less-prayer-specific value. Matching anchors PrayerJar as Pushpay-tier-serious.
- Subsplash base ~$149 but typical churches land $300-600. $199 sits confidently above Subsplash base.
- Breeze ($67) and Tithe.ly ChMS ($72) are below this tier — not the competitive set.
- At $199/mo with SSO/SAML + dedicated support, each Enterprise customer needs to be worth ~4 Starter customers in both revenue and your time. That math works only if the typical actual close is $299-499/mo. Using $199 as "starting at" leaves room to negotiate upward, which is standard.

**Do not go below $149.** Below that, Enterprise stops being a revenue tier and becomes a support-overhead tier. Solo dev cannot afford dedicated support at Pro+$50.

**Anchor line for pricing page:** "Enterprise — starting at $199/mo. SSO, custom subdomain, dedicated support, unlimited everything. Contact for custom pricing."

---

## 6. Missing Financial Controls (Sprint 17 scope)

PrayerJar currently has **zero financial visibility** — no MRR tracking, no churn metric, no signup-source attribution. Before any pricing change goes live, Finance needs instrumentation to measure whether the change worked. Priorities:

1. **MRR/ARR dashboard** — must-have. Without this, every pricing decision is guessing.
2. **Churn rate tracking** — needed before annual pricing launches (annual hides churn for 12 months).
3. **Revenue attribution by signup source** — pairs with pj-s17-funnel-instrumentation.
4. **Cost-to-serve actual tracking** — reconcile Vercel/Neon/Resend invoices to active-church counts monthly.

---

## Sensitivity / Key Risks

- **Email volume per member is the biggest unknown.** If real volume is 2-3x my estimate (25/mo not 8/mo), Pro-heavy margins collapse from 54% to ~20%. **Finance needs 1 month of real Resend data before signing off on any repricing.**
- **Enterprise support time is uncapped.** One demanding Enterprise customer at $199/mo can cost more in dev hours than 10 Pro customers. Cap support SLA in contract.
- **Annual churn is invisible for 12 months.** Ship churn tracking *before* annual launches or you'll blind-fly for a year.

---

## Tasks to Add to Sprint 17

### 1. `pj-s17-mrr-dashboard` — MRR/ARR + churn dashboard
**What:** Admin-only dashboard at `/admin/finance` showing MRR, ARR, active subscriptions by tier, MoM growth, and churn (logo + revenue). Pull from Stripe.
**Why:** Cannot evaluate whether the pricing redesign works without a baseline number. Must ship *before* the new pricing goes live to capture the pre-change baseline. **Blocks pj-s17-tier-redesign go-live.**
**Assign:** Backend Engineer, priority high.

### 2. `pj-s17-cost-to-serve-reconciliation` — Monthly infra cost tracking
**What:** A simple spreadsheet or script that pulls Vercel/Neon/Resend/Sentry invoices and divides by active-church count to produce actual $/church/mo. Run first of each month.
**Why:** Finance assumptions in this doc (email volume, DB writes) are guesses. Without 2-3 months of real data, pricing decisions — especially Enterprise anchor — are built on sand. Low effort, high payoff.
**Assign:** Finance (self-serve) + Backend Engineer for script, priority medium.

### 3. `pj-s17-churn-tracking` — Cancel reason capture + monthly churn report
**What:** Cancel flow captures structured reason (price / features / switched / other). Monthly report: gross churn %, net churn %, top 3 reasons.
**Why:** Annual billing hides churn signal for 12 months. Must start capturing reason data *before* annual launches so we're not flying blind next year. Also essential input for future pricing iterations.
**Assign:** Backend Engineer + Frontend Engineer, priority medium.

---

**Bottom line:** Hold Starter at $19/mo monthly, publish $16.15/mo annual (15% discount), loosen free to 50/3, anchor Enterprise at $199/mo. **But ship MRR + churn + cost-tracking instrumentation before any price change, or you cannot tell whether the redesign worked.**
