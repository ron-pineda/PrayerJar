# Post-Sprint 20 /for-churches Strategic Review — Kickoff

**Kicked off:** 2026-04-19
**Sprint ID:** `21-review` (audit, not build)
**PM:** PM
**Status:** active — 5 tasks proposed in `.agent-state/tasks.json`

---

## Why this review

User flagged this after Sprint 16 (memory: `project_church_review.md`) and it has been queued ever since. Sprint 20 just closed the full visual audit of public pages. Before pushing the church channel (sales outreach, content marketing, partnerships), we need to know whether `/for-churches` is actually ready to convert the churches it attracts.

This is **not** an engineering sprint. Deliverables are findings docs + a single recommendation doc. No code gets written.

## The three user questions

1. **Feature sufficiency by size** — does `/for-churches` offer enough to attract small (<100), medium (100–500), and large (500+) churches?
2. **Claims vs. implementation** — are the features we advertise actually built and working?
3. **Pricing fairness** — is the current tier ladder (Free / $19 / $49 / $199+) competitive and fair across segments?

### Scope note on Q3
Q3 is **not** "price from scratch." Sprint 17 (2026-04-17) already ran a full Research + Strategist + Finance exercise that landed the current ladder. Research's task here is a **delta refresh** — what has moved since April 17, not a new survey. Strategist inherits the 2026-04-17 decision as the baseline and only revisits it if findings force it.

## Team (5 agents, lean on purpose)

| Agent | Task ID | Why |
|---|---|---|
| Research | `pj-s21r-01` | Delta refresh of competitor pricing + features since 2026-04-17. Feeds Q3. |
| Architect | `pj-s21r-02` | Claims-vs-implementation matrix across `/for-churches` + `src/lib/plans.ts`. Answers Q2 in full. |
| CustomerSuccess | `pj-s21r-03` | Per-segment fit rubric (small/medium/large). Answers Q1 in full. Leverages existing Sprint 17 onboarding audit muscle. |
| Strategist | `pj-s21r-04` | Synthesis: tier ladder verdict + go/no-go on church channel. Gated on the three above. |
| PM | `pj-s21r-05` | Consolidate into single user-facing doc at `docs/church-review/recommendations.md`. Gated on Strategist. |

### Roles explicitly **not** pulled in
- **Finance** — the 2026-04-17 model is the baseline. Only re-run if Strategist returns ADJUST or REDO on the tier ladder. Spin up a follow-up task at that time.
- **Sales, Designer, Legal** — the three user questions are strategic/audit, not funnel/UX/compliance. Loop back in during execution of any resulting recommendations, not during this review.

## Task flow

```
pj-s21r-01 Research  ─┐
pj-s21r-02 Architect ─┼─► pj-s21r-04 Strategist ─► pj-s21r-05 PM ─► recommendations.md
pj-s21r-03 CustSucc  ─┘     (synthesis)             (consolidate)
```

Tasks 01/02/03 run in parallel. Strategist blocked on all three. PM blocked on Strategist.

## Deliverables

| File | Owner | Contents |
|---|---|---|
| `docs/church-review/research-findings.md` | Research | Competitor delta vs 2026-04-17. Under 2 pages. |
| `docs/church-review/architect-findings.md` | Architect | Per-feature claims matrix with state verdict (built/partial/stub/missing/coming-soon). |
| `docs/church-review/customersuccess-findings.md` | CustomerSuccess | Per-segment fit rubric with green/yellow/red + yes/no/conditional verdict. |
| `docs/church-review/strategist-synthesis.md` | Strategist | Tier-ladder verdict (HOLD/ADJUST/REDO) + channel-readiness verdict (GO/GO-W-CONDITIONS/HOLD) + max-3 recommendations. |
| `docs/church-review/recommendations.md` | PM | **The user-facing doc.** Under 2 pages. Direct answers to the 3 questions + prioritized action list. |

## Timing expectations

- Research / Architect / CustomerSuccess: parallel, each target-complete within one working day.
- Strategist: one working day after all three land.
- PM consolidation: same day as Strategist hands back.
- **Target close:** within 2–3 working days of kickoff.

## How findings roll up

The four specialist docs are the **receipts**. The user reads `recommendations.md` only. That doc must name, for each of the three questions:
- a one-line verdict,
- a one-line rationale,
- the specialist doc that backs it.

If the user wants depth, they open the specialist file cited. The summary is for decision-making.

## Context notes for specialists

- **Sprint 17 already did hotfix cleanup on claims**: AI-Flagged Care killed (path-a decision doc: `docs/decisions/ai-flagged-care-claim-2026-04.md`), SSO/SAML/subdomain marked coming-soon, SLA + dedicated-support removed. Confirm those still hold and look for **new** drift introduced by Sprints 18 (PCO) / 19 (UI) / 20 (visual audit).
- **Sprint 18 carries known gaps**: webhookSecret not populated during OAuth (deferred to a future sprint), and PCO sandbox integration tests pending human credentials. These are material for the Architect claims audit — anything /for-churches says about PCO that depends on those gaps is "partial" not "built."
- **Phase 2 visual audit** is a separate carry-forward from Sprint 20 (see `docs/sprint20/sprint-close.md`). Do not let this review's scope collide with that backlog — this review is strategic, not visual.

## Sharp framing disagreement (surfaced to user)

The user's memory framed Q3 as "is pricing fair and competitive?" — open-ended. Sprint 17 answered that exhaustively 2 days ago. This review scopes Q3 as **"has anything changed since 2026-04-17 that would invalidate the tier decision?"** — a delta, not a rerun. If Research returns "nothing material changed," Strategist holds the ladder and the user gets a cheap, honest "still good." If something moved, we revisit. Worth saying out loud so the user isn't surprised by a shorter-than-expected Research task.
