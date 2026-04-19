# Sprint 22 Kickoff — Large-Church Readiness (re-scoped)

**Date:** 2026-04-19
**Status:** planned
**Size:** M (13 in-scope tasks; 5 SSO tasks + 4 PDF tasks deferred)
**Driver:** Sprint 21-review returned GO-WITH-CONDITIONS for the church channel; Large segment (500+) was NO-today. Ron re-scoped Sprint 22 on 2026-04-19 to ship a tighter, one-sprint-fits plan: park the enterprise-auth chain (zero demand today) and deliver the other Large-segment unblockers honestly. A second pass later the same day deferred the PDF reports chain to Sprint 23 — PDF reports aren't a Large-church sellability blocker (on-screen analytics are live today; only the download is missing).

---

## What's in / what's out

### IN — 13 tasks, three buckets

**Bucket C — Operational gate (starts day 1, blocks everything else schema-touching)**
- `pj-s22-01` DevOps: wire drizzle-kit migrate into deploy pipeline
- `pj-s22-02` DevOps: fix Vercel GitHub auto-deploy webhook (pj-001 recurrence)

**Bucket A — Quick wins (parallel, no deps)**
- `pj-s22-03` Backend + Copywriter: Free-tier member cap 50 → 75
- `pj-s22-04` Copywriter (fast-lane): kill reintroduced "falls through the cracks" hero + add "nightly sync" qualifier on PCO card

**Bucket B — Large-segment unblockers**
- `pj-s22-05` Architect: revise subdomain design for per-subdomain auth (SSO sections marked deferred)
- `pj-s22-08` Integrations: PCO group persistence (syncGroup)
- `pj-s22-09` Integrations: PCO weekly-summary scheduler
- `pj-s22-16` Backend: un-park subdomain (per-subdomain auth, no session sharing)
- `pj-s22-17` QA: subdomain test plan + execution (includes session-isolation cases)
- `pj-s22-18` QA: PCO group persistence
- `pj-s22-19` QA: PCO summary scheduler
- `pj-s22-21` Copywriter: Network-tier reposition (custom subdomain live; "enterprise login coming soon" AND "custom analytics reports coming soon" honestly labeled)
- `pj-s22-22` Reviewer: sprint close

### OUT — deferred (stay in tasks.json as `proposed` with deferral note)

**SSO chain (deferred first pass — zero enterprise demand today):**
- `pj-s22-06` Security: SSO review
- `pj-s22-07` Legal: enterprise SSO contract surface
- `pj-s22-11` Backend: SSO/IdP integration
- `pj-s22-12` Backend: SSO tier gating
- `pj-s22-13` QA: SSO test plan

**Rationale (PM, per Ron):** zero enterprise customers today. $125/church WorkOS cost and self-hosted alternatives both bad ROI pre-demand. SSO returns when a real enterprise church asks.

### Deferred to Sprint 23 — PDF reports chain

- `pj-s22-10` Analytics: PDF report content design
- `pj-s22-14` Designer: PDF report visual
- `pj-s22-15` Backend: PDF report generator
- `pj-s22-20` QA: PDF generator

**Rationale (PM, per Ron, 2026-04-19):** PDF reports are not blocking Large-church sellability — churches can see analytics on-screen today; only the download is missing. Pushing tightens Sprint 22 to 13 tasks and lets SSO-honest Large-church marketing ship sooner. No vendor cost incurred either way (react-pdf is free). The Network-tier copy (pj-s22-21) absorbs this with an added honest-gap label: "custom analytics reports coming soon" — paired with "enterprise login coming soon".

**Also deferred to Sprint 23 (already flagged pre-rescope):** SCIM auto-provisioning, bring-your-own-domain (`prayer.takeheart.org`). No Sprint 22 tasks exist for these.

---

## The subdomain simplification (critical — read before coding)

Custom subdomains ship. SSO does not. The previous design doc at `docs/architecture/sprint22-sso-subdomain.md` assumed **shared sessions across `prayerjar.org` and subdomains** because SSO was going to use a common tenant-resolution path. That assumption is now wrong.

**New constraint, enforced in pj-s22-05 / 16 / 17:**

> No cross-domain session sharing. Each subdomain is its own auth surface. A user signed in on `prayerjar.org` is not signed in on `takeheart.prayerjar.org`; users sign in separately on each host. Session cookies are host-scoped, not parent-domain-scoped.

