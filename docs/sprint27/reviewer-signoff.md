# Sprint 27 — Reviewer sign-off (and Sprint 26 re-review)

**Reviewer:** Reviewer agent · **Date:** 2026-07-26
**Scope:** `pj-s26-06`, `pj-s26-09`, `pj-s26-13` (Sprint 26, at `review`) and
`pj-s27-02`, `pj-s27-03` (Sprint 27, at `review`)
**Branch:** `feature/prayer-jar` · **Nothing pushed.**

Everything reviewed here is **already in production** (through `d858584`) and PM-verified
live. This is therefore a post-deploy quality gate, not a release gate.

**Nothing shipped that should not have shipped.** Both defects below are copy that is
false in the *understating* direction — they describe the product as less capable or
more expensive than it is. Neither sells anything unreachable, so neither carries the
FTC §5 exposure that drove Sprints 26–27. But both are false, on surfaces built to be
believed, and one of them is the acquisition page.

---

## Verdicts

| Task | Verdict | One-line reason |
|---|---|---|
| pj-s26-06 — church outreach asset | **needs-rework** | The rejected claim is fixed. Three *new* false claims now sit in the send-to-a-pastor copy, staled by pj-s26-13 and pj-s27-03. |
| pj-s26-09 — church claims honesty pass | **needs-rework** | Both rejected survivors are fixed. But `cc21686` labelled Prayer Team Assignments unreachable on `/for-churches`. It works end to end. |
| pj-s26-13 — restore wall, suspend expiry | **done** | Two independent locks is the right shape. Restore script is properly guarded. |
| pj-s27-02 — pull the paid tiers | **done** | Removal is complete and clean on every surface I could reach. One inherited falsehood it should have caught — noted, not charged. |
| pj-s27-03 — free limits | **done** | Cap deleted rather than raised; `events: 0` correctly retained as a lock; tests inverted into real regression guards. |

---

## Gates — re-run by me, not accepted from report

Run on `820a459`, clean tree, 2026-07-26.

```
$ npx tsc --noEmit
TSC_EXIT=0
```

```
$ npx vitest run

 RUN  v4.1.3 D:/Claude/projects/PrayerJar

 Test Files  64 passed (64)
      Tests  501 passed (501)
   Start at  10:43:59
   Duration  10.60s
```

```
$ npx next build
✓ Compiled successfully in 7.2s
✓ Completed runAfterProductionCompile in 196ms
✓ Generating static pages using 31 workers (106/106) in 429ms
```

### The 524 → 501 drop is fully accounted for. No coverage was silently lost.

Baseline 524 is `3842ff6` (`Gates: tsc 0, 524/524, build 108/108`). Counted
`it(`/`test(` per file at `3842ff6` vs `HEAD`:

| Change | Δ |
|---|---|
| `src/components/pricing-calculator.test.ts` deleted with its component | −8 |
| `src/app/(public)/for-churches/demo/actions.test.ts` deleted with the route | −10 |
| `src/app/api/v1/checkout/route.test.ts` 12 → 6 (subscription + event_license branches deleted) | −6 |
| `src/services/__tests__/event.service.test.ts` 15 → 16 (**added** a guard that the lock message names no plan) | +1 |
| **Total** | **−23** → 501 |

`plans.test.ts` (44 → 44) and `church-platform.service.test.ts` (10 → 10) changed
content at constant count, and both changed in the right direction: the assertions were
**inverted into regression guards** rather than deleted. `plans.test.ts` now asserts
`members`/`groups` are `null`, that `events` stays `0`, and that the features list quotes
no member or group number. `church-platform.service.test.ts` replaced "throws when the
plan member limit is reached" with "admits a member with no cap, however many rows
already exist" — a test that fails if a cap is ever reintroduced.

That is the correct shape. The only true deletions are tests for code that no longer
exists.

**Correction to the brief:** the arithmetic in the task description is right but
incomplete — it omits the one test that was *added*. 8 + 10 + 6 − 1 = 23.

---

## The five points

### 1. Is the free product actually whole?

**The `events: 0` reasoning is sound. I would keep it.** Verified independently:
`POST /api/v1/church/[slug]/events` (`route.ts:54`) is live, auth'd and role-gated to
admin/pastor — a real callable endpoint. `event.service.ts:37` is the only thing between
it and a created event, and the wall, moderation, display and report screens for that
event are all built with no create, edit or delete UI anywhere. Neutralising the throw
would manufacture a new half-working surface inside the sprint whose purpose was a free
product that works. No free user can be dead-ended by it, because no UI reaches it. The
message now names no plan (`'Live events are not available yet.'`) and a test guards
that it never does again.

