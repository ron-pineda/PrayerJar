# /for-churches Strategic Review — Recommendations

**Sprint:** `21-review`
**Date:** 2026-04-19
**Author:** PM (consolidation of four specialist inputs — no new analysis)
**Specialist inputs (the receipts):** [`research-findings.md`](./research-findings.md), [`architect-findings.md`](./architect-findings.md), [`customersuccess-findings.md`](./customersuccess-findings.md), [`strategist-synthesis.md`](./strategist-synthesis.md)

---

## Verdict block (the three questions, one line each)

- **Q1 — Feature sufficiency by segment:** **CONDITIONAL.** Small = conditional yes (Free 50-member cap blocks pre-paid value-feel), Medium = yes ($49 tier is the ladder's strongest rung), Large = no today (SSO/subdomain still "coming soon"). See [`customersuccess-findings.md`](./customersuccess-findings.md).
- **Q2 — Claims vs. implementation:** **CONDITIONAL.** Core pastoral stack is real; **three Pro-tier marketing claims on `/for-churches` are not backed by code** (downloadable PDF reports, "small groups sync too," weekly prayer summary to PCO). See [`architect-findings.md`](./architect-findings.md).
- **Q3 — Pricing fairness (delta from 2026-04-17):** **HOLD.** One material competitor move (Breeze $67→$72, indirect ChMS tier); direct prayer-first set unchanged; PrayerJar's PCO integration remains category-unique. No signal to revisit Free / $19 / $49 / $199+. See [`research-findings.md`](./research-findings.md) + [`strategist-synthesis.md`](./strategist-synthesis.md).

---

## Q1 — Does the product serve small / medium / large churches today?

Medium churches (100–500) are the channel's center of gravity: Growing Church $49 maps feature-for-feature to the pastoral workflows that tier is sold against — assignments, testimony queue, live event wall, branding, analytics, PCO. Small churches (<100) can get real value on Small Church $19, but the Free-tier cap of 50 members blocks the 50–75-member band (the majority of plants and house churches) from ever feeling value before a paywall decision. Large churches (500+) are not served today — Network tier lists SSO and custom subdomain as "coming soon" with no dated roadmap, and the demo gate is a hard wall. Full per-segment rubric in [`customersuccess-findings.md`](./customersuccess-findings.md).

## Q2 — Do the marketing claims match the code?

Mostly yes, with three sharp exceptions — all on Pro ($49), all buyer-facing. (a) "Downloadable PDF reports": no PDF generator exists anywhere in `src/` (no `@react-pdf`, `pdfkit`, or `puppeteer`). (b) "Small groups sync too": the PCO sync runner reads groups but discards them (`chms-sync-runner/route.ts:66` destructures to `_groups`); no persistence leg. (c) "Weekly prayer summary appears as a note on each person's PCO record": the adapter method and runner branch exist, but no scheduler queues those jobs. Legal already framed Sprint 17 around FTC §5: claims inside a product the buyer paid for are the cleanest exposure surface. Full 22-row matrix in [`architect-findings.md`](./architect-findings.md).

## Q3 — Is the pricing still fair against competitors?

Yes. Among 9 tracked competitors (2026-04-17 baseline), only Breeze ChMS moved materially — $67 → $72/mo (+7.5%) plus a Tithely rebrand — and that's an indirect ChMS tier well above our $19/$49 rungs. The four direct prayer-first competitors (Prayer Platform, PrayerMate, Echo, Uplift) are unchanged and **none has any ChMS integration**, so PrayerJar's PCO support remains category-unique two days after Sprint 18 shipped. Strategist verdict: HOLD the ladder — no ADJUST or REDO signal in any input. Full delta in [`research-findings.md`](./research-findings.md); synthesis in [`strategist-synthesis.md`](./strategist-synthesis.md).

---

## Prioritized action list (max 5, ordered by business impact)

| # | Action | Owner | Effort | Expected impact | Finding it addresses |
|---|---|---|---|---|---|
| 1 | **Reconcile the 3 Pro-tier ship-stopper claims on `/for-churches` — strip copy same-day; decide build-vs-remove in Sprint 22.** (PDF reports, "small groups sync too," weekly PCO summary) | Copywriter (strip today) + Backend (Sprint 22 build decision) | S to strip / M to ship | Removes compounding FTC §5 exposure on the tier the paying buyer sees; restores claim integrity before any scaled Pro outreach | `architect-findings.md` §Severity summary; `strategist-synthesis.md` §3 rec #1 |
| 2 | **Raise Free-tier member cap 50 → 75 in `src/lib/plans.ts`** (one-line change + three copy updates) | Backend + Copywriter | S | Unlocks the 50–75-member band (plants, house churches, small-church majority) to experience the platform before a paywall decision — feeds top of funnel the whole ladder depends on | `customersuccess-findings.md` §If only one thing ships; `strategist-synthesis.md` §3 rec #2 |
| 3 | **Reposition Network tier as best-fit for single-congregation 500+ until SSO and custom subdomain land** (copy-only; strip undated "coming soon" list or pair with dated roadmap) | PM + Copywriter | S | Prevents burning credibility with multi-site/denominational buyers; buys room for real Enterprise features to land before being promised | `customersuccess-findings.md` §Segment 3 quick win #3; `strategist-synthesis.md` §2 gap #4 + §3 rec #3 |
| 4 | **Add "nightly sync" qualifier to PCO card + route regained hero phrase past Legal** (PCO webhook `webhookSecret` still unpopulated, so "automatically" means nightly batch today; Sprint 17-killed "falls through the cracks" phrase is back on hero) | Copywriter | S | Closes two ship-allowed-with-label drift items without waiting on engineering; pairs with the Sprint 19 webhook work | `architect-findings.md` §Claims Matrix rows 9b + 22; `strategist-synthesis.md` §2 gap #5 |
| 5 | **Future-sprint scope (not this sprint): build PDF report generator, PCO group persistence (`syncGroup` on adapter + runner), PCO weekly-summary scheduler, SSO/SAML, custom subdomain.** If action #1 strips copy, these become Sprint 22+ build decisions — name them here so they don't get lost. | PM + Architect to scope | L (combined) | Unblocks the claims stripped in action #1 and opens the Large segment for sales outreach | `architect-findings.md` §Follow-up list items 1, 3, 4; `customersuccess-findings.md` §Segment 3 missing features 1–2 |

---

*If you want depth on any verdict, open the cited specialist doc.*
