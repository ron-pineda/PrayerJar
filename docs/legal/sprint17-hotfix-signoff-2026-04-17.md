# Sprint 17 — Hotfix Legal Sign-Off

**Date:** 2026-04-17
**Reviewer:** Legal agent (PrayerJar)
**Scope:** Three Sprint 17 consumer-protection / deceptive-advertising hotfixes currently in `status: review`.

> **Disclaimer — read first.** This is an internal Legal agent review. It does **not** substitute for qualified outside counsel. Every conclusion below — FTC §5 risk calls, GDPR framing, contract remediation guidance, refund exposure — should be re-validated by a licensed attorney before PrayerJar takes any action with external legal consequence (customer refunds, contract amendments, public statements, ToS/DPA publication). This document represents a defensible internal pass to unblock Reviewer, not a final legal opinion.

---

## Summary of verdicts

| # | Hotfix | Task ID | Verdict |
|---|---|---|---|
| 1 | Kill "AI-Flagged Care" marketing claim | `pj-s17-hotfix-ai-claim` | **APPROVED WITH CONDITIONS** |
| 2 | Reconcile Enterprise-tier claims (SSO/SAML/SLA/subdomain/dedicated support) | `pj-s17-hotfix-enterprise-claims` | **APPROVED WITH CONDITIONS** |
| 3 | Reconcile Pastoral Dashboard tier across plans.ts / FAQ / gating | `pj-s17-hotfix-pastoral-consistency` | **APPROVED WITH CONDITIONS** |

No hotfix is rejected. Each core remediation is sound and lands the public-facing claim back in the vicinity of reality. The conditions in each section are the residual items Reviewer should confirm are tracked before closing — they are not blockers for the committed work, but they are the shape of the next deceptive-practices claim if left indefinitely open.

---

## 1. Hotfix: AI-Flagged Care claim — `pj-s17-hotfix-ai-claim`

### Decision reviewed

Architect chose **path (a): kill the claim**. Decision doc: `docs/decisions/ai-flagged-care-claim-2026-04.md` (2026-04-17). Eleven public-facing occurrences of "AI-Flagged Care" / "flagged care alerts" / "automatically surfaced" / "falls through the cracks" were removed from the for-churches page, /docs/paid (feature-comparison table and FEATURE_DEEP_DIVES card), /docs/churches, /docs/features, /help, and plans.ts Pro-features bullet. Self-harm submission flow (`prayer.service.ts:41–45`) intentionally unchanged — current behavior rejects + shows `CrisisResources` dialog (988 / Crisis Text Line / IASP / NAMI / BetterHelp); user-facing crisis UX remains live. `flagPrayer()` and the `prayer_flags` table remain in the codebase as latent infrastructure, not advertised.

### Findings

**The core public-facing claim is gone.** A repository grep for `AI.?[Ff]lagged|flagged care|falls through the cracks|automatically.?surfaced` across `src/` returns zero hits. That cleanly remediates the FTC §5 exposure on the top-of-funnel marketing surface, which was the biggest exposure — pricing and home-page claims.

**Self-harm safety path is preserved.** The decision to keep `reject + CrisisResources` rather than convert to `flag + save` is correct for the hotfix window. Shipping a half-built `flag` flow onto a user-safety pathway — fail-open gateway, `claude-haiku-4.5` tier, no eval harness, no alerting — would, as Architect notes, create *more* §5 and direct-harm exposure than leaving the current UX in place. The submitter still sees 988 immediately. That is adequate.

**Residual claim leakage — the condition gating my approval.** Five surfaces still imply an AI-flagged-care capability to the buyers we charge for it (pastors and church admins). The task brief asked Legal specifically to check `pastor-tips.tsx:8`; I am calling all five out because FTC §5 applies to the in-product experience the paying buyer receives, not just the landing page copy. Arguably, a promise made *inside the product the buyer paid for* is a cleaner §5 case than one on /for-churches, because the buyer has relied on it to close the purchase:

