# Sprint 20 Close-Out — Full Visual Audit (Public Pages)

**Closed:** 2026-04-18
**PM:** PM
**Status:** DONE — all 14 tasks approved and flipped to `done`.
**Reviewer sign-off:** `docs/sprint20/reviewer-signoff.md`
**Spec:** `docs/superpowers/specs/2026-04-18-sprint20-visual-audit-design.md`

---

## Goal recap

Sprint 20 was the full visual audit of the signed-out public surface, following Sprint 19's UI Modernization (which only touched 5 key surfaces). Every non-legal public page was to be pulled into visual + voice alignment with the post-S19 direction: amber palette, Lucide iconography in place of emoji, brand-guide voice (no §7 banned phrases), consistent section rhythm, ScrollReveal where appropriate. Scope was explicit — 10 pages — so the sprint could actually finish in one pass rather than sprawl.

## Delivered

**Copy briefs (Copywriter):** 8 per-page briefs at `docs/sprint20/copy-briefs/` — about, browse, contact, find-a-church, give, help, know-jesus, world-prayer. Consumed directly by Frontend.

**Page refreshes (Frontend, 11 commits):**
- HIGH: `/know-jesus` (7e065dd), `/give` (dacf006)
- Full treatment: `/about` (4d8e6c6), `/browse` (3cb217b), `/find-a-church` (5397355), `/world-prayer` (de09d85), `/contact` (b04979f), `/help` (c91b6f5)
- Light pass: `/sign-in` (5cd12ee), `/docs` (5cd12ee)
- Rework: `/help` + `/docs` §7 #2 cleanup (3be08c0)

**Designer spot-check:** `docs/sprint20/design-spotcheck.md` — both HIGH-priority pages approved.

**QA:** `docs/sprint20/qa-report.md` — 5-pass sweep + rework addendum. Caught two ship-stoppers (§7 #2 phrase still present on /help + /docs) that would otherwise have shipped.

**Reviewer:** `docs/sprint20/reviewer-signoff.md` — per-task verdict table, 10 accepted deviations, out-of-scope observations for future sprint.

## Notable decisions captured mid-sprint

- **PM ruling on pj-s20-11 /docs scope expansion.** Original task framing was "light pass — no content changes." QA found §7 #2 and §7 #5 banned phrases in two lines. Spec §4 explicitly requires banned phrases cleared. PM ruled spec §4 wins — two-line inline copy fix authorized rather than deferring. Right call: shipping with the violations would have invalidated success criteria.
- **Designer-gated HIGH pages.** /know-jesus and /give were routed through Designer spot-check before Reviewer because they are the highest-stakes evangelism + donation surfaces. This gate caught nothing blocking but confirmed jar/verse-strip decisions (/know-jesus deliberately has no jar and no extra verse strip; /give uses verbal jar motif only per brand §4.2). Worth repeating on future high-stakes surfaces.
- **Copywriter brief misses caught by QA, not Reviewer.** Two banned-phrase hits in /help and /docs existed in copy that was not fully covered by the briefs (because /docs was scoped as a light-pass). QA's banned-phrase sweep is what saved the sprint here — validates the decision to have QA run a codepoint + phrase grep across all 10 scope files rather than trust per-page brief coverage.

## Carry-forward for future sprints

- **Phase 2 visual audit — secondary public pages.** Reviewer logged these as out-of-scope-but-noticed: `wrapped/[year]`, `error.tsx`, `campaigns/[slug]`, `praise-wall`, `find-a-church/[placeId]`, `testimony/[id]`, `press`, `terms`, `trust`, `legal/*`, and the `docs/` sub-pages (`docs/features`, `docs/churches`, `docs/guide`, `docs/paid`). Several still contain emoji or "platform" text. Legal pages are intentionally frozen; the rest are fair game. Suggest Sprint 21 or later: "Phase 2 visual audit — secondary public pages and docs sub-pages."
- **/press has a §7 banned phrase.** Specifically called out by Reviewer. Was NOT touched in Sprint 20 because /press is out of scope. Should be the first file fixed when Phase 2 audit kicks off.
- **pj-s20-02 /know-jesus PrayerDialog wiring.** Brief allowed the `href="/"` fallback; Designer backlogged inline `<PrayerDialog />` as a non-blocking S21 follow-up.
- **Per-page brief coverage for light-pass tasks.** Today /sign-in and /docs were scoped as "light pass — no Copywriter brief." /docs then needed copy changes anyway. Either (a) always write a brief even for light-pass pages or (b) keep QA's banned-phrase sweep as the backstop — we did (b) this sprint and it worked. Leave as-is but flag for retrospective if it happens again.

## Retro — what worked / what to tune

**Worked:**
- QA's codepoint + banned-phrase grep across all scope files was the right mechanical backstop. Caught real ship-stoppers a per-page visual check would have missed.
- Designer gate on only the HIGH-stakes pages (not all 10) kept critical paths protected without slowing the sprint.
- Explicit 10-page scope with non-scope files named upfront prevented drift.

**Tune:**
- Light-pass tasks should still get a brief if the page has any prose longer than labels. /docs burned a rework cycle because no brief meant no phrase audit upfront.
- Reviewer noticed several adjacent files with the same issues (e.g. /press). Next time, PM should pre-declare a Phase 2 backlog item when scoping Phase 1 so the observation lands somewhere durable the moment it surfaces.
