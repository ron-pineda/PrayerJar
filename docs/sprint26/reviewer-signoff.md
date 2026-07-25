# Sprint 26 — Reviewer sign-off

**Reviewer:** Reviewer agent · **Date:** 2026-07-25
**Scope:** the seven tasks at `review` — pj-s26-01, -02, -03, -04, -05, -06, -09
**Branch:** `feature/prayer-jar` · **Nothing pushed.** Push auto-deploys to production
(`.github/workflows/deploy.yml`), so this document is a release gate, not a formality.

---

## Verdicts

| Task | Verdict | One-line reason |
|---|---|---|
| pj-s26-01 — PDF claims in `/docs` | **done** | Claim removed everywhere; convention followed; no PDF exporter built. |
| pj-s26-02 — state reconciliation | **done** | Spot-checked three of its own claims independently; all held. |
| pj-s26-03 — funnel instrumentation | **done** | Code is correct. One severity sentence in its note is wrong — corrected below, no rework. |
| pj-s26-04 — SEO audit | **done** | Real defects found and fixed; the unprovable half is already tracked as pj-s26-11. |
| pj-s26-05 — share-path review | **done** | Docs only; correctly declined to land the robots.txt change. |
| pj-s26-06 — church outreach asset | **needs-rework** | Leave-behind tells a pastor prayers are *"not public to search engines."* They are. |
| pj-s26-09 — church claims honesty pass | **needs-rework** | `/billing:114` still sells "private prayer walls … included on paid plans" above the upgrade button. |

Two rejections. Both are the *same defect the sprint exists to remove*, surviving in the
one place the pass did not look. Neither is a large fix.

---

## Gates — re-run by me, not accepted from report

Run on `f86e963`, clean tree, 2026-07-25.

```
$ npx tsc --noEmit
TSC_EXIT=0
```

```
$ npx vitest run

 RUN  v4.1.3 D:/Claude/projects/PrayerJar

 Test Files  64 passed (64)
      Tests  513 passed (513)
   Start at  01:12:59
   Duration  14.87s
VITEST_PIPE_EXIT=0
```

```
$ npx next build
✓ Compiled successfully in 7.9s
  Generating static pages using 31 workers (0/108) ...
  Generating static pages using 31 workers (27/108)
  Generating static pages using 31 workers (54/108)
  Generating static pages using 31 workers (81/108)
✓ Generating static pages using 31 workers (108/108) in 425ms
  Finalizing page optimization ...
BUILD_EXIT=0
```

**108/108** — matches the gate exactly. Worth noting that this was the number to
watch: pj-s26-04 added ten `/pray/[category]` entries to `sitemap.ts`, but sitemap
rows are data inside one already-counted route, not pages, so the count correctly
did not move.

