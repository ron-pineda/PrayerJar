# Strategist Synthesis — /for-churches Strategic Review

**Task:** `pj-s21r-04`
**Sprint:** `21-review`
**Author:** Strategist
**Date:** 2026-04-19
**Inputs:** `research-findings.md`, `architect-findings.md`, `customersuccess-findings.md`, `docs/strategy/pricing-prayerjar-2026-04.md` (Sprint 17 baseline)

---

## Section 1 — Tier ladder verdict: **HOLD**

The Sprint 17 ladder (Free / Small Church $19 / Growing Church $49 / Network $199+) survives this review intact. Two independent inputs converge on the same conclusion and no input forces the other direction.

**Rationale.** Research confirmed only one material competitor move since 2026-04-17 — Breeze ChMS $67 → $72/mo (+7.5%), in an indirect ChMS tier that does not pressure our $19 or $49 rungs (research-findings.md §Verdict; §Per-competitor delta table row 9). Among the four direct prayer-first competitors, zero have any ChMS integration today, so the $49 rung's PCO differentiator remains category-unique two days after Sprint 18 shipped (research-findings.md §Integration landscape — "Decisive finding"). CustomerSuccess independently rated the $49 Growing Church tier the ladder's **strongest rung** on value-per-dollar (customersuccess-findings.md §Segment 2 — "center of gravity," Tier price "G"), and the $19 Small Church tier green on features and green on price (§Segment 1 — Tier price "G"). The ship-stopper issues that Architect found are claim-integrity problems on specific marketing bullets, not pricing-structure problems — they can be fixed by stripping copy without re-ranking tiers (architect-findings.md §Severity summary). No ADJUST or REDO signal surfaced. **Do not revisit tier math this sprint.** If the recommended Free-cap bump lands (see §3) and post-Sprint 17 conversion data still reads below 3% by Sprint 19, that is the trigger to re-open pricing — not this review.

---

## Section 2 — Church-channel readiness verdict: **GO-WITH-CONDITIONS**

The Small and Medium segments are ready for paid acquisition today; the Large segment is not, and three Pro-tier marketing claims must be reconciled with code before any broad outreach. The conditions below are gates, not nice-to-haves.

**Gating gaps (must clear before scaled Pro outreach):**

