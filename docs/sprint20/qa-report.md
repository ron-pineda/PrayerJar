# Sprint 20 QA Report

**Reviewer:** QA
**Date:** 2026-04-18
**Task:** pj-s20-12
**Scope:** Sprint 20 — full-site visual audit verification across all 10 page-refresh tasks (pj-s20-02 through pj-s20-11)

---

## Overall Verdict: FAIL

Two pages ship banned-phrase violations. Sprint 20 Spec §4 Success Criteria requires "Banned phrases cleared — all 16 from `docs/brand/brand-guide.md §7`" on every page in scope. Three hits found on two pages (`/help`, `/docs`). Remaining 8 pages verified clean and ready for Reviewer.

---

## Pass 1 — Emoji scan

Unicode codepoint scan (U+1F000–U+1FFFF and U+2600–U+27FF) across all 10 Sprint 20 scope files plus relevant child components (`salvation-client.tsx`, `church-card.tsx`, `church-search-bar.tsx`).

| Task | Page | Result |
|---|---|---|
| pj-s20-02 | /know-jesus | PASS |
| pj-s20-03 | /give | PASS |
| pj-s20-04 | /about | PASS |
| pj-s20-05 | /browse | PASS |
| pj-s20-06 | /find-a-church | PASS |
| pj-s20-07 | /world-prayer | PASS |
| pj-s20-08 | /contact | PASS |
| pj-s20-09 | /help | PASS |
| pj-s20-10 | /sign-in | PASS |
| pj-s20-11 | /docs | PASS |

Zero emoji codepoints in any Sprint 20 scope file or scoped child component.

---

## Pass 2 — Banned phrases scan

Grepped all 16 banned phrases from `docs/brand/brand-guide.md §7` against each Sprint 20 scope file. Three hits found:

| File | Line | Phrase | §7 item | Severity |
|---|---|---|---|---|
| `src/app/(public)/docs/page.tsx` | 216 | "community prayer platform" | #5 "platform" | BLOCKER |
| `src/app/(public)/docs/page.tsx` | 219 | "churches that want pastoral tools" | #2 (verbatim ban) | BLOCKER |
| `src/app/(public)/help/page.tsx` | 43 | "churches that want pastoral tools" | #2 (verbatim ban) | BLOCKER |

Exact source (for the `needs-rework` tickets):

- `docs/page.tsx:216` — `The Prayer Jar is a community prayer platform built on a simple idea...`
- `docs/page.tsx:219` — `We offer paid plans for churches that want pastoral tools and private prayer walls...`
- `help/page.tsx:43` — `'Yes — completely. There are no ads, no paywalls on prayer, and no data brokers. We offer paid plans for churches that want pastoral tools, but asking for prayer and praying for others is always free.'`

The other 13 banned phrases had zero hits across all 10 pages.

### Scope note (docs page — pj-s20-11)

Both docs-page hits pre-existed Sprint 20 (git blame: commit `dbdcb75`, Sprint 8). pj-s20-11 was scoped as a "light pass, no content changes." That scope conflicts with Spec §4 which requires banned phrases cleared across every Sprint 20 page regardless of task size. Escalating scope call to PM via `pj-s20-11 needs-rework` note. QA position: Spec §4 is the absolute requirement; the page must not ship with violations whether or not pj-s20-11 was originally scoped to touch copy. PM may reassign to Copywriter if content edits feel out-of-scope for Frontend, but the page cannot close in its current state.

### Scope note (help page — pj-s20-09)

The `help.md` copy brief audit (§Banned-phrase audit) only flagged "unlock" at a separate FAQ for rewrite and explicitly stated "None of the other 15 banned phrases appear in visible copy." The "churches that want pastoral tools" phrase at line 43 was missed. Copywriter audit gap. One-line FAQ body rewrite will clear it.

---

## Pass 3 — Typecheck

Ran `node_modules/typescript/bin/tsc --noEmit -p .` and filtered for Sprint 20 scope files.

**Result: PASS.** Zero new typecheck errors on any Sprint 20 scope file. Baseline test-file errors pre-existing on main are out of scope for this sprint.

---

## Pass 4 — Per-page success criteria

Applied the Sprint 20 Success Criteria from spec §4 per page (amber palette, Lucide icons, ScrollReveal stagger, verse strip ≤1, no emoji, no banned phrases, jar motif rules, copy matches brief, hierarchy, accessibility).

