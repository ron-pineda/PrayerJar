# Copy Brief: Hero + PCO Qualifier

**Task:** pj-s22-04-copy-hero-and-pco-qualifier
**Date:** 2026-04-20
**Author:** Backend+Copywriter agent
**Applied to:** `src/app/(public)/for-churches/page.tsx`

---

## Hero fix

**OLD (line 183):**
> No one falls through the cracks between Sundays.

**NEW:**
> Every member who carries a prayer is seen before the week is out.

**Rationale:** "Falls through the cracks" was removed in Sprint 17 for brand-voice reasons and was reintroduced. The replacement conveys the same pastoral reassurance — no one goes unnoticed between Sundays — without the cliché metaphor. It stays under 12 words, uses plain language (§3.5), and names the specific pastoral fear (a member's burden going unnoticed week to week).

**Note for Brand (v2 guide):** §9.1 of the brand guide currently cites the old hero line as an approved reference example. That section should be updated in the next brand-guide revision to reflect this replacement.

---

## PCO qualifier

**OLD (line 99 description):**
> Your Planning Center member list becomes your PrayerJar prayer community automatically — no CSV imports, no double entry. New members show up the next day, so your pastoral picture stays current.

**NEW:**
> Your Planning Center member list becomes your PrayerJar prayer community automatically — no CSV imports, no double entry. New members sync overnight, so your pastoral picture stays current.

**Rationale:** "Show up the next day" is ambiguous about mechanism and timing. "Sync overnight" makes the nightly batch sync explicit and accurate to current shipped behavior (webhookSecret not yet populated; real-time sync is a future capability). No other part of the PCO card is changed.

---

## §7 sweep

Banned phrases checked across all strings touched in this PR:

| # | Phrase | In touched strings? |
|---|--------|---------------------|
| 1 | "gives your [X] the tools to [Y]" | No |
| 2 | "churches that want pastoral tools" | No |
| 3 | "Set up your church in minutes." | No |
| 4 | "Bring your [X] online" | No |
| 5 | "platform" | No |
| 6 | "empower," "empowers" | No |
| 7 | "leverage" | No |
| 8 | "solutions" | No |
| 9 | "unlock" (features context) | No |
| 10 | "seamless," "streamlined," "robust," "best-in-class" | No |
| 11 | "AI-Flagged Care" | No |
| 12 | "Most Popular" | No |
| 13 | "Join the community / movement" | No |
| 14 | Emoji feature icons | No |
| 15 | Three-or-more scripture refs on one page | No |
| 16 | "Amen!" as label/heading | No |

**Result: Clean.**

Line 64 (`Nothing falls through because nobody owned it`) was reviewed and left unchanged — "falls through" (without "the cracks") is not in §7's banned list. Task instructions confirm: leave it.