1. `src/components/church/pastor-tips.tsx:8` — *"use the flagged prayers dashboard to catch anything that needs pastoral care before it reaches the congregation"* (in-app to pastors). Architect labeled this "lower-priority follow-up; not a public marketing promise." I disagree on the risk framing: a pastoral pro-tier subscriber is the paying customer, and this tip confirms a capability the dashboard does not deliver.
2. `src/app/(church)/church/[slug]/setup/page.tsx:81` — *"Monitor flagged prayers, assign to your team, and send weekly digests."* This is onboarding copy shown to a brand-new paying church, framed as a reason to launch the Pastoral Dashboard. Same §5 problem as #1, arguably worse because it is presented at the moment of activation.
3. `src/app/(church)/church/[slug]/dashboard/page.tsx:117–121` — the dashboard nav still renders a "Flagged Prayers ({count})" link, and the child page `src/app/(church)/church/[slug]/dashboard/flagged/page.tsx` exists. A Pro admin clicks it, lands on an always-empty queue with "No flagged prayers. All clear!" as the empty state — which reinforces the false inference that the queue is working and everything is currently fine.
4. `src/app/(public)/docs/churches/page.tsx:42` — *"Pastor (can view pastoral dashboard and flagged prayers, add notes, make assignments)"* — this is on the **public** admin-guide page. It is external-facing and was missed by the hotfix's surface inventory.
5. `src/app/(public)/docs/features/page.tsx:204` — *"Flagged content is reviewed by the PrayerJar team and church pastors."* This is still on the public features page and still implies the church-pastor review leg of the pipeline, which does not run in production. (Note: `docs/features/page.tsx:202` — "AI safety screening… screens for crisis language, self-harm indicators, and sensitive content" — **is** accurate because `moderateContent()` actually runs; that line can stay.)

Separately: `src/app/(public)/about/page.tsx:49` references "connects anyone in crisis with" — I read it as describing the crisis-resources dialog, which does exist; acceptable. `src/app/(public)/trust/page.tsx:43–45` describes the crisis-resources UX accurately. Both should stay.

### Residual risks for existing customers

- **Existing Pro-tier churches.** Any church currently on Pro that was sold on the "AI-Flagged Care" feature has, arguably, a refund or credit claim. Mitigation: Product/PM should audit Pro-tier accounts created between the first public marketing of that claim and 2026-04-17 and decide proactively (a) whether to notify them the feature is being re-scoped, (b) whether to offer any credit, and (c) whether the next ToS update should grandfather them. I recommend at minimum a notification — *not* a refund by default, because the dashboard, notes, assignments, private wall, and analytics are real — but the decision is above Legal's pay grade and belongs with PM/Finance/outside counsel. Queue as Sprint 18 item.
- **Self-harm liability if someone slips through.** The core mitigation is that we no longer *advertise* the pastoral-team surfacing, which is the §5 concern. The separate direct-harm concern — a crisis prayer with a false-negative moderation call goes through un-flagged — is unchanged by this hotfix. That is a product/engineering risk the AIEngineer audit already owns and that a future `pj-s1X-crisis-classifier-v1` task should address. Today's behavior (reject + crisis-resources dialog) is defensible.

### Documentation obligations

- The decision doc (`docs/decisions/ai-flagged-care-claim-2026-04.md`) cleanly documents the rationale. ✓
- **ToS** does not mention AI or moderation today. That is actually protective for the moment — there is no contradiction. However, the Sprint-17 compliance review already flagged that ToS needs: an AI-assists-not-substitute disclaimer, a pastoral-responsibility clause, and a "platform is not a crisis service" clause. Not a hotfix blocker; queue for Sprint 18.
- **Privacy Policy** — the separate recommendation to name prayer content as "sensitive pastoral data" (GDPR Art. 9 / CCPA sensitive) is still open from the earlier compliance review. Not a hotfix blocker; Sprint 18.

### Verdict

**APPROVED WITH CONDITIONS.** Reviewer may mark `pj-s17-hotfix-ai-claim` as `done` once the following are explicitly tracked (they do **not** all have to be fixed before closing this hotfix — but they must be named in tasks.json so they do not disappear):

