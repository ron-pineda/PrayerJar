# Sprint 15 — Stability & Quality Hardening

**Date:** 2026-04-16
**Status:** Design approved, implementation plan pending
**Theme:** Prevention-first. No new user-facing features.
**Goal:** The next `fix:` commit in this repo should originate from Sentry or CI — not from a user reporting a broken flow.

## Context

PrayerJar is live at https://prayerjar.org. Since March 2026, **96 of the last 294 commits (33%) are `fix:` commits**. The patterns are consistent:

- 8 OAuth fixes spread across Safari ITP, in-app browsers, cookie prefixes, PKCE, `trustHost`, `checks: []`
- Driver mismatches (`sql=ANY()` vs `inArray()`) that passed unit tests but broke on neon-http
- Production drift — missing `SessionProvider`, missing church tables
- Dialog / state regressions in My Prayers, PrayerCard overflow, add-prayer flow
- Double-interaction and SSE timeout classes in Sprint 12

Bugs are reaching production because there is no observability (you are the error reporter), no E2E coverage of the critical flows, and no CI gate preventing regressions. Sprint 15 closes those gaps.

## Approach — Bug Archaeology → Safety Net

Before any test is written or any tool configured, the Architect performs a **one-day archaeology pass** on the last ~100 `fix:` commits. Each fix is tagged with:

1. A **failure class** — what category of bug
2. A **safety-net control** — the specific test, tool, or gate that would have caught it

The output is a committed matrix that becomes the sprint's work plan. **No test, tool, or perf fix is included unless it maps to a real past bug.** This keeps scope tight and the resulting safety net demonstrably sized to actual failure modes.

### The six failure buckets (from preliminary scan)

| # | Failure class | Representative fix commits | Safety-net control |
|---|---|---|---|
| 1 | OAuth / cookie edge cases | `32c98cf` cookie prefix removed, `1bd90d9` checks:[], `a7024b1` trustHost added, `f73b5e7` in-app banner, `bdb7f1d` PKCE disabled | Playwright sign-in flow on mobile-Safari UA + Messenger/Instagram WebView UA |
| 2 | Driver / data-layer mismatches | `sql=ANY()` → `inArray()` replacement, `f3dea5f` homepage subquery | Integration tests hitting a real Neon preview branch, not mocks |
| 3 | Production drift (missing env/tables/providers) | SessionProvider missing in root layout; church tables missing in prod | Post-deploy smoke that loads every top-level route and asserts 200 + migrations-complete check |
| 4 | Dialog / state bugs on user actions | `c990752` My Prayers redirect, `a31b05c` homepage PrayerDialog, `08dab94` dialog lifecycle, `e1d49d7` toast mishandling | Playwright: add-prayer from homepage + My Prayers, overflow menu, pray-for, share — each with happy + cancel paths |
| 5 | Interaction double-fire / stuck side effects | Sprint 12 double-interaction; SSE timeout log spam; `6fac308` PrayerCardMenu | Unit + integration tests on interaction service (single-call invariant) |
| 6 | Permission / moderation gating | `6edbcaf` owner-actions gate, `88c0089` moderation on edit | Integration tests on service-layer authz (non-owner attempts should be rejected) |

### Three deliverables

1. **Observe** — Sentry (client + server, sourcemaps, release tracking) + Better Stack log drain + auth-error-rate alert
2. **Prevent** — Playwright E2E on golden flows + integration tests hitting a Neon preview-branch DB
3. **Gate** — CI blocks merge on test failure, typecheck, Lighthouse budget; post-deploy smoke on every Vercel production deploy

## Workstreams & Agent Assignments

A is blocking. B–E run in parallel after A. F is the close.

