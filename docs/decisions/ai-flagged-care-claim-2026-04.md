# ADR — "AI-Flagged Care" Marketing Claim

**Date:** 2026-04-17
**Author:** Architect
**Task:** `pj-s17-hotfix-ai-claim` (critical; blocks Sprint 17 marketing rewrite)
**Decision:** **Path (a) — Kill the claim.** Remove "AI-Flagged Care" language from all public marketing and documentation surfaces. Defer the real implementation to a future sprint with proper AI/eval scoping.

---

## 1. Context

Sprint 17's AI flagging audit (`docs/ai/sprint17-ai-flagging-audit-2026-04-17.md`, AIEngineer, 2026-04-17) determined that the public "AI-Flagged Care" feature is **not defensible** as currently marketed:

- The pipeline from AI detection → `prayer_flags` table → pastoral dashboard **does not exist in production**. `flagPrayer()` (`src/services/pastoral.service.ts:114-126`) is only called from `pastoral.service.test.ts`. The `prayer_flags` table is never written to by prod code.
- `moderateContent()` (`src/services/ai.service.ts:38-72`) emits `{ safe, selfHarm }` only — no `crisis` or `grief` category, no confidence score, no eval harness.
- On `selfHarm=true`, `createPrayer()` (`src/services/prayer.service.ts:41-45`) **rejects the prayer** by throwing `ModerationError`. The submitter sees a `CrisisResources` dialog (`src/components/crisis-resources.tsx`, wired in `src/components/prayer-form.tsx:84-85`) with 988, Crisis Text Line, IASP, NAMI, and BetterHelp — so the user-facing crisis UX is present and functional. But the pastoral care team sees nothing. Current behavior is **"reject + show crisis resources,"** not "silently reject."
- The AI Gateway call **fails open** on timeout (lines 59-71) — no alerting, no retry, no dead-letter queue. A transient gateway hiccup on a crisis prayer = that prayer goes through un-flagged, un-logged.
- Model is `anthropic/claude-haiku-4.5` — mechanical-classifier tier. AIEngineer audit explicitly recommends Sonnet-or-better for nuanced crisis detection.

**Marketing copy that makes the false claim:**
- `src/app/(public)/for-churches/page.tsx:22-27` — feature card ("AI-Flagged Care — … automatically surfaced … before anyone falls through the cracks")
- `src/app/(public)/for-churches/page.tsx:222` — FAQ ("AI-flagged care items")
- `src/app/(public)/docs/paid/page.tsx:90` — feature comparison table row
- `src/app/(public)/docs/paid/page.tsx:115-122` — FEATURE_DEEP_DIVES card ("screened … immediately … no one falls through the cracks")
- `src/app/(public)/docs/churches/page.tsx:79` — pastoral dashboard subtitle ("flagged care needs")
- `src/app/(public)/docs/churches/page.tsx:91-96` — two deep-dive steps ("automatically flagged for pastoral review")
- `src/app/(public)/docs/churches/page.tsx:317` — plans teaser
- `src/app/(public)/docs/features/page.tsx:179` — feature list item
- `src/app/(public)/help/page.tsx:62-63` — moderation FAQ
- `src/app/(public)/help/page.tsx:106-107` — church-features FAQ
- `src/lib/plans.ts:64` — Pro-tier feature bullet

Lower-priority in-app copy (visible only to signed-in pastors, not a marketing promise):
- `src/components/church/pastor-tips.tsx` — "flagged prayers dashboard" tip. Left in place; the dashboard page itself still exists and reads an (empty) queue.

---

## 2. Options considered

### Path (a) — Kill the claim (CHOSEN)
Remove all public-facing references to "AI-Flagged Care" / "flagged care alerts" / "automatically surfaced to pastoral team." Keep the flagged-prayers dashboard UI and `flagPrayer()` service in place as latent infrastructure. Leave current moderation behavior (reject on selfHarm + show crisis resources) unchanged.