- **Condition A1 (must track before close).** A Sprint-17 follow-up task is created to remove/reword the five residual surfaces listed above (#1–#5). Specifically: pastor-tips.tsx:8, setup/page.tsx:81, docs/churches/page.tsx:42, docs/features/page.tsx:204, and a product decision on the dashboard "Flagged Prayers" nav link + child page. Suggested task ID: `pj-s17-hotfix-ai-claim-followup`. If the tree is actually going to be allowed to sit until the real classifier is built, the nav link should be hidden by feature flag, not left in a "No flagged prayers. All clear!" state that implies everything is fine.
- **Condition A2 (track for Sprint 18).** Crisis-classifier v1 build (`pj-s1X-crisis-classifier-v1`): eval harness, Sonnet-tier prompt, fail-open alerting, UX decision (flag vs reject), per-church threshold. Cannot re-publish any AI-flagging marketing claim until this ships.
- **Condition A3 (track for Sprint 18).** ToS rewrite to add AI-assists-not-substitute disclaimer, pastoral-responsibility clause, and platform-is-not-a-crisis-service clause. (Attorney-reviewed; carried over from `sprint17-church-compliance-2026-04-17.md`.)

---

## 2. Hotfix: Enterprise-tier claims — `pj-s17-hotfix-enterprise-claims`

### Decision reviewed

Security authored a reconciliation matrix in `docs/decisions/enterprise-claims-2026-04.md`. Resolutions:

| Claim | Resolution |
|---|---|
| `SSO / SAML` | COMING SOON (Sprint 19+) |
| `Custom subdomain` | COMING SOON (Sprint 19+) |
| `SLA` | REMOVED |
| `Dedicated support` / `Dedicated account manager` | REMOVED |
| `Everything in Pro` / `Unlimited events` / `Unlimited admins` | KEPT (code-backed) |
| Custom Branding marketing card | REWORDED — subdomain moved to "coming soon"; "not a third-party platform" removed |
| New bullet | `Custom agreement available` (replaces "SLA" / "Dedicated support" as the Enterprise differentiator) |

Copy applied to `src/lib/plans.ts:78–85`, `src/app/(public)/for-churches/page.tsx:38`, and `src/app/(public)/docs/paid/page.tsx:93–94` in the same commit.

### Findings

**Matrix is sound.** The reasoning on why Google Workspace cannot be labeled "SSO with qualification" — `allowDangerousEmailAccountLinking: true` plus no `hd`/`hosted_domain` enforcement — is the correct read. "Coming soon" for SSO/SAML and subdomain is honest, because the code has enough scaffolding (OAuth stack, `churches.subdomain` column) that an ETA is defensible. Calling them "keep-with-qualification" would have been confirmation bias.

**Removing SLA also resolves a collateral contradiction.** `src/app/(public)/terms/page.tsx:33` says *"We do not guarantee uptime, data retention beyond our stated policies, or any specific outcome."* Before the hotfix, that sentence directly contradicted the plans-page SLA claim — and the contradiction *itself* compounds the FTC §5 exposure (you cannot plead ignorance when the two surfaces are on the same site). Post-hotfix, the two surfaces are no longer in conflict. This is a clean resolution and worth calling out as a **positive finding**.

**"Coming soon" creates an implied-timeline concern, but a bounded one.** Advertising a feature as "coming soon" without a committed date has weaker but still real §5 exposure — "reasonable time expectation" jurisprudence. Mitigations the decision doc already puts in place: (a) the label is in the bullet itself, not a footnote, so the reasonable consumer sees the qualifier at the same visual weight as the claim; (b) the /docs/paid comparison table renders the Enterprise column as the literal string `"Roadmap"` rather than a green check, which further dampens the inference; (c) Sprint 19+ build tasks are named in the doc so the follow-up does not evaporate. Those three choices together are enough for my pass. If by Sprint 20 neither subdomain routing nor SSO has shipped, the "coming soon" bullets need to be reassessed — either ship, pick a specific ETA, or remove.

**Scope expansion was correct.** Security expanded beyond the task brief to also edit `/docs/paid` — there is a second hard-coded Enterprise-claim comparison table there that the task brief missed. That is exactly what a specialist pass should do; commending it.

**Residual contracts question — the primary condition.** The task brief framed this as a marketing-copy problem, and it is. But the residual risk is *not* in Stripe subscription metadata (Enterprise is "contact sales" with no Stripe price ID — I verified: no `STRIPE_PRICE_ENTERPRISE` env var exists anywhere in the codebase). The residual risk is in **any existing signed order form, proposal PDF, email thread, sales deck, or custom-agreement draft that was sent to a prospect or customer and that referenced SSO, SAML, SLA, or dedicated-support/account-manager language before 2026-04-17.** Those artifacts are outside the repo and cannot be found by codebase grep. PM / Sales should answer, for the record:
  - How many Enterprise prospects have received materials (verbally or in writing) that quoted the old feature list?
  - Have any executed order forms or letters of intent incorporated any of the four removed claims by reference?
  - If yes, do those customers need notification / contract amendment / credit?

This is a contract-audit task, not a subscription audit. It lives with PM + outside counsel, not Legal agent alone.

### Residual risks for existing customers

- **Existing Enterprise customers (if any).** If any church is currently on Enterprise (even at $0 / handshake pricing) and was told SSO/SLA/dedicated support would be part of the deal, the removal of those claims from the public site does not clean up an earlier representation made one-on-one. Mitigation: PM confirms headcount, identifies any who were pitched using the pre-hotfix language, and handles notification/amendment on a case-by-case basis. Outside counsel should be consulted if any signed agreement references the removed items.
- **Prospective customers mid-funnel.** Any sales conversation currently in flight referencing SSO/SLA/dedicated should be refreshed to the new copy before a close.

### Documentation obligations

- **ToS.** Post-hotfix, the Terms' "we do not guarantee uptime" sentence no longer contradicts the plans page (positive finding). When an SLA is eventually re-introduced, Terms must be updated **in the same PR** to remove or narrow that disclaimer for paying plans; do not allow a second contradiction to emerge.
- **DPA / sub-processor page.** The earlier `sprint17-church-compliance` doc flagged both as enterprise-sales enablers and as baseline GDPR/UK-GDPR hygiene. Still open; not a hotfix blocker. Sprint 18.
- **Custom agreement template.** The new "Custom agreement available" bullet writes a check that, when cashed, needs an actual negotiable template. If we do not have one, we are substituting a marketing phrase for a contract. Strongly recommend Legal + outside counsel draft a baseline MSA template before the next Enterprise sale. Sprint 18.

### Verdict

**APPROVED WITH CONDITIONS.** Reviewer may mark `pj-s17-hotfix-enterprise-claims` as `done` once the following are explicitly tracked:

- **Condition E1 (must track before close).** PM conducts a contract/communication audit for any existing or mid-funnel Enterprise prospects or customers who may have been exposed to the pre-hotfix claims (SSO/SAML, SLA, dedicated support, dedicated account manager, custom subdomain as delivered-today). If any exist, handle notification/amendment with outside counsel. Create a task: `pj-s17-enterprise-contract-audit`.
- **Condition E2 (Sprint 18).** Stripe dashboard audit: confirm that Stripe Price descriptions, invoice memo lines, and any email/receipt templates referencing the Starter/Pro/Enterprise tiers do not contain any of the four removed claims (SSO, SAML, SLA, dedicated support). Stripe copy is outside the repo and easy to overlook.
- **Condition E3 (Sprint 18).** Publish sub-processor page at `/trust/subprocessors` and draft a DPA at `/legal/dpa` — attorney-reviewed. Carried over from `sprint17-church-compliance`. These are enterprise-sales enablers and baseline GDPR/UK-GDPR posture.
- **Condition E4 (Sprint 18).** Legal + outside counsel draft a baseline MSA / custom-agreement template so the new "Custom agreement available" bullet is not a hollow phrase.
- **Condition E5 (Sprint 19+, tracked now).** The SSO/SAML and subdomain build tasks Security named in the decision doc must actually be created in tasks.json before Sprint 19 planning. "Coming soon" bullets that never resolve become their own §5 liability.

---

## 3. Hotfix: Pastoral Dashboard tier consistency — `pj-s17-hotfix-pastoral-consistency`

### Decision reviewed

(Path: `commit 200355d`. No standalone decision doc under `docs/decisions/` — the task brief and the commit body together constitute the ADR. That is acceptable given the scope; a full decision doc was not a listed acceptance criterion.)

Backend identified a **four-way** mismatch (the original legal flag noted three):
1. `src/lib/plans.ts` — "Pastoral dashboard" under Pro only (truth).
2. `/for-churches` FAQ — previously claimed "Starter and Pro" (wrong).
3. `/help` "For Churches" FAQ — vague, implied all church plans.
4. `src/app/(church)/church/[slug]/dashboard/page.tsx` — **no plan check at all**; only a member-role check. A free-tier admin could reach the Pastoral Dashboard they had not paid for.

#4 was the cleanest §5 risk (a paying Pro church gets the same thing a free-tier admin gets; a free-tier admin gets something Pro is paying for) and was the least-visible of the four until Backend's audit.

Resolution:
- `plans.ts` now exports `PASTORAL_DASHBOARD_TIER` (`'pro'`), `PASTORAL_DASHBOARD_TIER_NAME` (derived from `PLANS.pro.name`), and `hasPastoralDashboard(tier)` predicate. Single source of truth.
- `/for-churches` FAQ and `/help` "For Churches" FAQ now interpolate the tier name from `PASTORAL_DASHBOARD_TIER_NAME`.
- Dashboard page now awaits `getChurchTier()` and calls `hasPastoralDashboard(tier)`; free/starter admins see an upgrade prompt instead of the dashboard.
- New test `src/lib/plans.test.ts` — 11 tests, all passing. Covers: tier constant exists, name is derived from `PLANS` (not hand-typed), advertised tier lists the feature bullet, lower tiers do not, predicate is correct for all four tiers.

### Findings

**The core §5 risk is fully resolved for the three sources in the task brief.** The gate now actually matches the advertised tier. A paying church cannot be sold and billed for a feature they do not get; a non-paying admin cannot reach a feature they have not purchased. The test locks plans.ts as the source of truth and should catch regressions of "rename-the-tier" variety.

**Code-level design is defensively good.** Making `PASTORAL_DASHBOARD_TIER` and the predicate exportable means any future tier reassignment in `pj-s17-tier-redesign` is a one-line edit; the FAQ, /help, and the server-side gate all follow via import. This is the right pattern; when the audit-log tier retention (Starter 90d / Pro 1y / Enterprise 3y) and other tier-keyed features land, the same pattern should apply to them.

**Adjacent hard-coded tier references still exist — the primary condition.** Backend's commit-body "Scope note" names these and did not edit them because they were outside the 3-file brief:

- `src/app/(public)/docs/paid/page.tsx:88` — hard-coded comparison table with `pro: true` for "Pastoral dashboard". Currently correct, but if Strategist reassigns the tier (`pj-s17-tier-redesign`), this will drift.
- `src/app/(public)/docs/churches/page.tsx:78,88` — hard-coded "Pastoral Dashboard" + "pastoral dashboard (Pro plan)" strings. Same drift risk.
- `src/app/(church)/church/[slug]/setup/page.tsx:79` — "Launch Your Pastoral Dashboard" step in the setup wizard. No tier mention, so no drift risk — but worth noting in the audit.
- Nav label on the dashboard page itself (header text "Pastoral Dashboard") — hard-coded to the string, not the `PLANS.pro.name`. Minor.

Today these agree with plans.ts; tomorrow they may not. If `pj-s17-tier-redesign` happens and these hard-codes are missed, we re-open the same §5 risk this hotfix just closed. That is the condition.

**The test is real, not a placebo.** I read `src/lib/plans.test.ts`. It asserts the tier name is derived from `PLANS` (not hand-typed — that is the subtle one that prevents drift), confirms the advertised tier actually lists the bullet, and confirms no lower tier lists it. Solid.

### Residual risks for existing customers

- **Any current free-tier or starter church whose admin was reaching the Pastoral Dashboard** before this commit landed now sees an upgrade prompt. Product should verify no disruption (e.g., no dashboard bookmark that was the admin's only way to X is now a dead end for something they were entitled to). Based on the advertised tier being Pro, they were not entitled to it, so this is a correctness fix, not a customer harm. Mitigation: spot-check Sentry for 403-equivalent errors post-deploy. Minor.
- **No refund exposure.** Nobody was paying for the dashboard at a lower tier — the drift was that a free-tier admin could reach it, not that they were charged for a lower tier that advertised it. Inverse direction: no §5 customer-harm here.

### Documentation obligations

None net-new beyond what is already open from the other two hotfixes. The `help` page copy edit is in-scope here and has been made correctly.

### Verdict

**APPROVED WITH CONDITIONS.** Reviewer may mark `pj-s17-hotfix-pastoral-consistency` as `done` once:

- **Condition P1 (must track before close or Sprint 17 tier-redesign).** Adjacent hard-coded tier references in `docs/paid/page.tsx:88`, `docs/churches/page.tsx:78,88`, and the dashboard header text must be migrated to read from `PASTORAL_DASHBOARD_TIER_NAME` (and eventually an equivalent `FEATURE_TIER_NAME` pattern for other tier-keyed features). If this is not done before `pj-s17-tier-redesign` runs, a tier rename re-opens the §5 risk. Suggested task ID: `pj-s17-hotfix-pastoral-consistency-followup` or fold into the tier-redesign task's acceptance criteria.
- **Condition P2 (Sprint 18).** Extend the same pattern (tier constant + predicate + test) to every other tier-gated feature in `plans.ts`: live event walls, custom branding, advanced analytics, pastoral notes, priority support, unlimited members/groups. The pattern scales; use it before the next §5-flavored drift.

---

## Residual risks — ranked

1. **Contract/communications audit for existing Enterprise prospects or customers** (Condition E1). This is the single largest remaining exposure. Any pre-hotfix representation to a real buyer, in writing or verbally, that references SSO, SAML, SLA, or dedicated support, survives this hotfix unchanged. Cannot be cleaned up by code.
2. **In-product AI-flagged-care leakage** (Condition A1). Five surfaces still imply a capability the product does not deliver, four of them to the paying buyer. Not a blocker, but the §5 argument for an in-product promise to a paying pastor is at least as strong as the argument for a landing-page promise to a prospect.
3. **"Coming soon" has a half-life.** By Sprint 20, if SSO and subdomain routing have not shipped, the "coming soon" bullets convert from remediation back into deceptive-timeline exposure. Tracking SSR/SAML build (Condition E5) with real Sprint 19 work is not optional.

---

## Sprint 18+ queue recommended

These are already in part surfaced in `docs/legal/sprint17-church-compliance-2026-04-17.md`. Re-surfacing them here so they are tied to specific hotfix conditions:

| Task | Driver | Notes |
|---|---|---|
| `pj-s17-hotfix-ai-claim-followup` — remove/reword 5 residual AI-flagged surfaces + feature-flag dashboard nav | Condition A1 | Must be created in tasks.json before Reviewer closes hotfix 1 |
| `pj-s17-enterprise-contract-audit` — audit pre-hotfix prospect/customer communications | Condition E1 | Must be created before Reviewer closes hotfix 2 |
| `pj-s17-hotfix-pastoral-consistency-followup` — migrate adjacent hard-coded Pastoral tier references | Condition P1 | Or fold into `pj-s17-tier-redesign` acceptance criteria |
| `pj-s18-stripe-copy-audit` — audit Stripe dashboard price descriptions / invoice memos / email templates | Condition E2 | Sprint 18 |
| `pj-s18-tos-b2b-rewrite` — LoL cap, indemnities, governing law, AI-assists-not-substitute, pastoral-responsibility, not-a-crisis-service | Conditions A3, E3 | **Requires attorney review before publishing** |
| `pj-s18-privacy-policy-sensitive-data` — name prayer content as sensitive pastoral data (GDPR Art. 9 / CCPA), explicit no-training/no-secondary-use commitment, retention section | Earlier compliance doc | **Requires attorney review before publishing** |
| `pj-s18-sub-processor-page` — publish `/trust/subprocessors` (Resend, Vercel, Anthropic, Stripe, etc.) | Earlier compliance doc | |
| `pj-s18-dpa-draft` — draft DPA at `/legal/dpa`: church=controller, PrayerJar=processor, sub-processor list, SCCs for EU transfers, breach SLA, audit rights | Condition E3 | **Requires attorney review before publishing** |
| `pj-s18-msa-template` — baseline negotiable custom-agreement template backing the "Custom agreement available" Enterprise bullet | Condition E4 | **Requires attorney review** |
| `pj-s1X-crisis-classifier-v1` — eval harness, Sonnet-tier model, fail-open alerting, UX decision, per-church threshold | Condition A2 | No AI-flagging marketing claim can be re-published until this ships |
| `pj-s19-enterprise-sso` — per-tenant OIDC, `hd`-restricted Workspace, remove `allowDangerousEmailAccountLinking` | Condition E5 | "Coming soon" bullet depends on this |
| `pj-s19-subdomain-routing` — root `middleware.ts` for host-based routing | Condition E5 | |
| `pj-s18-sla-document` — if SLA is ever to be re-introduced: Legal drafts `docs/legal/sla.md`, Terms updated to remove the contradictory "no uptime guarantee" sentence for paying plans, SRE defines monitoring/credit policy | Earlier compliance doc | Only necessary if we intend to re-introduce the claim |

---

## Sign-off block

- `pj-s17-hotfix-ai-claim` → **APPROVED WITH CONDITIONS A1 / A2 / A3**
- `pj-s17-hotfix-enterprise-claims` → **APPROVED WITH CONDITIONS E1 / E2 / E3 / E4 / E5**
- `pj-s17-hotfix-pastoral-consistency` → **APPROVED WITH CONDITIONS P1 / P2**

All three tasks may be moved from `review` to `done` by Reviewer provided (a) the conditions marked "must track before close" are created as tasks in `tasks.json`, and (b) this sign-off doc is referenced from each hotfix task's notes.

— Legal agent, 2026-04-17

> **Reminder.** Internal Legal agent review. Not a substitute for qualified counsel. Recommend external legal review before any action with material external liability (refunds, contract amendments, ToS or DPA publication, SLA re-introduction, public statements regarding the remediated claims).
