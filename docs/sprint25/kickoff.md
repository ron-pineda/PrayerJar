# Sprint 25 Kickoff — Polish Existing Surfaces

**Date:** 2026-07-22 · **PM:** Claude · **Direction set by Ron:** "focus on what's currently
existing and polish it" (redirected away from a growth/acquisition sprint).

## Frame

The signed-out surface was refreshed in Sprint 20 and the signed-in surface in Sprint 24
(emoji→Lucide, brand voice, palette, perf). This sprint is the subtler polish layer on top of
that work — accessibility, empty-state warmth, code-health debt, and Sprint 24 leftovers. No new
features. Action-heavy: we fix, we don't just audit.

Context that shapes priorities: the production DB has 6 users / 1 church / 11 prayers, so **empty
and near-empty states are what most visitors actually see** — polishing them is the highest
user-facing ROI. Real content only; never fabricate prayers or testimonies.

## Roster

PM, Designer, Frontend, Backend, Performance, QA, Reviewer.

## Tasks

- **pj-s25-01 (Backend) — Eliminate the 193 test-fixture type errors.** `tsc --noEmit` reports
  193 errors, all in `.test.ts`/`.test.tsx` fixtures (mock objects missing schema fields from
  later sprints, missing vitest global imports). Kinds: 114× TS2352, 26× TS2345, plus TS2304/2582
  (missing `describe`/`afterEach` imports). Makes the type-check noisy enough to hide real errors.
  Fix the fixtures to match current types; do not weaken production types. Suite must stay green.

- **pj-s25-02 (Designer→Frontend) — Accessibility & rough-edge pass.** Audit the existing
  surface for a11y gaps and fix them in the same task (no separate spec doc unless a change needs
  design judgment). Known starting point: `/map` renders with no `<h1>`. Check heading hierarchy,
  focus order, keyboard traps in dialogs, color contrast on amber-on-amber, and `aria` on
  icon-only buttons introduced in the Sprint 24 Lucide sweep.

- **pj-s25-03 (Designer→Frontend) — Empty-state & first-run warmth.** At n=6 every wall is
  near-empty. Make empty states warm, specific, and directive (not "No prayers found") across
  /pray, /browse, /praise-wall, /my-prayers, /prayed-for, /journal, /notifications, church
  dashboard. Reuse the existing `empty-state.tsx` component.

- **pj-s25-04 (Frontend) — docs/guide emoji → Lucide.** Sprint 24 leftover: `docs/guide` drives
  section identity from an `emoji` field in a data structure. Convert to the shared Lucide
  pattern, matching the rest of the site.

- **pj-s25-05 (Performance) — Bundle analysis + quick wins.** Now that local builds work, run the
  analyzer, identify the heaviest routes/shared chunks, and land bounded quick wins (dynamic
  imports, dependency trims). No risky refactors.

- **pj-s25-06 (QA) — Sprint pass.** Full gate: vitest green, `tsc` app-code clean AND fixture
  errors resolved, clean production build, live spot-check.

- **pj-s25-07 (Reviewer) — Approvals + sprint close.**

## Sequencing

01, 04, 05 are independent and start immediately. 02 and 03 are Designer-audit-then-Frontend-fix,
runnable in parallel with each other. QA/Reviewer close per Definition of Done.
