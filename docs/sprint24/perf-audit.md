# Sprint 24 Performance Audit Refresh (pj-s24-06)

**Date:** 2026-07-19 · **Agent:** Performance · Re-verification of Sprint 14 findings against current code.

All three Sprint 14 findings are **confirmed still present**, plus additional image sites the
original audit missed. Prioritized for pj-s24-07 (impact × effort):

## P1 — find-a-church is still 100% client-side
`src/app/(public)/find-a-church/page.tsx` — 293 lines, `"use client"` at the top, uses
`useSession()`. The whole page (hero, copy, search UI) ships as client JS; LCP waits on hydration.
It's also a **public SEO surface** (church discovery), where server rendering matters most.
**Fix:** server-render the shell (hero/copy/layout) in a server `page.tsx`; move the interactive
search into a client child component. `useSession` → pass session from the server via `auth()`.

## P2 — prayer-card.tsx statically bundles 3 dialogs + celebration into every card
`src/components/prayer-card.tsx:14,18-20` — `CelebrationAnimation`, `PrayerEditDialog`,
`PrayerTestimonyDialog`, `PrayerDeleteDialog` imported statically; every feed page pays for all
of them per-bundle even though they open rarely. `toast` (sonner) is fine to keep static — tiny
and used on the happy path.
**Fix:** `next/dynamic` the three dialogs + celebration (`ssr: false`, render only when opened —
state flags already exist at lines 53-55).

## P3 — unoptimized `<img>` (CLS + no responsive sizing)
Confirmed sites (all `<img>`, no `next/image`, no width/height reservation except `loading="lazy"`):
- `src/components/prayer-card.tsx:155,185` (feed — highest traffic)
- `src/components/guided-prayer.tsx:154`
- `src/components/praise-card.tsx:47`
- `src/components/photo-upload.tsx:84` (preview blob URL — `next/image` N/A, add explicit dimensions)
- `src/app/(dashboard)/profile/page.tsx:35` (avatar, fixed-size container — low priority)
- `src/app/(public)/embed/[churchSlug]/widget/page.tsx:24` (embed widget — leave as `<img>`,
  embeds shouldn't pull the Next image loader; add width/height attrs)
- `src/app/(public)/p/[id]/page.tsx:99` (public share page — SEO surface, worth `next/image`)

**Fix:** `next/image` with `fill`/sized containers on prayer-card, praise-card, guided-prayer,
/p/[id]; explicit dimensions on the rest. Vercel image optimization is already available (no config).

## Not doing
- Fonts/scripts: no third-party scripts found; next/font already in use (verified in layout).
- No bundle-analyzer run this sprint: `npm run build` is broken on the dev machine
  (pj-s24-05); re-run analyzer once local builds are restored.

**Handoff:** pj-s24-07 implements P1→P3 in that order. Each lands as its own commit; visual
regression check on Vercel preview per page touched.
