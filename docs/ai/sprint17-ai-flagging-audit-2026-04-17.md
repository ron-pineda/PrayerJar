# Sprint 17 AI Flagging Audit — "AI-Flagged Care"

**Date:** 2026-04-17
**Auditor:** AI Engineer
**Verdict:** The marketing claim is **NOT defensible today.** The insertion path from AI detection to the pastoral dashboard does not exist in production code.

---

## 1. What's implemented today

**AI service** — `src/services/ai.service.ts`
- `moderateContent(content)` — `src/services/ai.service.ts:38-72`
  - Model: `anthropic/claude-haiku-4.5` via Vercel AI Gateway (`ai.service.ts:4`).
  - Zod schema: `{ safe: boolean; reason?: string; selfHarm: boolean }` (`ai.service.ts:15-19`).
  - Prompt: inline, single-shot, no examples, no temperature/tokens set (`ai.service.ts:51-57`).
  - Timeout: 8s, fails **open** — returns `{ safe: true, selfHarm: false }` on error (`ai.service.ts:59-71`).

**Schema** — `src/db/schema.ts:570-581` `prayer_flags` table with `aiConfidence doublePrecision`, `reason` enum (`self_harm | crisis | abuse | inappropriate | spam | other`), `status` (`pending | reviewed | dismissed | escalated`).

**Pastoral service** — `src/services/pastoral.service.ts`
- `flagPrayer(prayerId, churchId, reason, aiConfidence?)` — `pastoral.service.ts:114-126`.
- `getFlaggedPrayers(churchId)` — reads the dashboard queue (`pastoral.service.ts:74-112`).

**Dashboard UI** — `src/app/(church)/church/[slug]/dashboard/flagged/page.tsx` renders flags with confidence badges.

**Marketing copy** — `src/app/(public)/for-churches/page.tsx:22-27`:
> "AI-Flagged Care — Prayers that signal crisis or grief are automatically surfaced to your pastoral care team before anyone falls through the cracks."

---

## 2. Pipeline diagram (what actually happens)

```
User submits prayer
  → createPrayer() (prayer.service.ts:27)
  → moderateContent() returns { safe, selfHarm }
      ├─ safe=false  → throw ModerationError → 422 to user; prayer NOT saved
      │                (logs to moderation_log; NO row in prayer_flags)
      └─ safe=true   → prayer saved; nothing written to prayer_flags ever
```

**Intended diagram (what the marketing implies):**
```
Prayer submitted → AI flags crisis/grief → prayer_flags row → pastoral dashboard
```

**Gap:** `flagPrayer()` is **never called from production code.** Grep for `flagPrayer(` returns only `pastoral.service.test.ts`. The `prayer_flags` table is only populated by tests; in prod the pastoral dashboard's "Flagged Prayers" queue is permanently empty unless manually seeded.

Secondary issue: `selfHarm=true` currently **blocks** the prayer (throws `ModerationError`, `prayer.service.ts:41-45`). The user is told "we can't accept this" and crisis resources are (maybe) shown client-side — but the pastoral team sees nothing, the prayer is not stored, and no record of the crisis moment persists beyond a moderation log snippet that auto-purges.

---

## 3. Marketing claim audit

**"AI-Flagged Care — automatically surfaced to your pastoral care team."**

| Claim element | Reality |
|---|---|
| "AI-flagged" | Partial. Haiku-4.5 classifies `selfHarm`, but there's no "crisis" or "grief" category in the prompt. The category enum in `prayer_flags` has `crisis` and `self_harm`, but the AI only emits `selfHarm` as a boolean. |
| "Automatically surfaced" | **False.** No code path inserts into `prayer_flags` from the AI. |
| "Pastoral care team" sees them | **False.** The flagged-prayers dashboard reads from `prayer_flags`, which is always empty in prod. |
| "Before anyone falls through the cracks" | **Inverted.** When the AI detects self-harm, the prayer is *rejected* and the person is turned away — the opposite of surfacing to care. |

**Verdict: NO — not defensible.** If a Pro-tier church was shown a suicidal-ideation prayer in a demo, staff would see nothing in the dashboard. We are charging for a feature that does not function.