**The member cap is genuinely gone, not raised.** `addChurchMember`
(`church-platform.service.ts:165`) no longer calls `getChurchTier`, does no count query,
and has no conditional — the insert is unconditional. `PLANS.free.limits.members` is
`null` as belt-and-braces. Verified `groups` and `admins` have no enforcement site
anywhere in `src/`.

**No free-tier *action* dead-ends.** I checked every remaining gate. `hasCustomSubdomain`
is the only user-facing one left and it is correctly retained (scarce, unreclaimable
global namespace; `SUBDOMAIN_ROUTING` is unset so it costs a free church nothing today),
with `BrandingForm` copy that names no plan and points at `/contact`. The four dormant
tier predicates have zero callers outside `plans.test.ts`, as intended.

**But there is a third gating mechanism the removal plan's methodology could not see.**
§0.3 swept for `limits.` and found two enforcement sites. That sweep was structurally
incapable of finding gates written against `churches.currentPlan`, and there is one:

> `src/app/api/cron/chms-summary-scheduler/route.ts:66`
> `inArray(churches.currentPlan, ['pro', 'enterprise'])`

This cron is **live in `vercel.json`** (`0 5 * * 0`, weekly). Every real church now
resolves to `free`, so the PCO weekly summary is unreachable-by-construction for all of
them — silently, with no error and no UI. It is not a dead-end in the wall-you-hit sense
(nothing promises the summary; the `/for-churches` Planning Center card claims only
member sync, and I confirmed `chms-full-sync-scheduler:16` gates on
`isNotNull(chmsProvider)` only, so that claim holds). It is a feature that is now
permanently off, gated on tier names that no longer exist in the product.

**This is the same root cause as §C.6 and belongs in `pj-s27-08`, not a new task.** I
have added it to that task's notes.

### 2. Did hiding analytics/flagged/testimony orphan anything?

**No live orphan.** Grepped `src/`, `e2e/`, `scripts/` for the three route paths: zero
hits outside explanatory comments. `ChurchSidebar` no longer lists them, `NAV_ITEMS`
carries no `minTier`, `NavItem` has no `locked` branch, and the Pastoral Dashboard's
Flagged Prayers quick-nav link is gone. All three stubs are the same shape — `notFound()`
with a comment naming the missing write path and `pj-s26-10` as the restore point — and
each correctly leaves its sibling components in place (`AnalyticsCharts.tsx`,
`AnalyticsChartsLazy.tsx`, `FlagActions.tsx`, `TestimonyActions.tsx`) rather than
deleting work that will be needed again.

**One latent orphan a literal grep cannot reach, worth recording.** The weekly church
digest email builds its flagged link by string construction:

> `src/emails/church-digest.tsx:122` — `<a href={`${digestUrl}/flagged`}>View flagged prayers →</a>`

That now points at a `notFound()` route. It is unreachable in practice for two
independent reasons: it renders only inside `{flaggedCount > 0 && …}`, and `flagPrayer`
(`pastoral.service.ts:114`) has no caller outside its own tests, so `flaggedCount` is
structurally always `0`. `digestUrl` is also built from the church **UUID** rather than
the slug, so it 404s regardless — already tracked as `pj-s27-07`. Not a defect to fix
now; noted so it is repaired alongside `pj-s26-10` when flags start being written.

### 3. Is `/for-churches` accurate?

I checked all nine cards against the code, not against the audit doc. Eight are accurate
or conservative in a defensible way. **One is materially false, and it understates a
feature that works.**

> Card 4 — *"The assignment screen works, but there is nothing to put on it — no prayer
> is attached to a church yet."*
> `notYet:` *"Nothing can be assigned until prayers are church-linked."*

Prayer Team Assignments do not depend on `prayers.church_id` at all:

- `assignPrayer` (`pastoral.service.ts:280`) writes `prayerAssignments.churchId` from the
  **church resolved by slug in the route**, never from the prayer.
- `getChurchAssignments` (`:266`) filters that same column, then `innerJoin`s `prayers`
  on `prayerAssignments.prayerId` to render content and category.
- `POST /api/v1/church/[slug]/assignments` validates that the *assignee* is a church
  member. It applies no ownership check to the prayer.

So an admin can paste any prayer UUID — trivially obtainable, since every prayer has a
public `/p/[id]` page — and get a real, persisted, rendering assignment. The round trip
works today. The genuine limitation is UX: there is no picker, so the UUID goes in by
hand (`AssignPrayerForm.tsx:63`, placeholder `e.g. 550e8400-…`).

