# pj-s26-01-pdf-claims-fix — change detail

**Agent:** Copywriter + Frontend · **Date:** 2026-07-24 · **Status:** review (→ QA)

## Ground truth verified before editing

- No PDF library anywhere: `jspdf`, `pdfkit`, `puppeteer`, `react-pdf`, `pdf-lib`, `pdfmake` — zero hits in `package.json` and `src/`.
- The church analytics page (`src/app/(church)/church/[slug]/(admin)/dashboard/analytics/page.tsx`) has **no export of any kind** — not PDF, not CSV. It renders charts on screen only.
- `src/app/api/v1/export/route.ts` returns **JSON**, not CSV (user data export). The task description's claim that "every export route is CSV" is inaccurate.
- The only real CSV export is the event report: `src/app/api/v1/church/[slug]/events/[eventId]/report.csv/route.ts`.
- `getCategoryBreakdown` and `getAnsweredRate` are **all-time**, not 30-day windowed (only `getPrayerTrend`, `getInteractionTrend`, `getMemberGrowth` take `days = 30`). No time-window claim was added to docs as a result.

## Changes

### `src/app/(public)/docs/paid/page.tsx`

`FEATURE_COMPARISON` (the task brief called this `FEATURE_MATRIX`) — one row split into two:

- Before: `{ feature: 'Advanced analytics & PDF reports', free: false, starter: false, pro: true, enterprise: true }`
- After: `{ feature: 'Advanced analytics', free: false, starter: false, pro: true, enterprise: true }`
- Added, grouped with the other roadmap rows: `{ feature: 'Downloadable analytics reports (coming soon)', free: false, starter: false, pro: 'Roadmap', enterprise: 'Roadmap' }`

`FEATURE_DEEP_DIVES` — title `'Analytics & PDF Reports'` → `'Advanced Analytics'`; body's PDF sentence replaced with an on-screen statement plus an explicit not-yet-available line.

### `src/app/(public)/docs/churches/page.tsx`

- Section title `'Analytics & Reports'` → `'Analytics'` (leaving "Reports" re-implies the removed claim).
- Step heading `'PDF reports'` → `'Downloadable reports (coming soon)'`; body replaced.

### `src/app/(public)/docs/features/page.tsx`

- `'Analytics & reports'` → `'Analytics'`; `'… — downloadable as PDF.'` → `'… and category breakdown — on screen in the church dashboard.'`

## Conventions followed

- Honest-label convention already in the codebase: `(coming soon)` in the label + `'Roadmap'` string in the plan cell (`docs/paid/page.tsx:93-94`), and the "… are coming —" phrasing from `for-churches/page.tsx:328`.
- `CellIcon` renders any string verbatim, so `'Roadmap'` is valid in the Pro column; line 87 already puts a string (`'12/yr'`) there. No type change, no `as any`.
- Brand guide §7 banned phrases checked — none used.
- Deliberately **no CSV wording in any analytics context**, since analytics has no export. CSV remains claimed only where it is real (event reports: `docs/paid/page.tsx:119`, `docs/churches/page.tsx:162`, `docs/features/page.tsx:186`).

## Out of scope — for QA awareness, not fixed here

- Remaining `PDF` mentions in `src/` are the nonprofit IRS determination-letter **upload** (`src/app/admin/legal-verifications/page.tsx:102`, `src/db/schema.ts:871`). That feature is real; no action needed.
- The PDF build chain (pj-s22-10/-14/-15/-20) stays deferred. Nothing here implements an exporter.
