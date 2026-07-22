# Sprint 25 — Bundle Analysis (pj-s25-05)

**Date:** 2026-07-22 · **Method:** clean `next build` (Turbopack) + inspection of
`.next/static/chunks`. The Turbopack build output does not emit per-route Size/First-Load columns,
so chunk sizes were read from disk and attributed to libraries by content signature.

## Headline: the bundle is already well split

Total client JS is ~2.3 MB across 88 chunks, but the heavy libraries are correctly isolated to
the routes that use them — nothing large leaks into the shared/global bundle:

| Library | Size | Where | Load strategy |
|---|---|---|---|
| recharts | ~371 KB | church analytics admin route only | route-split; now also deferred (below) |
| react-dom | ~228 KB | framework, all routes | unavoidable shared runtime |
| leaflet | ~150 KB | /map, /find-a-church | **runtime** `await import("leaflet")` inside the map component — never in initial route JS |

Prior sprints already did the feed-level work: Sprint 24 moved the prayer-card dialogs and
celebration to `next/dynamic` and swapped prayer images to `next/image`. So the two obvious
cold-path wins were already banked.

## Change made

**Lazy-load `AnalyticsCharts`** (`AnalyticsChartsLazy.tsx`). recharts was statically imported by
the analytics page, so the whole 371 KB shipped with that route's initial JS. It now loads via
`next/dynamic({ ssr: false })` behind a 4-tile skeleton, letting the page shell (heading,
description, back-link) paint immediately while the charts stream in. This is the single heaviest
route in the app; the change is contained to that route and does not touch the shared bundle.

## Deliberately not done

- **No shared-bundle trimming** — there is no heavy library in the global chunk to trim.
- **No leaflet change** — already runtime-imported; optimal.
- **No dependency removals** — nothing unused-but-bundled surfaced. Sentry (~part of shared) is
  intentional (error monitoring) and out of scope to rip out during a polish sprint.

## Verification

`tsc --noEmit` app-code clean, eslint clean on the changed files, `next build` passes 108/108
pages with recharts still isolated to its own chunk (now deferred, not route-blocking).
