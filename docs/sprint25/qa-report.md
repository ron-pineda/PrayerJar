# Sprint 25 — QA Report

**Task:** pj-s25-06 · **Date:** 2026-07-22 · **Result: PASS**

Sprint 25 was a polish pass on existing surfaces (Ron's direction). No new features.

## Automated gates

| Gate | Sprint start | Sprint end | Verdict |
|---|---|---|---|
| Vitest | 459 passing | **459 passing, 0 failing** | PASS |
| `tsc --noEmit` total src errors | **193** | **0** | PASS (the headline win) |
| `tsc` app-code errors | 0 | 0 | PASS |
| ESLint (changed files) | — | no new errors | PASS |
| `next build` | passing | **passing, 108/108 pages** | PASS |
| Working tree | — | clean, all pushed | PASS |

The 193 → 0 type-error result is the sprint's biggest single item: the whole test suite is now
type-clean, so `tsc` will actually surface a real regression instead of drowning it in fixture
noise. Verified independently (not just the agent's self-report): 0 `as any` introduced, only
`.test` files touched, no production types weakened.

## Live verification (production)

- `/api/health` → `{"status":"ok","db":true,"email":true}`.
- `/browse` (no filters) now renders "Be the first to share a prayer" — the broken
  "Nothing here yet in ." string is gone.
- `/map` carries its screen-reader `<h1>`.
- `/docs/guide` renders emoji-free (Lucide throughout).
- Public heading audit (done live pre-deploy): all 22 public pages have exactly one h1 and no
  heading-level skips.

## Coverage notes

- Accessibility was audited on the public surface via live rendering. Signed-in-only pages require
  auth to render, so their a11y was reviewed from source (they use the shared `EmptyState` and
  labeled form components); a deeper logged-in axe pass is a reasonable future task.
- The bundle analysis found the app already well-split (recharts and leaflet both isolated); the
  one clean win — deferring recharts on the analytics route — was landed. See `bundle-report.md`.

## Carry-forward

- Deeper logged-in accessibility pass with a real axe/screen-reader tool.
- The homepage still has two pre-existing eslint errors (`<a href="/pray">` should be `<Link>`,
  one unescaped entity) that predate this sprint and were out of scope.
