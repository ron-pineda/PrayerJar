# Copy Brief: /for-churches — claim reconcile (hotfix)

**Task:** `pj-hotfix-claim-reconcile-2026-04`
**Date:** 2026-04-19
**Surface:** `src/app/(public)/for-churches/page.tsx`
**Scope:** Three Pro-tier ship-stopper claims identified in `docs/church-review/architect-findings.md` §Claims matrix rows 8 / 9c / 9d. Nothing else on this page changes.
**Brand voice:** per `docs/brand/brand-guide.md` §3 and §7 (banned phrases).

---

## Why this matters (FTC §5 framing)

Per `docs/church-review/strategist-synthesis.md` and Legal's Sprint 17 signoff: a promise made *inside the product the buyer paid for* is the cleanest FTC §5 exposure surface. All three of the lines below sit on the Growing Church ($49/mo, Pro tier) card — buyer-facing — and describe capabilities that do not currently ship in `src/`. Strip today; the build-vs-remove decision is Sprint 22 scope.

## Scope discipline

Three edits. No others on this page in this hotfix.

- Row 8 (page.tsx lines 92 and 93) — two edits on the same feature row (description + tierLabel must move in lockstep)
- Row 9c + 9d — one combined edit on page.tsx line 99 (the PCO `description` string)
- Hero phrase (Row 22), priority support (row 17), monthly↔annual FAQ (row 18) — **NOT in scope**. Sprint 22 agenda.

---

## Edit 1 — Row 8 description (page.tsx line 91–92)

### Current
```ts
    description:
      'Weekly digests show which prayers are active, which have been answered, and where engagement is rising or falling. Growing Church adds downloadable PDF reports for leadership meetings.',
```

### Replacement
```ts
    description:
      'Weekly digests show which prayers are active, which have been answered, and where engagement is rising or falling. Growing Church adds advanced analytics and CSV exports for leadership meetings.',
```

### Rationale
- "Downloadable PDF reports" is not backed by code — `architect-findings.md` row 8 confirms no PDF generator anywhere in `src/` (no `@react-pdf`, `pdfkit`, `puppeteer`).
- `report.csv` export paths do exist on the event wall, and analytics CSV is the realistic near-term deliverable — so "CSV exports" is truthful today and does not preempt a future PDF decision.
- "Advanced analytics" already corresponds to shipped analytics pages (`(church)/.../dashboard/analytics/page.tsx`).
- No §7 banned phrases introduced — neither "advanced analytics" nor "CSV exports" appears on the §7 list; neither is a template adjective.

## Edit 2 — Row 8 tierLabel (page.tsx line 93)

### Current
```ts
    tierLabel: `Basic analytics — ${PLANS.starter.name} and above; Advanced & PDF — ${PLANS.pro.name} and above`,
```

### Replacement
```ts
    tierLabel: `Basic analytics — ${PLANS.starter.name} and above; Advanced analytics + CSV exports — ${PLANS.pro.name} and above`,
```

### Rationale
- Tier label must track the description — if the description drops PDF, the label cannot continue to promise it.
- Mirrors the phrasing in the description so the card reads consistently.
- No §7 banned-phrase hits.

## Edit 3 — Row 9c + 9d, PCO description (page.tsx line 98–99)

### Current
```ts
    description:
      'Your Planning Center member list becomes your PrayerJar prayer community automatically — no CSV imports, no double entry. Small groups sync too. A brief weekly prayer summary appears as a note on each person\'s PCO record so your pastoral picture stays current.',
```

### Replacement
```ts
    description:
      'Your Planning Center member list becomes your PrayerJar prayer community automatically — no CSV imports, no double entry. New members show up the next day, so your pastoral picture stays current.',
```

### Rationale
- Strips the entire "Small groups sync too." sentence (row 9c). The adapter reads groups but `chms-sync-runner/route.ts:66` destructures to `_groups` and discards them; there is no `syncGroup` method on the adapter. Until a persistence leg ships, this sentence is a §5 exposure.
- Strips the entire "A brief weekly prayer summary appears as a note on each person's PCO record so your pastoral picture stays current." sentence (row 9d). The adapter method and runner branch exist but no scheduler queues `push_summary` jobs.
- Keeps "so your pastoral picture stays current" as a trailing clause on the remaining (truthful) sentence, preserving the pastoral-framing tone the row was built around.
- Adds "New members show up the next day" to (a) make the retained sentence carry its own weight after the deletions, and (b) truthfully reflect the current nightly full-sync behaviour (`chms-full-sync-scheduler`). This is consistent with `architect-findings.md` row 9b — "automatically" today means nightly batch — without introducing a second claim about webhooks.
- No §7 banned phrases introduced. "Automatically," "planning center," and "pastoral picture" are not on the §7 list.

---

## Brand-guide §7 check (all 16 items)

Reviewed against the final replacement strings (Edits 1–3):

| # | Banned item | Present in replacements? |
|---|---|---|
| 1 | "gives your [X] the tools to [Y]" | No |
| 2 | "churches that want pastoral tools" | No |
| 3 | "Set up your church in minutes." | No |
| 4 | "Bring your [X] online" | No |
| 5 | "platform" (as vendor-speak) | No |
| 6 | "empower / empowers" | No |
| 7 | "leverage" | No |
| 8 | "solutions" | No |
| 9 | "unlock" | No |
| 10 | "seamless / streamlined / robust / best-in-class" | No |
| 11 | "AI-Flagged Care" | No |
| 12 | "Most Popular" | No |
| 13 | "Join the community / movement" | No |
| 14 | Emoji feature icons | No |
| 15 | ≥3 scripture references on one page | N/A (not changing scripture) |
| 16 | "Amen!" as a label | No |

Clean.

---

## Notes for Frontend implementation

- Apply the three edits verbatim — string content only. Do not adjust JSX, imports, icons, or surrounding items in the `FEATURES` array.
- All three edits live inside the `FEATURES` array in `src/app/(public)/for-churches/page.tsx`. No files other than `page.tsx` change in this commit.
- Keep the escaped apostrophe style consistent with the file's existing convention (single-quoted strings with `\'`).
- After the edits, run typecheck + build. Do not deploy — PM will report SHAs to the controller.
- Commit message:
  ```
  fix(for-churches): reconcile 3 pro-tier claims with actual product capability
  ```
- Update `.agent-state/tasks.json`: flip `pj-hotfix-claim-reconcile-2026-04` to `status: review`, set `assigned_to: "QA"`, append a note with the commit SHA.