No evaluation set exists. No labeled prayers, no accuracy measurement, no confidence-threshold analysis. The `aiConfidence` column is populated with `null` by every test and by the (non-existent) prod call. The dashboard UI displays "X% confidence" (`flagged/page.tsx:82-86`) — a number that can never be shown because it is never written.

---

## 4. Failure modes and consequences

1. **Current primary failure: feature doesn't exist.** Churches on Pro see an empty dashboard forever. Refund/lawsuit risk.
2. **Fail-open on timeout** (`ai.service.ts:60,68`) — AI gateway slow or broken = every prayer passes, silently. No alerting.
3. **No structured reasoning** — single prompt with no few-shot examples, no chain-of-thought. Haiku-4.5 is a mechanical classifier tier; for a nuanced "is this person in crisis" judgment we should be on Sonnet at minimum.
4. **Self-harm blocks submission** — user in crisis is told "we can't accept this" and there is no handoff to pastoral staff or crisis line. This is the opposite of care and a foreseeable harm path (Legal is tracking).
5. **No human-in-the-loop learning** — `reviewFlag` dismissals are not fed back anywhere. The model cannot improve.
6. **No retry / dead-letter queue** — a transient gateway hiccup during a crisis prayer = that prayer goes through un-flagged with no record.

---

## 5. Recommended Sprint 17 tasks

**P0 — Honesty / legal protection.**
Soften for-churches copy from "automatically surfaced" to "pastoral team receives flag notifications for prayers the AI identifies as possible crisis content — review required" AND wire up the actual insertion (below). Do both. If we can't do both, do the copy fix first.

**P0 — Wire the pipeline.**
In `createPrayer` (`prayer.service.ts:27`), when `moderation.selfHarm` is true AND the prayer author has a `churchId` (`church_members` row): save the prayer (do NOT block), call `flagPrayer(prayerId, churchId, 'self_harm', aiConfidence)`, and show the user crisis resources client-side. For non-church users, keep current behavior or still save + flag to admin queue. Expose a confidence score from the model (extend the Zod schema to include `confidence: z.number().min(0).max(1)`) and actually pass it through.

**P1 — Eval harness.**
Build a 30-prayer labeled set (10 crisis, 10 grief, 10 benign-but-heavy). Run nightly against the current prompt. Record precision/recall. Report to `docs/evals/moderation-crisis-YYYY-MM-DD.md`. No more shipping changes to this prompt without an eval delta.

---

## 6. Future investments (beyond Sprint 17)

- **Dedicated crisis-classification prompt**, separate from safety moderation. Different task, different output schema, Sonnet-tier model. Include `category: 'crisis' | 'grief' | 'other'` and `severity: 'low' | 'medium' | 'high'`.
- **Configurable per-church threshold** on `churches` table (`crisisFlagThreshold` numeric default 0.6). Pastors who want tighter/looser filters can tune it.
- **Feedback loop**: `prayerFlags.status = 'dismissed'` rows sampled weekly to build a false-positive corpus; fold into eval set.
- **Observability**: log every moderation call with input hash, model, latency, output, and flag-insertion result. Weekly rollup.
- **Alerting on fail-open rate** — if > 1% of moderations fail open in any hour, page on-call.

---

## Tasks to add to Sprint 17

1. **[P0] fix-marketing-crisis-claim** — Soften `for-churches/page.tsx` AI-Flagged Care copy to match current capability; add "Review required" language. Legal sign-off required. *Priority: P0.* *Owner: Frontend Eng + Legal.*
2. **[P0] wire-ai-flag-insertion** — Extend `moderateContent` schema with `confidence` numeric; in `createPrayer`, on `selfHarm=true` for church-affiliated authors, save the prayer + call `flagPrayer()` with confidence; keep crisis-resource UX for the submitter; add integration test. *Priority: P0.* *Owner: Backend Eng + AI Engineer (prompt spec).*
3. **[P1] crisis-classifier-eval-v0** — Create `docs/evals/moderation-crisis-2026-04-17.md` with 30-item labeled set and pass/fail thresholds; block future prompt changes without eval delta. *Priority: P1.* *Owner: AI Engineer + QA.*