Why: avoids the forced-logout-on-rollout problem, simplifies cookie/CSRF handling, and removes the main reason SSO was coupled to subdomain work. Architect revises §7 of the existing design doc (or replaces the doc) to reflect this. QA explicitly tests session isolation between apex and each subdomain, and between subdomains.

---

## "Enterprise login coming soon" AND "custom analytics reports coming soon" — labeling discipline (Copywriter brief)

This is the one sentence in Sprint 22 with the highest claims-vs-implementation risk. Sprint 21-review just cost us a hotfix because copy implied features that weren't shipped. Do not re-create that violation. Two honest-gap labels are now required on the Network-tier card.

**Acceptable phrasing:**
- "Enterprise login coming soon"
- "SSO coming soon — ask us if your church needs it"
- "Custom analytics reports coming soon"
- "Downloadable PDF reports coming soon" (on-screen analytics stays live language)
- (The "ask us if your church needs it" framing is optional and honestly tells Large churches the gate is demand, not timeline.)

**Unacceptable phrasing:**
- "Scheduled for Q2" / "Shipping next sprint" / any dated commitment
- "SSO available for enterprise" / anything that implies a current offering
- "Advanced PDF reports available" / "downloadable reports live" / any claim that PDF export ships this sprint
- "Coming in 2026" or any roadmap promise that could become a legal-expectation problem

Important distinction for PDF copy: **on-screen analytics remain live**. The gap is specifically the downloadable PDF. Copywriter must not accidentally strip on-screen-analytics language while removing PDF-download claims.

Copywriter's brief (pj-s22-21) must include the exact old-string → new-string pairs for BOTH honest-gap labels. Frontend applies verbatim. QA sweeps for §7 banned phrases AND confirms no string on `/for-churches` claims SSO is live OR PDF reports are live. Reviewer gates the whole flip.

---

## Dependency tree (simplified)

```
BUCKET C (gate — day 1)
  pj-s22-01 Drizzle pipeline (DevOps)           [independent]
  pj-s22-02 Vercel webhook fix (DevOps)          [independent]

BUCKET A (parallel quick wins)
  pj-s22-03 Free cap 50 → 75                    [independent]
  pj-s22-04 Hero + PCO qualifier copy           [independent, fast-lane]

BUCKET B
  pj-s22-05 Architect subdomain revise           [blocked_by: 01]
    └── pj-s22-16 Subdomain un-park              [blocked_by: 05, 01]
          └── pj-s22-17 Subdomain QA             [blocked_by: 16]
                └── pj-s22-21 Network reposition [blocked_by: 16]

  pj-s22-08 PCO group persistence                [blocked_by: 01]
    └── pj-s22-18 PCO group QA                   [blocked_by: 08]

  pj-s22-09 PCO summary scheduler                [blocked_by: 01]
    └── pj-s22-19 PCO summary QA                 [blocked_by: 09]

SPRINT CLOSE
  pj-s22-22 Reviewer sprint close                [blocked_by: 17, 18, 19, 21]

DEFERRED TO SPRINT 23 (not in this sprint's graph)
  pj-s22-10 → 14 → 15 → 20  (PDF chain)
  pj-s22-06, 07, 11, 12, 13  (SSO chain)
```

---

## Team roster (post-rescope)

Architect, Backend Engineer, Integrations (PCO), DevOps, Copywriter, QA, Reviewer, PM.

**Removed from roster with SSO defer:** Security, Legal. (Both return when SSO does.)
**Removed from roster with PDF defer:** Analytics, Designer. (Both return in Sprint 23 when the PDF chain picks up.)

---

## Risks to flag

1. **`pj-s22-01` drizzle pipeline is still the single biggest leverage item.** Every schema-touching task (subdomain, PCO group) blocks on it. If it slips a week, everything else slips a week. With PDF out, this is now the ONLY remaining structural gate.
2. **Copy discipline on pj-s22-21.** Biggest integrity risk in the sprint. See the "enterprise login coming soon" / "custom analytics reports coming soon" section above. TWO honest-gap labels are now required (not one). If subdomain ALSO slips, copy ships as "custom subdomain coming soon — enterprise login coming soon — custom analytics reports coming soon" and Network reposition becomes a softer "best-fit for single-congregation 500+" framing rather than "now with custom subdomain."
3. **PDF-copy confusion.** On-screen analytics are live today; only the PDF download is deferred. Copywriter must be explicit so we don't accidentally remove on-screen-analytics language while stripping PDF claims.