The removal plan said this correctly (§C.1: *"Works — but the form requires an admin to
paste a raw prayer UUID by hand"*), and `dashboard/team/page.tsx:44` says it in a code
comment — *"(POST .../assignments → getChurchAssignments) and are open to every
church."* The page was unlocked on the strength of that finding while the acquisition
page kept telling churches the feature is inert.

The asymmetry makes it worse: **"Prayer Team" is a top-level sidebar item.** A pastor is
handed prominent navigation to a screen the marketing page says cannot hold anything.

`git log -L` on the `notYet` string returns `cc21686` — `pj-s26-09`. That task's remit
was "stop selling unreachable church features"; it took one step too far and labelled a
*reachable* feature unreachable. `pj-s27-02` edited this array to strip nine `tierLabel`
fields and should have caught it while it was in there, but it did not author it.

**No card overstates a gap in the other direction, and none understates a gap.** Spot
checks that held: the digest genuinely cannot count prayers (`church-digest/route.ts:66`
filters `prayers.churchId`); analytics is genuinely 4-of-5 dead; testimony genuinely
publishes unreviewed; live events genuinely cannot be created; Planning Center nightly
sync is genuinely ungated.

### 4. The fourth survivor — and it is not in `src/`

There is one, and it is the most consequential surface of the four passes, because it is
the only artifact designed to be **handed to a customer**.

`docs/sprint26/church-outreach-asset.md` — *"the thing Ron hands a pastor"* — now
contains three false statements in the body copy a pastor actually reads:

| Line | Claim | Why it is false now |
|---|---|---|
| `:112` | *"Requests rest after 30 days rather than accumulating forever."* | `pj-s26-13` suspended expiry behind two locks. Prayers do not rest. Nothing expires. |
| `:127` | *"Private notes for the people who shepherd. … Included from the $19 plan."* | `pj-s27-02` removed the $19 plan. The care inbox is free and ungated. |
| `:154–156` | *"A free church account holds 75 people. Paid plans cover pastoral features … stay on the free plan"* | No 75-person cap (`pj-s27-03` deleted it) and no paid plans to stay off. |

The claims table beneath it is stale in the same four places — row 3 cites
`expire-prayers` as running daily "in `vercel.json`" where the entry no longer exists;
row 10 cites `members: 75` and the deleted enforcement site; row 11 says
`/for-churches:100` "advertises it at $49"; row 12 gates the care inbox at
"Small Church ($19) and above."

**The process finding matters more than the instance.** Removal-plan §A.6 states both
completeness sweeps ran *"over `src/`, with tests excluded."* Every honesty pass in both
sprints has been `src/`-only. That is *why* each pass leaves survivors: the one
customer-facing deliverable that does not live in `src/` was never in scope for any of
them. This is not an argument for sweeping `docs/` wholesale — sprint archives are
*supposed* to record what was true when written, and rewriting them destroys the audit
trail. It is an argument for identifying the handful of **deliverable-shaped** documents
(outreach assets, email drafts, one-pagers) and putting those, and only those, inside the
sweep boundary.

Second process finding: **all four passes hunted overstatement.** The FTC §5 framing
meant every sweep looked for claims that oversold. The Prayer Team card in §3 is an
*understatement* — no pass was looking for those, which is precisely how it survived four
of them.

### 5. `pj-s26-13` — is the suspension the right shape?

**Yes, and the two locks are genuinely independent, which is what belt-and-braces should
mean.** Lock 1 (`vercel.json` entry removed — verified absent) stops the schedule. Lock 2
(`PRAYER_EXPIRY_ENABLED === 'true'`, `route.ts:25`) stops a manual call or a re-added
cron entry. Either alone is sufficient; neither can be defeated by the mistake that
defeats the other. The no-op path returns an explanatory JSON body rather than a silent
`200`, so an operator who calls it learns why nothing happened.

The restore script is well-guarded: dry-run by default (`--commit` required), touches
only `status='expired'`, asserts the answered count is unchanged and `exit(1)`s if it
moved, and sets `expiresAt` a year out specifically so a future re-enable cannot wipe the
restored rows in one pass. It fabricates nothing.

**The re-enable hazard is documented but not enforced, and the exposure grows.** The
comment at `route.ts:18–23` is prominent and correct. But it is the *only* guard:
`expireOverduePrayers` (`prayer.service.ts:185`) is an unbounded
`UPDATE … WHERE status='active' AND expires_at < NOW()` with no batch cap and no
dry-run, and `createPrayer` (`:59`) still stamps `expiresAt: addDays(new Date(), 30)` on
every new prayer. So each week the suspension stays on, the population of
already-past-due prayers that one flag would delete in a single instant gets larger — and
the only thing standing in front of it is a code comment that a future operator has to
read before setting an env var in the Vercel dashboard, which is not where the comment
is.

**I am not rejecting for this.** A batch cap is scope creep on a task that did what it
was asked, and the two locks are exactly right for preventing the accidental run. But the
hazard is real, unbounded, and compounding, so it should not live only in a comment. I
have opened it as a follow-up (`pj-s27-10`) rather than leaving it in prose.

---

## What the PM got wrong

1. **The sweep boundary, not the sweeps, is why survivors keep appearing.** §4 above. The
   brief said "assume there is a fourth and go looking" — correct instinct, but it framed
   the hunt as another pass over the same surface. Four passes over `src/` found three
   survivors *in* `src/`; the fourth is in `docs/`, where nobody has looked, in the one
   file a customer is meant to receive.
2. **Every pass hunted overstatement.** The framing that produced these sprints — FTC §5,
   "stop selling unreachable features" — is directional. The `/for-churches` Prayer Team
   defect is the mirror image and no pass was built to catch it. The check that finds it
   is "does any card claim a gap that the code does not have?", which nobody has run.
3. **The events reasoning in the brief is sound but the enumeration behind it is not
   complete.** The brief accepts §0.3's two enforcement sites. There is a third mechanism
   — `churches.currentPlan` — with a live weekly cron on it. §1 above.
4. **The 524 → 501 accounting omits the added test.** 8 + 10 + 6 (checkout) − 1
   (event.service gained a guard) = 23. The brief's list would produce 22.
5. **The removal plan's own hard gate was never run, and the deploy went ahead anyway.**
   §0.6 says the "zero churches have ever paid" claim was *inherited from Sprint 26 and
   not re-verified*, and states plainly: *"Before any deletion PR merges, someone with DB
   access must run"* two `SELECT`s against prod — one over `subscriptions`, one over
   `churches` — and *"if either returns a real paying record, **stop**."* I grepped
   `handoffs.md` and all of `docs/sprint27/`: **no run, no output, no record.** The
   brief to me did not mention the gate either, and everything shipped. The partial
   consolation is indirect: `scripts/delete-test-church.mjs` (`pj-s26-12`, still
   `in-progress`) refuses to run unless prod holds exactly one church named `Test Church`
   with `NULL subscription_id` and `NULL first_paid_at` — but that is an assertion the
   script *would* make, not a result anyone has recorded, and it says nothing about the
   `subscriptions` table. On the available evidence the assumption almost certainly
   holds, and no deleted DB column or table makes this hard to unwind. But an
   explicitly-declared stop-the-line precondition that nobody ran, on a change that is
   now in production, should be closed rather than left open — and it should not have
   fallen to the Reviewer to notice it was skipped.

**One thing the brief did not claim but which the record makes worth stating:** `pj-s27-04`
(the QA sweep) is untouched — `status: proposed`, one PM note, never started. Removal-plan
§E called it *"not optional."* PM did run an independent sweep on 2026-07-25 and recorded
it in `handoffs.md`, which covers the same ground in substance — but that sweep was scoped
to `(public)`, `(dashboard)`, `(church)` and `components`, i.e. `src/` only. So the formal
QA task was never run, and the informal substitute inherited the exact boundary that let
the fourth survivor through. That is the strongest available evidence for finding 1.

---

## Risk if left as shipped

**Low.** Both defects are false copy in the understating direction, on a product with one
test church and no paying customers. `pj-s26-09`'s defect costs a church the belief that
a working feature works; `pj-s26-06`'s costs Ron nothing until he sends the asset, which
he has not — it is still marked `DRAFT — awaiting human approval`. Neither is a code
defect and neither warrants a hotfix deploy. Both should be fixed before the next church
outreach.

---

## Follow-ups opened

- `pj-s27-10` — prayer expiry re-enable is guarded by a comment only (§5).
- `pj-s27-11` — run the §0.6 prod billing verification that the removal shipped without.
- Added to `pj-s27-08` — `chms-summary-scheduler` gates on `currentPlan` (§1).
- Recorded in `pj-s27-07` — the digest's `/flagged` link now lands on `notFound()` (§2).