| Task | Page | Amber | Lucide | Stagger | Verse | Emoji | Banned | Jar | Copy | Hier | A11y | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pj-s20-02 | /know-jesus | PASS | PASS | PASS | 0* | PASS | PASS | none* | PASS | PASS | PASS | PASS |
| pj-s20-03 | /give | PASS | PASS | PASS | 1 | PASS | PASS | none* | PASS | PASS | PASS | PASS |
| pj-s20-04 | /about | PASS | n/a* | PASS | 1 | PASS | PASS | hero-only | PASS | PASS | PASS | PASS |
| pj-s20-05 | /browse | PASS | PASS | PASS | 0 | PASS | PASS | none | PASS | PASS | PASS | PASS |
| pj-s20-06 | /find-a-church | PASS | PASS | n/a* | 0 | PASS | PASS | none | PASS | PASS | PASS | PASS |
| pj-s20-07 | /world-prayer | PASS | PASS | PASS | 1 | PASS | PASS | none | PASS | PASS | PASS | PASS |
| pj-s20-08 | /contact | PASS | PASS | PASS | 0 | PASS | PASS | none | PASS | PASS | PASS | PASS |
| pj-s20-09 | /help | PASS | PASS | PASS | 0 | PASS | **FAIL** | none | PASS | PASS | PASS | **FAIL** |
| pj-s20-10 | /sign-in | PASS | PASS | n/a* | 0 | PASS | PASS | hero-only | PASS | PASS | PASS | PASS |
| pj-s20-11 | /docs | PASS | PASS | PASS | 0 | PASS | **FAIL** | none | PASS | PASS | PASS | **FAIL** |

Legend:
- `n/a*` — criterion intentionally not applicable per copy brief or surface pattern (e.g., /find-a-church is search-results UI; /about brief permits no Lucide; /sign-in is single-card layout; /know-jesus drops the verse strip per brief §15 because 5 gospel scriptures ARE the page substance)
- `none*` on jar — per brand §4.2, no jar on evangelism (/know-jesus) or donation (/give) pages

---

## Pass 5 — Git + handoffs verification

- All 10 Frontend handoff entries present in `.agent-state/handoffs.md` for pj-s20-02 through pj-s20-11
- All 10 tasks have Frontend DONE notes in `tasks.json`
- All 10 tasks currently at `status: "review"` awaiting QA
- Designer spot-check (`docs/sprint20/design-spotcheck.md`) has signed off both HIGH-priority pages (pj-s20-02, pj-s20-03) per the gated-approval rule

**Result: PASS.**

---

## Issues (severity ranked)

### BLOCKER (ship-stoppers)

1. **pj-s20-09 /help** — Banned phrase "churches that want pastoral tools" at `src/app/(public)/help/page.tsx:43`. §7 #2 is a verbatim-ban. Requires a one-line FAQ rewrite. Back to Frontend as `needs-rework`.

2. **pj-s20-11 /docs** — Two banned-phrase hits at `src/app/(public)/docs/page.tsx:216` ("community prayer platform" — §7 #5) and `:219` ("churches that want pastoral tools" — §7 #2). Both pre-existed Sprint 20. Back to Frontend as `needs-rework` with scope-escalation note to PM: spec §4 is an absolute requirement; "light pass" scope must yield when it conflicts with a hard spec criterion.

### NON-BLOCKING

None from QA. Designer spot-check already logged two optional backlog items (inline PrayerDialog on /know-jesus CTA; post-success UX on /give). QA concurs those are backlog, not Sprint 20 blockers.

---

## Sign-off

**Eight pages are ready for Reviewer to flip to `done`:**

- pj-s20-02 (/know-jesus)
- pj-s20-03 (/give)
- pj-s20-04 (/about)
- pj-s20-05 (/browse)
- pj-s20-06 (/find-a-church)
- pj-s20-07 (/world-prayer)
- pj-s20-08 (/contact)
- pj-s20-10 (/sign-in)

**Two tasks returned to Frontend for rework:**

- pj-s20-09 (/help) — 1 banned-phrase fix
- pj-s20-11 (/docs) — 2 banned-phrase fixes + PM scope confirmation

Sprint 20 cannot close until pj-s20-09 and pj-s20-11 are reworked, re-QAd, and flipped to `done`.

---

## Rework addendum (2026-04-18T23:55Z)

**Both blockers resolved.** PM ruled on pj-s20-11 scope: spec §4 wins, content edits authorized.

Three one-line rewrites applied in commit `3be08c0`:

| File | Line | Before | After |
|---|---|---|---|
| `help/page.tsx` | 43 | "We offer paid plans for churches that want pastoral tools" | "Churches can subscribe for pastoral features" |
| `docs/page.tsx` | 216 | "community prayer platform … community intercedes" | "place for people to be prayed for … community prays" |
| `docs/page.tsx` | 219 | "paid plans for churches that want pastoral tools and private prayer walls" | "Churches can subscribe for pastoral features like a private prayer wall, pastoral notes, and a care dashboard" |

Re-scan verification:

- §7 #2 "churches that want pastoral tools" — **0 hits** across Sprint 20 scope
- §7 #5 "platform" — **0 hits** across Sprint 20 scope
- All 16 §7 banned phrases — **0 hits** across Sprint 20 scope
- Emoji codepoints — still **0**
- Typecheck — still clean

**QA verdict updated: PASS across all 10 pages.** pj-s20-09 and pj-s20-11 flipped to `review`. Ready for Reviewer final approval on the full slate.