All three match what was reported. `tsc` held at 0 — the Sprint 25 headline win is intact.
Suite grew 459 → 513 (+54 from pj-s26-03's attribution and redaction tests), which is the
expected direction.

---

## The five things the PM asked me to scrutinise

### 1. The 5/25/50 trust threshold — invented policy, but the right mechanism. Does not block.

Keep the hardcoded constants. Do **not** move them to env or config.

A trust threshold is a claim about what the site is allowed to assert about itself. Putting
it in an env var means a production environment change can silently switch social proof back
on with no diff, no review, and no test — which is a strictly worse version of the bug being
fixed. Hardcoded constants are visible in the diff, greppable, and change only through review.

The implementation is sound: the gate is fail-closed (`>=` on all three), and — the part that
matters — the hero `countLabel` and the strip now read **one** predicate (`isPublishableTrust`),
so they cannot disagree. Before this change they could, and did: the strip was gated on
`churches > 0` while the hero label was not gated at all.

The *numbers* are unratified and Ron has not seen them. That is a decision item, not a defect.
Route it to `INBOX.md`.

One deliberate oddity worth knowing: `pluralize()`'s singular branch is currently unreachable,
because every floor is above 1. The note explains this is intentional — it keeps the
`"1 churches"` bug from returning if the floors are ever lowered. That is a defensible reason
to keep dead-ish code and it is documented at the site. Accepted.

### 2. `PLANS.limits.events` — not a real gap. Clean deferral.

**Verified:** `limits.events` still has a live enforcement site.

```
src/services/event.service.ts:30   const limit = PLANS[tier].limits.events;
:33   if (limit === 0) throw new Error('Live events require a Starter plan or higher.');
:35   if (limit !== null) { …count non-ended events… throw 'Event limit reached for your plan.' }
```

`createEvent` is the only creation path, and the tier check sits inside it. What
`(admin)/events/page.tsx` lost was a *presentation* gate that decided which button to draw —
not enforcement. The remaining `grep limits.events` hits across `src/` are that service line
plus the explanatory comment left in the page.

So no paid limit is unenforced today, and none would be even if events were reachable. The
deferral to pj-s26-10 is correct and the comment left at the removal site names the task that
restores it. Approved on this point.

### 3. The OG fix — approving it is right, because the unprovable half is already a separate task.

State it precisely rather than hedging. A green build proves the `next/og` import resolves and
the four route handlers compile. It does **not** prove the Satori/Resvg WASM gets traced into
the deployed serverless bundle, which is the actual production failure. Local success proves
even less, since the 500 never reproduced locally in the first place.

That gap is exactly what **pj-s26-11** exists for: post-deploy `curl` of
`/api/og/card/prayer` and `/api/og/card/answered` against prod, with the correct URLs, plus a
re-check that `/opengraph-image` still returns 200. The fix is low-risk in the failure
direction — those routes already return 500, so a wrong fix leaves them no worse — and the
verification is staged and owned. Shipping unproven is acceptable **on the condition that
pj-s26-11 runs immediately after the deploy, not at the next sprint's convenience.**

Two supporting checks I ran:

- `next/og` is a real export in this version. `next@16.2.2`; `node_modules/next/og.js` and
  `og.d.ts` both exist and `require.resolve('next/og')` succeeds. (Worth confirming rather
  than recalling, per `AGENTS.md`.)
- **The fix is partial in scope.** `src/app/opengraph-image.tsx:1` still imports
  `ImageResponse` from `@vercel/og`, and `@vercel/og` is still a `package.json` dependency.
  This is *not* a blocking defect — that file is a Next metadata-image convention, it is
  prerendered statically (`○ /opengraph-image` in the build output), so no runtime WASM
  tracing is involved, and pj-s26-11 already re-checks it. But the task's stated diagnosis
  ("Next 16 requires `next/og`") applies to a file the task did not change, and that
  inconsistency should be closed deliberately rather than left as an accident.

### 4. Not rewriting history — correct, and adequately documented.

Rewriting a commit that other work is stacked on, in a shared working tree, to fix a
*message*, trades a real risk of losing work against a cosmetic gain. Wrong trade. The call
was right.

The file→task mapping is written down from both sides and is specific enough to reconstruct:
`.agent-state/notes/pj-s26-03-funnel-instrumentation.md:171-190` gives the commit map, and
`docs/sprint26/seo-audit.md:380-392` records the same collision from the Growth agent's side
and names `c386164` as jointly owned.

**One correction for the PM.** The brief — and `handoffs.md` — say *"commits `c386164` and
`1f4dc8f` contain other agents' files."* That is half wrong. `1f4dc8f` is a **single-file
commit** touching only `docs/sprint26/church-outreach-asset.md`, which is exactly what its
message says it does. Only `c386164` is misattributed: 30 files, of which 13 belong to
pj-s26-04/05 (the message) and 17 to pj-s26-03. Please fix the ledger, or a future reader
will go looking for a contamination that is not there.

The process fix already proposed in the -03 note — one git worktree per agent, or serialise
commits through the PM — is the right one. `git add` + `git commit` is not atomic.

### 5. Relabelled claims that are still overstated — two found, both blocking.

This was the point of the sprint, so I went looking rather than reading. Two survive.

#### 5a. `/billing:114` — blocks pj-s26-09

```
src/app/(dashboard)/billing/page.tsx:114
  Church features — private prayer walls and pastoral tools — are included on paid plans.
```

This names the flagship non-functional feature, in the present tense, as *included*, in the
free-plan branch of the billing page — directly above a `<UpgradeButton tier="starter">`.

It is not an oversight of scope. `cee2439` touched **this file**, for **this reason**, and
added a disclaimer three lines further down ("Items marked 'coming soon' are not available
yet. You are not being charged for them"). The pass fixed the `✓` glyphs rendered from the
`PLANS` data array and did not see the hardcoded sentence above them — the same
data-vs-hardcoded-string blind spot the -09 note itself identifies as the reason `/billing`
was missed the first time. It got caught once and recurred in the same file.

Checkout surface, present tense, the single feature that cannot be reached.

#### 5a-bis. `/church/join:122-124` — same task, same pattern, second survivor

Checked directly because the PM named this surface, and my first grep would have
hidden exactly this kind of hit (it filtered out lines containing "coming soon" /
"not available" / "not yet", which suppresses hardcoded prose in an otherwise-fixed
file — the same way `/billing:114` nearly escaped).

```
src/app/(public)/church/join/page.tsx:122-124   (the "already a member" branch)
  Head over to your church's prayer wall to see what's been shared.
  → Link href={`/church/${church.slug}/wall`}   "Go to Prayer Wall"
```

That wall's own empty state, rewritten by **this same task**, now reads
*"This wall is not receiving prayers yet."* (`(church)/church/[slug]/wall/page.tsx:91`).
So the page tells a member there is something shared to go and see, and sends them to
a page that tells them there is not and cannot be.

pj-s26-09 fixed the *not-yet-a-member* branch of this file correctly — lines 167-169
now say plainly that the private wall is not available yet and that prayers posted
today go to the public wall. It did not revisit the already-a-member branch above it.

Lower severity than `/billing:114`: it is in-app rather than pre-purchase, and the
member lands on an honest empty state, so the misdirection self-corrects in one click.
I am not treating it as an independent blocker — but it is the same miss pattern in
the same task, and since -09 is going back anyway it should go back with both.

Fix both and resubmit.

#### 5b. `church-outreach-asset.md:88` — blocks pj-s26-06

```
docs/sprint26/church-outreach-asset.md:88   (§2, the one-page leave-behind)
  PrayerJar is a prayer wall, not a feed. Someone posts what they are carrying. Real people
  pray for it. Nothing is ranked, nothing is public to search engines, and nobody is
  counting likes.
```

The subject of that sentence is member-submitted prayer content. The claim is false:

- `src/app/robots.ts` — `allow: '/'`, disallowing only `/api/`, `/admin/`, `/church/`.
- `src/app/(public)/p/[id]/page.tsx:34,37,43` — the prayer permalink server-renders
  `prayer.content.slice(0, 155)` into `description`, `openGraph.description` **and**
  `twitter.description`. Prayer text is emitted directly into indexable metadata.
- No `noindex` anywhere — and **this sprint's own audit says so**:
  `docs/sprint26/seo-audit.md:234` — *"**No `noindex` leaks.** Grepped the whole of `src/`
  for `noindex` / `robots:` / `index: false`."*
- The same sprint *increased* it: pj-s26-04 added ten `/pray/[category]` routes to
  `sitemap.ts` at `priority: 0.8`.

**Pre-empting the obvious counter-argument, because it is a good one.** The same
`p/[id]/page.tsx` does `if (!prayer || prayer.status === 'expired') notFound()`, and
every one of the 11 prayers in production is currently `expired`. So anyone who curls
a prayer permalink *today* gets a 404 and could conclude the reviewer is wrong. They
would be checking the wrong thing. The claim in the leave-behind is a promise about
what happens to **that pastor's congregation's prayers going forward**, not a
description of a data snapshot. The mechanism is live in code with no `noindex` and
`allow: '/'`, and it starts emitting prayer text into indexable metadata the moment
any member posts — which is precisely the outcome the leave-behind is asking for.
An empty index is not a privacy guarantee.

So Sprint 26 shipped one task making prayer pages more discoverable and another task telling
a pastor they are not discoverable, and neither noticed the other.

Why this blocks rather than gets noted:

1. It is a **privacy** claim about sensitive member-submitted content, made to a pastor who
   will repeat it to their congregation. Wrong in the direction that hurts people.
2. It is in the artefact **Ron physically hands over**. A wrong sentence on a web page can be
   edited after the fact; a leave-behind cannot be recalled.
3. It **escaped the document's own control**. §3 is a 19-row claims table pairing every
   factual claim with the code that proves it. This claim is not in it. The verification
   process the task is built on skipped its own riskiest line.
4. The document is otherwise excellent, which is the problem — a reader who has checked ten
   verified claims will not doubt the eleventh.

To be fair to the task: §4 of the same document *does* disclose that "Prayers your members
post are on the open PrayerJar wall, prayed for by people beyond your church." That
disclosure is honest and it is what makes this fixable rather than fundamental — but it does
not neutralise a flat privacy assertion made forty lines earlier in the pitch, and "on the
open wall" is not the same statement as "indexed by Google."

The fix is one sentence and the truthful version is not weaker: nothing is ranked and nothing
is counting likes are both still true and both still differentiate. Only the search-engine
clause has to go — or become accurate.

---

## Correction to pj-s26-03's note — recorded here, not treated as rework

The -03 note (and `handoffs.md`) says migration 0033 is *"NOT applied — run
`scripts/apply-0033-runner.mjs`; apply BEFORE deploy or signups in the gap lose attribution
permanently."* Both halves need adjusting, in opposite directions.

**The pipeline already handles it.** `.github/workflows/deploy.yml` runs
`npm run db:migrate:deploy` **between** `vercel build --prod` and `vercel deploy --prebuilt
--prod`, and fails closed — if migration fails, the deploy step never runs and production
keeps serving old code against the old schema (`docs/ops/deploy-migrations.md`). Migration
0033 is journaled at `meta/_journal.json` idx 33, `when: 1784851200000`, above every seeded
entry, so drizzle's migrator picks it up. Hand-running the runner first is harmless (every
statement is `IF NOT EXISTS`) but it is **not required**, and the note implies it is.

**But the stated consequence is far too mild.** "Signups in the gap lose attribution" is not
the failure mode. `schema.ts` now declares six columns that prod does not yet have, and
drizzle's bare `select()` emits an explicit projection, not `*`. Verified with `.toSQL()`
against the real schema:

```
select "id", "name", "email", "email_verified", …, "activityLevel",
       "acquisition_source", "utm_source", "utm_medium", "utm_campaign",
       "signup_referrer", "signup_landing_path"
from "users" where "users"."id" = $1
```

`@auth/drizzle-adapter/lib/pg.js` uses a bare `.select()` on `users` in `getUser` (:89),
`getUserByEmail` (:96) and `getUserByAccount` (:146). If that code ever reaches production
against an unmigrated `users` table, every one of those calls raises Postgres `42703
column does not exist` — **authentication is down**, along with `/profile`, `/settings`,
`/badges`, `badge.service`, `email.service` and `notification.service`, all of which use bare
selects.

CI makes that unreachable on a normal push. The residual is the abnormal path only: a manual
`vercel --prod`, or any deploy that bypasses the migrate step. Given that a manual deploy is
explicitly warned against in `deploy.yml`'s own failure message, this is a small risk — but it
should be recorded at its true size, not as an analytics inconvenience.

Worth naming the pattern, because it is instructive: the agent wrapped the attribution
*write* in `try/catch` so it could never block a signup (`src/lib/auth.ts:76-81`, and the
reasoning is written out). Careful work. It then never considered the *reads* that the same
schema change created. **The path that was defended was the one that was already safe.**

No rework. The code is right, the migration is right, the runner is right. One sentence of
severity was wrong and it is corrected here.

---

## Not blocking — carry forward

- **`src/app/opengraph-image.tsx` still on `@vercel/og`** while the four `/api/og/*` routes
  moved to `next/og`. Statically prerendered, so low risk, and pj-s26-11 re-checks it.
  Close the inconsistency deliberately.
- **`/for-churches` FAQ, "What happens when we reach our member cap?"** — *"You will see a
  notice in your admin panel when you are approaching the limit."* I found no
  approaching-limit notice: `church-platform.service.ts:173-181` throws a hard error **at**
  the cap and nothing warns before it. Pre-existing, untouched this sprint, and it
  under-delivers on a soft promise rather than selling vapour — but it is the same defect
  class and should go on the pj-s26-10 list.
- **Enterprise tier inherits unshipped features implicitly.** `PLANS.enterprise.features`
  opens with *"Everything in Growing Church"* rendered with a `✓`, while Growing Church now
  carries three `(coming soon)` rows. `isComingSoonFeature()` cannot see inside an
  inheritance phrase. Not misleading enough to block — enterprise is sales-led, not
  self-serve checkout — but it is a hole in an otherwise complete mechanism.
- **Trust threshold numbers (5/25/50)** need Ron's ratification. `INBOX.md`.
- Everything already listed under "Reported, deliberately NOT fixed" in
  `.agent-state/notes/pj-s26-09-church-claims-honesty-pass.md` — the ungated analytics page
  is the one with teeth, and it is correctly routed to pj-s26-10.

---

## What I checked to approve pj-s26-02

Its deliverable is entirely *claims about what is true*, so approving it on its own report
would repeat the failure this sprint exists to correct. Three spot-checks, all independent:

- **`ADMIN_EMAILS` comma-separation is implemented** — `src/lib/admin-auth.ts:11-15`
  (`requireAdmin`) and `:34-38` (`withAdmin`) both `.split(',').map(trim).filter(Boolean)`.
  Claim holds at both cited sites.
- **`sprints.json` counts** — 52 entries, 51 `done` / 1 `planned`, and exactly 19 rows with
  `closed_at: "unknown"`. Matches the note exactly. Sprints 23/24/25 are backfilled with real
  evidence rather than invented dates, and `closed_at: "unknown"` on the reconciled rows is
  the honest choice.
- **Auto-deploy via GitHub Actions** — `.github/workflows/deploy.yml` triggers on
  `push: branches: [feature/prayer-jar]`. Confirmed, and it is why this sign-off is a release
  gate.

---

## What I think the PM got wrong

Asked for directly, so stated directly.

1. **`1f4dc8f` is not misattributed.** One file, matching its own message. Only `c386164` is
   contaminated. `handoffs.md` and the brief both need correcting. (§4 above.)
2. **The 0033 warning points the wrong way twice** — it asks for a manual step the pipeline
   already performs, and describes an auth outage as an attribution gap. The open decision
   item *"migration 0033 must be applied BEFORE next deploy"* in `handoffs.md` should be
   reworded; as written it invites a hand-run that is unnecessary, and a hand-run that
   *replaces* rather than precedes CI would be the actual dangerous move.
3. **The brief framed my job as approve/reject on six tasks and left the release decision
   implicit.** Two tasks are rejected, so the sprint does not close this session, and the
   branch should not be pushed until they land — but that is a conclusion I had to draw, not
   one the brief asked for. Say it outright next time; a release gate should not be a
   side-effect of a task-status field.
4. **A minor one, in the PM's favour.** The brief warned me the OG fix was unverifiable and
   asked whether that was acceptable. It was already handled — pj-s26-11 exists and specifies
   the correct URLs and the `card/home` trap. The instinct to flag it was right; the anxiety
   was already resolved by the PM's own earlier work.

And the thing to keep doing: three agents corrected this PM's briefs this sprint and every
correction was recorded in `tasks.json` next to the original claim rather than quietly
replacing it. That is why this review could be done at all. A brief that is wrong and
annotated is worth more than a brief that is right and unsourced.

---

## Two disclosures about this review itself

**pj-s26-07 (QA gate pass) never ran.** It is still `proposed`. That means this review
is the only verification Sprint 26 received, and I am a code reviewer standing in for a
QA pass — which is exactly the substitution that tends to go unnoticed. I re-ran all
three mechanical gates myself, so those are covered. What is *not* covered is the part
of -07 that is inherently live: *"`/docs` copy fix verified on the deployed site, not
from source."* That cannot be performed by anyone until the branch is pushed, and the
branch should not be pushed until the two rejections land. Someone has to close that
loop after deploy, alongside pj-s26-11.

**I did not run the two subagent passes my own role definition mandates.**
`Reviewer.md` requires `pr-review-toolkit:code-reviewer` and
`pr-review-toolkit:silent-failure-hunter` on every task; my operating instructions
forbid spawning subagents unless asked, and this brief did not ask. I resolved that in
favour of the operating instruction and reviewed by hand. Recording it rather than
leaving the checklist silently unticked. The one place `silent-failure-hunter` would
plausibly have earned its keep is the `try/catch` around `recordSignupAttribution`
(`src/lib/auth.ts:76-81`) — an analytics write that swallows its own errors. I checked
that by hand: the swallow is correct and deliberate (it must never block a signup), it
logs to `console.error` rather than discarding, and the reasoning is written at the
site. The failure it *cannot* swallow is the read-path one described above, which is
why that section exists.

---

## Release recommendation

**Do not push yet.** Two tasks are at `needs-rework`; both fixes are small and localised
(`/billing:114` is one sentence, `church-outreach-asset.md:88` is one clause). When they land
and the gates re-run clean:

1. Push (CI applies 0033 automatically, before the deploy publishes).
2. Run **pj-s26-11** immediately — the OG fix is unproven until it is curled against prod.
3. Take the three open decisions to Ron: trust floors (5/25/50), the Test Church deletion
   (pj-s26-12), and the `@PrayerJar` handle hardcoded in the `/wrapped` share tweet
   (pj-s26-05).
