# Sprint 24 Kickoff — Production Readiness + Signed-In UI/UX Polish

**Date:** 2026-07-19 · **PM:** Claude (PM role) · **Approved:** Ron ("close sprint 23 and start sprint 24")

## Goal

Ron's directive: *"Polish what's existing right now and make it production ready. I'm also open to
improvements in UI and UX."* No new feature surface. SSO + PDF analytics stay parked
("coming soon" labels remain honest gaps).

## Roster (per CLAUDE.md full-roster rule)

PM, Architect, **Designer**, Frontend, Backend, **Performance**, **DevOps/SRE**, QA, Reviewer.
Not pulled in: Strategist/Growth/Sales (no market-facing scope this sprint), Legal (no contract
surface change), Mobile/AIEngineer (no scope).

## Workstreams

### A. Production readiness (carry-in debt)
1. **Test suite red** — 5 pre-existing vitest failures (billing.service, church-platform.service ×2,
   event.service, feature-flags, checkout route). A red suite hides regressions; must be green
   before any polish merges.
2. **Verify-page URL bug** — NextAuth `verifyRequest: '/sign-in?verify=1'` produces
   `/sign-in?verify=1?provider=resend&type=email` (double `?`); the "check your email" banner
   detection likely never fires. Found during 2026-07-19 auth debugging.
3. **Welcome-drip health check** — drip emails were dead April→July (Resend DNS outage, fixed
   2026-07-19). Verify cron sends emails 1–3 correctly now; check for churches stuck mid-drip.
4. **Observability** — Better Stack log drain (INBOX carry-over). The email outage went unnoticed
   for 3 months; a log drain with alerting is the direct countermeasure.
5. **Local dev restore** — `npm run dev` and `npm run build` both fail on Ron's Windows machine;
   all visual work currently detours through Vercel previews. Fix or document root cause.

### B. Performance (Sprint 14 audit follow-through)
6. **Audit refresh** — re-verify the Sprint 14 findings against today's code before fixing:
   unoptimized `<img>` in prayer-card/guided-prayer, find-a-church 100% client-side,
   Sonner+dialogs bundled per-card. Produce a confirmed, prioritized fix list.
7. **Implement confirmed fixes** — gated on #6.

### C. Signed-in UI/UX polish (Designer-led)
8. **Design audit** — page-by-page pass of the signed-in surface against
   `docs/brand/brand-guide.md`: /pray, /my-prayers, /profile, /journal, /notifications,
   /badges, /saved-churches, /settings, church dashboard. Sprint 20 refreshed the signed-out
   surface; this is the matching pass for members. Deliverable: per-page delta specs.
9. **Implement design deltas** — gated on #8, page-scoped tasks fanned out after the audit lands.

### D. Close
10. QA sprint pass · 11. Reviewer sign-off + sprint close.

## Sequencing

A1 (tests green) and A2 (verify-url) start immediately — they gate everything else merging safely.
B6 and C8 run in parallel as audits. A3–A5 are independent. Implementation tasks (B7, C9) start
as their audits land. QA/Reviewer close per Definition of Done.