- **Scope:** ~1 day. Copy edits across 6 files + plans.ts feature bullet + tasks.json cleanup.
- **Legal exposure:** removes FTC §5 deceptive-practices risk on a feature we charge for but don't deliver.
- **User safety:** unchanged. Crisis resources continue to show on submission rejection.
- **Optionality:** preserved. Dashboard and schema remain; we can re-enable and re-market once the real build ships.
- **Cost to Pro tier's value narrative:** modest. "Pastoral Dashboard" and "Pastoral notes & assignments" remain; that's the load-bearing feature bullet. AI-flagged care was the top-of-funnel line; we'll lose some demo punch.

### Path (b) — Build the thing this sprint
Wire `flagPrayer()` into `createPrayer()` on `selfHarm=true`, save the prayer instead of rejecting it, extend the Zod schema with `confidence`, build an eval set, set up dashboard surfacing.

- **Scope honestly:** 1–2 sprints, not one hotfix. Needs: schema change + migration, prompt redesign for multi-category output, eval harness (30+ labeled prayers), per-church threshold plumbing, confidence display, fail-open alerting, human-in-loop feedback. And a UX review — do we still show the prayer on the public wall, hide it, or quarantine it? What does the submitter see? All unspecified.
- **Legal exposure if rushed:** **worse than path (a).** Shipping a fail-open classifier with no eval harness onto a user-safety pathway creates direct-harm liability on a marketed feature. A missed self-harm case (fail-open, bad prompt, wrong threshold, false-negative) after we've advertised "before anyone falls through the cracks" is a far worse headline than "we quietly removed a line from marketing."
- **User safety during ramp:** unknown. Switching from reject→flag means people in crisis now see their submission succeed and wait for a pastor who may not check the dashboard for hours/days. Current flow at least shows 988 immediately.

### Path (c) — Soften with "Coming soon"
Middle ground: change marketing copy to "AI crisis screening — pastoral alerts coming soon."

**Rejected.** Scatters subtle "coming soon" across 6 pages and the feature table; still implies we're delivering it on Pro. Churches will sign up expecting it. Keep Pro's value prop defensible today.

---

## 3. Rationale

1. **Integrity of the marketing claim is a binary.** Pro is a paid tier. Charging for a feature that cannot function is a clean FTC §5 risk. Fixing the copy today removes that risk today.
2. **Path (b) as a hotfix is worse than path (a).** The audit's own recommendations — eval harness, confidence threshold, per-church tuning, fail-open alerting, Sonnet-tier model — are a multi-week project. Shipping a half-built version onto a user-safety surface is the failure mode we most want to avoid on PrayerJar.
3. **Current crisis UX is adequate.** The `CrisisResources` dialog already shows when `selfHarm=true`. No pastoral-team surfacing, but the submitter is handed 988 and Crisis Text Line. We are not abandoning users in crisis.
4. **Optionality is cheap.** `prayer_flags`, `flagPrayer()`, and the flagged-prayers dashboard page all remain. When the proper build happens, re-enabling marketing is a copy change, not a product rebuild.

**Relation to prior decisions:** No conflict with `decisions.md`. Pro-tier composition remains: Private Prayer Wall, Pastoral Dashboard, Pastoral Notes & Assignments, Live Event Walls, Custom Branding, Analytics. The Pro tier is not being de-featured; we're correcting an unearned claim.

---

## 4. Follow-up actions

### This commit
1. Edit `src/lib/plans.ts:64` — remove `'AI-flagged prayer care'` from Pro features.
2. Edit `src/app/(public)/for-churches/page.tsx:22-27` — replace "AI-Flagged Care" feature card with a defensible pastoral-team feature.
3. Edit `src/app/(public)/for-churches/page.tsx:222` — remove "AI-flagged care items" from FAQ answer.
4. Edit `src/app/(public)/docs/paid/page.tsx:90` — remove "AI-flagged care alerts" table row.
5. Edit `src/app/(public)/docs/paid/page.tsx:115-122` — remove the "AI-Flagged Care Alerts" FEATURE_DEEP_DIVES card entirely.
6. Edit `src/app/(public)/docs/churches/page.tsx:79, 91-96, 317` — remove AI-flagged steps and alert references.
7. Edit `src/app/(public)/docs/features/page.tsx:179` — remove "AI-flagged care alerts" feature list item.
8. Edit `src/app/(public)/help/page.tsx:62-63, 106-107` — reword moderation/church-features FAQs so they describe the moderation step honestly and do not promise "AI-flagged alerts."