| # | Workstream | Owner | Depends on | Size | Output |
|---|---|---|---|---|---|
| A | **Bug archaeology** — tag last ~100 fixes by failure class → safety-net control mapping | Architect | — | 0.5 day | Tagged list + test-plan matrix, committed to `docs/superpowers/specs/2026-04-16-sprint-15-bug-archaeology.md` |
| B | **Observability** — Sentry (client + server, sourcemaps, release tracking) + Better Stack log drain via Vercel integration + auth-error-rate alert | Backend Engineer | A | 1–2 days | Errors visible in Sentry; alert fires on synthetic spike; Better Stack receiving Vercel logs |
| C | **E2E tests (Playwright)** — sign-in (Chrome + mobile-Safari UA + Messenger/Instagram WebView UA), add-prayer (homepage + My Prayers), overflow menu, pray-for, share | Frontend Engineer | A | 2–3 days | Green suite in CI; intentionally regressed commit proves suite catches breakage |
| D | **Integration tests** — Neon branch-per-PR + tests for driver quirks, interaction single-fire invariant, service-layer authz | Backend + Database Engineer | A | 2–3 days | Green suite against real Neon; fails when a mocks-only test would hide the bug |
| E | **CI gates + post-deploy smoke** — GitHub Actions: test + typecheck + Lighthouse budget; Vercel post-deploy hits every top-level route and alerts on non-200 | Backend Engineer | B, C partial | 1 day | Red PR on failure; smoke alerts on 500/404 after deploy |
| F | **Reviewer sign-off per bucket** — verify every one of the 6 buckets has a failing-test-that-now-passes proof | Reviewer | B, C, D, E | 0.5 day | Sign-off note per bucket in `.agent-state/handoffs.md` |

**Wall-clock estimate:** ~5 days with parallel agent execution.

**High-leverage single item:** Playwright sign-in on a mobile-Safari UA in CI. Eight OAuth fixes this year all came from that class. If time gets tight, cut happy-path tests before cutting this one.

## Success Criteria

### Objective checks (binary pass/fail)

1. Sentry captures prod errors — verified by triggering a test error and confirming the event in the Sentry dashboard
2. Better Stack receives Vercel logs — last 5 min of logs visible
3. Auth-error-rate alert fires on a synthetic spike
4. Playwright runs in CI; suite includes at minimum:
   - Sign-in on mobile-Safari UA
   - Sign-in on Messenger WebView UA
   - Add-prayer dialog from homepage
   - Add-prayer from My Prayers
   - Pray-for on a shared prayer
   - Share a prayer
5. Integration tests run against a real Neon preview branch — not mocks
6. **Archaeology proof** — for each of the 6 failure buckets, the engineer submits a commit that intentionally re-introduces a past bug, CI fails, revert → CI passes. This is the single most important gate.
7. CI blocks merge on test / typecheck / Lighthouse budget failure
8. Post-deploy smoke hits every top-level route and alerts on non-200

### Definition of done

Per PrayerJar rules:
- Every task: code committed, tests pass, Reviewer approves in `tasks.json` (`status: done`)
- Sprint: Reviewer posts a sign-off note per bucket in `.agent-state/handoffs.md`

### Forward-looking success signal (not gated)

The next `fix:` commit in this repo should originate from Sentry or CI — not from you catching it in production. If Sprint 16 ships a feature and sign-in still works without human verification, the safety net earned its keep.

## Explicitly Out of Scope

Park for Sprint 16+:

- **Sprint 14 perf audit resolution** (next/image, SSR find-a-church, lazy-load PrayerCard dialogs) — its own sprint
- **All new features** — daily verse email, shareable images, prayer partners, groups, etc.
- **Wildcard church subdomains** (Sprint 14's one open task) — still blocked on reaching 20+ churches
- **Security headers deep-dive** — already shipped in Sprint 8.2
- **100% test coverage** — we cover known-bad classes, not a coverage number
- **Zero test flakiness on day one** — acceptable to quarantine and iterate
- **Perfect Lighthouse scores** — we set a budget to prevent regression, not chase green

## Open Questions

None blocking. Flag during implementation planning if any surface.

## References

- `.agent-state/sprints.json` — sprint registry
- `.agent-state/tasks.json` — task tracking (dashboard-backed)
- `INBOX.md` — carries the pre-existing Better Stack integration request
- Memory: `project_state.md` — Sprint 14 perf audit findings (deferred)
- Memory: `project_deployment.md` — prior production bugs catalog