1. **PDF reports claim vs. no PDF code** — Owner: **Backend**, Effort: **M**. The "PDF reports" bullet sits on Pro's Advanced Analytics line; no PDF generator (`@react-pdf`, `pdfkit`, or `puppeteer`) exists anywhere in `src/` (architect-findings.md §Claims Matrix row 8, flagged as ship-stopper). Options: ship a generator, downgrade copy to "CSV exports," or mark "PDF — coming soon."
2. **"Small groups sync too" vs. discarded groups** — Owner: **Backend**, Effort: **M**. `chms-sync-runner/route.ts:66` destructures the PCO groups array to `_groups` and never persists it; the adapter has no `syncGroup` method (architect-findings.md §Claims Matrix row 9c; §PCO-specific section row 2). Fix or remove the sentence.
3. **"Weekly prayer summary appears as a note on each person's PCO record"** — Owner: **Backend**, Effort: **S**. `pushPrayerSummary()` and the `push_summary` runner branch exist, but **no scheduler inserts those jobs** (architect-findings.md §Claims Matrix row 9d; §PCO-specific section row 3). A Monday-digest cron alongside `church-digest` would complete it.
4. **Large-segment positioning drift** — Owner: **PM + Copywriter**, Effort: **S**. Network tier advertises two "coming soon" items (SSO, custom subdomain) with no dated roadmap and an opaque "starting at $199" (customersuccess-findings.md §Segment 3 — Features "Y", Tier price "Y", Verdict: "NO (today)"). Until SSO/subdomain land, reposition Network as best-fit for **single-congregation 500+**, not multi-site/denominational — truthful positioning beats a vaporware list (customersuccess-findings.md §Segment 3 quick win #3).
5. **PCO webhook not populated + hero phrase regression** — Owner: **Backend (webhook) + Copywriter (hero)**, Effort: **S** (both). `webhookSecret` never written during OAuth, so real-time webhook sync silently drops (architect-findings.md §Claims Matrix row 9b; §PCO-specific section row 1). The Sprint 17-killed phrase "No one falls through the cracks between Sundays" is back on the hero (architect-findings.md §Claims Matrix row 22). Both are ship-allowed-with-label, not ship-stoppers — add a "nightly sync" qualifier and route the hero phrase past Legal.

Gaps 1–3 are the gate. Once those three Pro-tier claims are either shipped or stripped, scaled acquisition to the Small and Medium segments is GO. Large segment stays HOLD until SSO + subdomain land — that is a product gate, not a pricing gate.

---

## Section 3 — Top 3 recommendations (ordered by business impact)

1. **Reconcile the three Pro-tier ship-stoppers (PDF / PCO group sync / PCO weekly summary) — strip or ship, do not leave in-copy.** Owner: **Backend + Copywriter**, Effort: **M** (strip today; ship properly over one sprint). Addresses architect-findings.md §Severity summary — "Ship-stoppers (3): PDF reports (row 8), PCO group sync (9c), PCO weekly summary push (9d)." **Highest business impact because claim-integrity on the $49 tier is the FTC §5 framing Legal already applied in Sprint 17; every day these claims stay live on a page the paying buyer sees is compounding exposure** (architect-findings.md closing note: "a promise made inside the product the buyer paid for is a cleaner §5 case"). Stripping the copy is a same-day action; shipping the features is a Sprint 22 scope call.

2. **Raise Free cap 50 → 75 members (one-line edit in `src/lib/plans.ts`).** Owner: **Backend + Copywriter**, Effort: **S**. Addresses customersuccess-findings.md §If only one thing ships — "the 50 ceiling is the most common reason a tiny church gets blocked before feeling value." Feeds the top of the funnel that the whole ladder depends on; unlocks the 50–75-member band (the majority of plants and house churches per customersuccess-findings.md §Segment 1 missing features #3) to reach a real paid decision. Highest conversion-leverage change with lowest engineering cost in the entire review.

3. **Reposition Network tier for single-congregation 500+ churches only until SSO and custom subdomain land.** Owner: **PM + Copywriter**, Effort: **S**. Addresses customersuccess-findings.md §Segment 3 — Verdict "NO (today)" and quick win #3 — "truthful positioning beats a vaporware list." Prevents burning credibility with multi-site/denominational buyers during sales outreach and gives the real Enterprise product (SSO/subdomain) room to land before being promised. Copy change only; no code.

---

## What this assumes

1. PM accepts **HOLD** on tier math without a Finance re-run. If Finance data surfaces that 3% free-to-paid conversion isn't holding at the raised 50-cap, recommendation #2 still applies but the tier-ladder HOLD opens to ADJUST at Sprint 19 review.
2. The three ship-stopper claims can be stripped from marketing copy same-day as a tactical fix while engineering decides whether to build the underlying features. If Legal requires the features to actually ship before stripping (unlikely — stripping a claim reduces exposure, it doesn't create new), the timeline stretches.
3. The Large-segment repositioning is reversible — once SSO and custom subdomain ship, Network can re-assert multi-site fit without brand damage from the interim truth-telling.

## What needs human decision

1. **Build vs. strip on the three Pro-tier ship-stoppers.** Stripping is zero-risk and same-day. Building is a sprint-scope decision that belongs to PM + Architect, not this synthesis.
2. **How long Network tier stays in "single-congregation only" positioning.** If SSO/subdomain are more than one sprint away, PM should decide whether Network needs an interim price drop or whether holding at $199+ for single-site 500+ is viable revenue.