### tasks.json changes
- `pj-s17-hotfix-ai-claim` → `status: review`, add note linking this doc.
- `pj-s17-ai-flag-wiring` → **DELETE** from tasks.json (per its own GATE acceptance criterion: "if resolved to path a, this task is DELETED").
- New future-sprint placeholder suggestion for PM: `pj-s1X-crisis-classifier-v1` — proper eval harness + prompt redesign + threshold + UX for "flag not block" + surfacing. Not a Sprint 17 item. (PM to create when scoping next sprint.)

### Not changed in this commit
- `src/services/prayer.service.ts:41-45` — kept as-is. Rejecting `selfHarm=true` + surfacing `CrisisResources` is the current user-safety path and is not part of the marketing claim being corrected. Changing reject→flag requires product/UX scoping and belongs in the future sprint task.
- `src/components/church/pastor-tips.tsx` — in-app tip for pastors mentioning "flagged prayers dashboard." Left in place; the dashboard queue still exists (just always empty today). Low-priority follow-up: remove or re-word once we know whether the real build will ship within the next quarter.

### Coordination
`pj-s17-hotfix-pastoral-consistency` (Backend, in-progress) is also editing `src/app/(public)/for-churches/page.tsx` and `src/lib/plans.ts`. Expect a merge conflict. The Backend agent owning that hotfix should rebase on this commit (or vice-versa, whoever merges second). Flagged in the handoff.

### Legal
The task's acceptance criterion 8 names "Legal sign-off" as a `done` gate. Architect cannot sign off as Legal. PM must route the final copy to Legal for review before flipping `pj-s17-hotfix-ai-claim` from `review` → `done`. Placeholder noted.

---

## 5. Grep verification of all occurrences (pre-edit)

```
src/lib/plans.ts:64:      'AI-flagged prayer care',
src/app/(public)/help/page.tsx:63:        a: 'Requests go through an AI screening step that flags content that may need pastoral care...'
src/app/(public)/help/page.tsx:107:        a: `Church plans include ... AI-flagged care alerts ...`
src/app/(public)/for-churches/page.tsx:24:    title: 'AI-Flagged Care',
src/app/(public)/for-churches/page.tsx:26:      'Prayers that signal crisis or grief are automatically surfaced to your pastoral care team before anyone falls through the cracks.',
src/app/(public)/for-churches/page.tsx:222:  a: `Admins and pastors on the ... plan (and above) get a dedicated dashboard showing active prayers, AI-flagged care items, and prayer team assignments. ...`
src/app/(public)/docs/paid/page.tsx:90:  { feature: 'AI-flagged care alerts', free: false, starter: false, pro: true, enterprise: true },
src/app/(public)/docs/paid/page.tsx:116:    title: 'AI-Flagged Care Alerts',
src/app/(public)/docs/paid/page.tsx:121:    body: "Every prayer submitted to your private wall is screened for language indicating crisis, self-harm, acute grief, or mental health distress. Flagged requests are surfaced in the pastoral dashboard immediately. ..."
src/app/(public)/docs/churches/page.tsx:79:    subtitle: 'Real-time view of church activity, flagged care needs, and assignments.',
src/app/(public)/docs/churches/page.tsx:91:        heading: 'AI-flagged care alerts',
src/app/(public)/docs/churches/page.tsx:92:        body: 'Requests containing crisis language — self-harm indicators, acute grief, mental health language — are automatically flagged for pastoral review. They appear in the Flagged tab.',
src/app/(public)/docs/churches/page.tsx:317:              plans unlock pastoral tools, AI-flagged care alerts, analytics, and event walls.
src/app/(public)/docs/features/page.tsx:179:      { name: 'AI-flagged care alerts', desc: 'Requests containing crisis language (self-harm, grief, mental health) are flagged for pastoral review.' },
```

Occurrences listed above are the complete set of external-facing surfaces. All will be edited in this commit.
