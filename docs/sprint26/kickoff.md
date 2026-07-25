# Sprint 26 — Growth & Distribution

**Planned:** 2026-07-24 by PM · **Status:** tasks `proposed`, awaiting approval
**Roster:** PM, Growth, Analytics, Content, Copywriter, Frontend, QA, Reviewer

## Why this sprint

Sprint 25 closed 2026-07-22 with the product in good shape: 459/459 tests green, `tsc --noEmit` at
**0 errors** (down from 193), `next build` passing 108/108 pages, `/api/health` green on prod.
Every remaining engineering item is a carry-forward nice-to-have (deeper logged-in axe pass, two
pre-existing homepage eslint errors).

The numbers, confirmed against the prod DB on 2026-07-22: **6 users, 1 church, 11 prayers,
0 testimonies.**

Ron redirected Sprint 25 to polish *instead of* growth — "polish first, growth stays parked." That
polish is now done. Another polish sprint would be optimizing a product almost nobody has seen. The
bottleneck is that roughly six people know PrayerJar exists.

## The caveat, stated up front

An agent-built growth sprint produces **assets** — funnel instrumentation, SEO fixes, share
mechanics, a church outreach asset. It does **not** produce users. At n=6, **Ron is the growth
engine.** This sprint makes his outreach convert; it is not a substitute for the outreach itself.
Nobody on this sprint should report "growth work done" as though the number moved.

## Hard guardrail

**Real content only. Never fabricate prayers or testimonies.** Seeding the walls is the obvious
temptation at n=6 and Ron pre-vetoed it. Sprint 25 made empty states warm and directive precisely
so the walls can stay honest while they are thin. This applies to screenshots and marketing assets
too — no mocked-up walls presented as real activity.

## Tasks

All eight are in `.agent-state/tasks.json` as `proposed`. Per CLAUDE.md, they must be approved
before any assigned agent sets `in-progress`.

| ID | Owner | Task |
|---|---|---|
| pj-s26-01 | Copywriter → Frontend | **GATE.** Fix unbacked PDF-report claims in `/docs` |
| pj-s26-02 | PM | Reconcile `sprints.json`, `ROADMAP.md`, `INBOX.md` |
| pj-s26-03 | Analytics | Instrument the acquisition funnel |
| pj-s26-04 | Growth | SEO & discoverability audit |
| pj-s26-05 | Growth → Frontend | Share/invite path review |
| pj-s26-06 | Growth + Content | Church acquisition path + outreach asset |
| pj-s26-07 | QA | Sprint gate pass |
| pj-s26-08 | Reviewer | Approvals + sprint close |

### pj-s26-01 — the gate task (a live integrity bug)

Sprint 21-review's top action was reconciling three Pro-tier claims not backed by code. Sprint 22
fixed **PCO group sync** and **PCO weekly summary** and put an honest label on `/for-churches`
(`page.tsx:328`). **The PDF-reports claim was never cleaned up in `/docs`.** Three pages still
sell it as shipped:

- `src/app/(public)/docs/paid/page.tsx` — `FEATURE_MATRIX` row "Advanced analytics & PDF reports"
  with ✓ in the **Pro and Enterprise pricing columns**, plus a `FEATURE_DEEP_DIVES` body promising
  PDF export. This is a pricing comparison page; a ✓ for a feature that does not exist is the
  highest-severity form of this defect.
- `src/app/(public)/docs/churches/page.tsx` — "PDF reports / Download a formatted PDF report…"
- `src/app/(public)/docs/features/page.tsx` — "…downloadable as PDF."

Verified 2026-07-24: **no PDF implementation exists.** No `jspdf`/`pdfkit`/`puppeteer`/`react-pdf`/
`pdf-lib` in `package.json` or `src/`; every export route is CSV. The PDF build chain
(pj-s22-10/-14/-15/-20) remains deferred.

Advanced analytics **is** real — only the PDF export is vapor. CSV export **is** real. Separate the
shipped part from the unshipped part and use the honest-label convention already in the codebase
(`docs/paid` rows 93-94 use `'… (coming soon)'` + `'Roadmap'`; `CellIcon` renders any string
verbatim). Ships first, independent of everything else. **Do not build a PDF exporter.**

### pj-s26-03 gates the acquisition work

At n=6 we cannot tell a working channel from a broken one without knowing where visitors drop.
Instrument first, verified end-to-end from a real browser session — not just wired in code. Tasks
04/05/06 are blocked on this. Measure before optimize.

## Sequencing

- **pj-s26-01** and **pj-s26-02** start immediately and independently.
- **pj-s26-03** starts immediately; **04/05/06** are gated on it.
- **07/08** close per Definition of Done.

## Out of scope

SSO/SCIM cluster (5 tasks) and the PDF-report build chain (4 tasks) stay parked per Ron's April
decisions — the site ships honest "coming soon" labels instead, which is exactly what pj-s26-01
finishes. Deeper logged-in axe pass and the two pre-existing homepage eslint errors remain
carry-forward.

## Blocked on Ron, not on agents

These do not belong to any task above and move independently:

1. **Subdomain DNS setup** — open in `INBOX.md` since 2026-04-20, three months. Code is complete
   behind the `SUBDOMAIN_ROUTING` flag; six steps only Ron can do
   (`docs/ops/subdomain-launch-checklist.md`). Finished work that has never shipped.
2. **Sprint 22 leftovers** — clay vessel visual check, stale preview route, `migrate-dry-run`
   against prod.

## Gates (pj-s26-07)

| Gate | Requirement |
|---|---|
| vitest | 459/459 passing |
| `tsc --noEmit` | **stays at 0** — any regression is a sprint blocker |
| `next build` | 108/108 pages |
| Live prod | `/docs` copy fix verified on the deployed site, not from source |
| Instrumentation | events verified in the destination from a real browser session |
