# Church outreach asset — the thing Ron hands a pastor

**Task:** pj-s26-06 · **Sprint:** 26 · **Date:** 2026-07-25
**Author:** Growth + Content
**Status:** DRAFT — awaiting human approval before any of this is sent

Two pieces of copy, then the receipts. The email is what Ron sends cold. The one-pager is what he
leaves on a desk or attaches as a PDF he exports himself from this file.

> **Read the "Before you send this" section first.** Verification against prod and the codebase
> turned up a defect that changes what can honestly be pitched. Four features advertised on
> `/for-churches` are not reachable by a user today, including the headline feature of the $19 tier.
> Everything below is built only from what was verified working. Nothing was softened — the
> unreachable features are simply absent.

---

## 1. The email

**Send to:** a named pastor or care-team lead at a church of roughly 60–300 people, ideally one Ron
has met. Not a list. This is a one-to-one email.
**Success metric:** replies, not opens. Ten sends, one conversation booked is a working message at
this stage. Zero replies from ten sends means the message is wrong, not that the market is wrong.

**Subject:** Prayer requests that go quiet by Thursday

---

Pastor [Name],

Someone hands you a prayer request after the service. By Thursday it lives in a group chat, a card
box, or your head, and nobody is quite sure who followed up.

I built PrayerJar for that gap. Each of your small groups gets a prayer space only its own members
can open — not a thread the whole church scrolls past. During a service or a retreat, requests come
in from people's phones, you approve what shows, and it goes up on the screen. If you use Planning
Center, your roster syncs overnight, so nobody is hand-keeping a spreadsheet.

Prayer is free for every member and always will be. A free church account holds 75 people. Pastoral
plans start at $19 a month.

I will be straight with you: no church is running on this yet. You would be the first, and I would
set it up with you myself.

Worth 20 minutes this week?

Ron Pineda
prayerjar.org/for-churches

---

**Notes on the email**

- 168 words. One ask. No attachment on the first send — attachments cut deliverability and the
  one-pager is better as the follow-up after a reply.
- The "no church is running on this yet" line is deliberate and load-bearing. A pastor who finds out
  later is a pastor who stops answering. Said first, it converts into a reason to talk: being first
  means Ron's full attention.
- "I would set it up with you myself" is a real commitment on Ron's calendar. It is honest at zero
  churches; it stops being honest at ten. Ron's call whether to keep it.
- Do not add a testimonial, a church name, or a usage number. There are none. See §5.

---

## 2. The one-page leave-behind

---

### Prayer that stays with the people it belongs to

Every small group in your church gets a prayer space only its own members can open. On a Sunday,
prayer requests come in from the pews and go up on the screen after you have read them.

---

**What most churches are using right now**

| | What it costs you |
|---|---|
| **A group chat** | Everyone sees everything, so nobody asks for the hard thing. Monday's request is buried under Wednesday's photos. |
| **A card box or connect card** | Somebody has to read them, type them up, and remember them. No one can tell you which ones were prayed for. |
| **A spreadsheet** | Right on Monday, stale by Wednesday. One person opens it, and that person is you. |

---

**What is different here**

**Prayer circles that actually stay closed.** A women's Bible study sees its own requests and
nothing else. The rest of the church cannot open it, and neither can the public side of PrayerJar —
group prayers never appear on any public page. *Free plan: 3 groups. Small Church: 5. Growing
Church: no limit.*

**A prayer wall for a service or a retreat.** People submit from their phones. Your moderator
approves each one before it appears, and the approved requests display on a screen at the front. You
can download the whole night as a spreadsheet afterwards. *Small Church: 2 events a year. Growing
Church: 12. Network: no limit.*

**Your Planning Center roster, kept current on its own.** Connect Planning Center once. New people
and new groups sync overnight, so your PrayerJar roster matches your church records without anyone
re-typing a list. Once a week, PrayerJar writes a short prayer summary back onto each person's
Planning Center record.

**Requests carried by more than your own people.** Any member can also post to the open PrayerJar
wall — by name or anonymously — and be prayed for by people outside your church. Every submission
runs through a safety check before it posts. Requests rest after 30 days rather than piling up
forever.

**A page for your church that people can actually find.** Your church gets its own page with your
name, colours, logo, and a welcome message, plus an invite link you can put in a bulletin or a text.

**Private notes for the people who shepherd.** Your pastors and admins can keep notes on a person or
a request that only your leadership sees. Members never see them.

---

> *"Bear one another's burdens, and so fulfill the law of Christ."* — Galatians 6:2

---

**Where we are early, plainly**

- **No church is running on PrayerJar yet.** You would be the first. That means real attention from
  the person who built it, and it means you would be finding the rough edges.
- **There is no import.** Prayer history from another tool has to be re-entered by hand. Members
  join by invite link.
- **Reporting is on the screen, not in your inbox.** There is no board-ready report to email out.
  The one thing you can download is the prayer list from a live event, as a spreadsheet.
- **Church-wide single sign-on and a custom web address for your network are not built yet.** If
  your elders require either, PrayerJar is not ready for you.
- **No nonprofit discount yet.** Say so if it matters and it moves up the list.

---

**What it costs**

Prayer is free for every member, on every plan, permanently. Plans cover the pastoral side.

| | |
|---|---|
| **Free** | 75 members, 3 groups, open prayer wall. No card. |
| **Small Church — $19/mo** | 150 members, 5 groups, pastoral dashboard, private notes, 2 live events. Best for churches under 150 members. |
| **Growing Church — $49/mo** | Unlimited members and groups, prayer-team assignments, custom branding, Planning Center sync, 12 live events. Best for churches 150–500 members. |
| **Network — from $199/mo** | Multi-site churches and denominations. Set up in a conversation, not a checkout. |

Annual billing is 15% off. Cancel from your settings; no fee, no lock-in.

**Start your church free** — prayerjar.org/church/create
**Or talk to Ron first** — hello@prayerjar.org

---

## 3. Claims table

Every factual claim in §1 and §2, and the code that proves it ships. Claims were also checked against
the production database on 2026-07-25.

| # | Claim (as written) | Proof | Tier |
|---|---|---|---|
| 1 | "Each of your small groups gets a prayer space only its own members can open" | `src/app/api/v1/groups/[id]/prayers/route.ts:24-27` (GET) and `:44-47` (POST) — both 403 unless `isGroupMember`; `src/services/group.service.ts:262-273` writes the prayer with `groupId` | Free (3), Small Church (5), Growing Church (unlimited) — `src/lib/plans.ts:38,58,80` |
| 2 | "group prayers never appear on any public page" | `isNull(prayers.groupId)` filters every public read: `src/services/prayer.service.ts:71,176,200,233`; `src/services/homepage.service.ts:79`; `src/app/api/v2/prayers/route.ts:45`; `src/services/collections.service.ts:34`; `src/app/api/v1/categories/counts/route.ts:13` | all |
| 3 | "People submit from their phones… moderator approves each one before it appears… display on a screen" | `src/app/api/v1/events/[eventId]/prayers/route.ts:45` (submit); `src/app/(church)/church/[slug]/events/[eventId]/moderation/page.tsx`; `.../display/page.tsx`; `.../wall/page.tsx` | Small Church and above — `src/app/(church)/church/[slug]/(admin)/events/page.tsx:57` reads `PLANS[tier].limits.events` (`plans.ts:38,58,80,99`) |
| 4 | "download the whole night as a spreadsheet" | `src/app/api/v1/church/[slug]/events/[eventId]/report.csv/route.ts` — admin/pastor gated, CSV of approved + spotlighted event prayers | same as #3 |
| 5 | "New people and new groups sync overnight" | `src/app/api/cron/chms-full-sync-scheduler` + `chms-sync-runner` at 03:00 and 04:00 daily (`vercel.json`); `chms-sync-runner/route.ts:66-74` calls `syncMember` and `syncGroup` and persists both | ungated in code — see §4 item 7 |
| 6 | "Once a week, PrayerJar writes a short prayer summary back onto each person's Planning Center record" | `src/app/api/cron/chms-summary-scheduler` (Sundays 05:00, `vercel.json`); `chms-sync-runner/route.ts:91-94` `push_summary` → `adapter.pushPrayerSummary` | ungated in code |
| 7 | "post to the open PrayerJar wall — by name or anonymously" | `src/app/api/v1/prayers/route.ts:6-10` accepts `isAnonymous`; `src/services/prayer.service.ts:48-56` persists it | all |
| 8 | "Every submission runs through a safety check before it posts" | `src/services/prayer.service.ts:27-44` — `moderateContent` runs before insert and throws `ModerationError`; rejections logged | all |
| 9 | "Requests rest after 30 days" | `src/services/prayer.service.ts:59` and `src/services/group.service.ts:270` — `expiresAt: addDays(new Date(), 30)`; `api/cron/expire-prayers` daily | all |
| 10 | "your church gets its own page with your name, colours, logo, and a welcome message" | `src/app/(public)/church/[slug]/page.tsx`; `src/app/(church)/church/[slug]/(admin)/dashboard/branding/page.tsx`; `src/app/api/v1/church/[slug]/branding` and `/welcome` | Free and above |
| 11 | "an invite link you can put in a bulletin" | `src/app/(public)/church/join/page.tsx` — `?code=<slug>` → `JoinButton` | Free and above |
| 12 | "notes on a person or a request that only your leadership sees" | `src/app/(church)/church/[slug]/(admin)/dashboard/care/page.tsx` (admin/pastor gate at `:34`, tier gate at `:52`); `src/services/pastoral.service.ts:176-198` `createPastoralNote`, `isPrivate` defaults true | Small Church and above — `plans.ts:157` |
| 13 | "prayer-team assignments" (one-pager pricing table only) | `src/app/api/v1/church/[slug]/assignments/route.ts:56`; `.../dashboard/team/page.tsx:45` | Growing Church — `plans.ts:168`. **Caveat in §4 item 9** |
| 14 | "75 members, 3 groups" free; "$19… 150 members, 5 groups"; "$49… unlimited"; "from $199" | `src/lib/plans.ts:38,43,58,63,80,87` | — |
| 15 | "Annual billing is 15% off" | `src/lib/plans.ts:22,44,64` | — |
| 16 | "Cancel from your settings; no fee, no lock-in" | `/for-churches` FAQ, `src/app/(public)/for-churches/page.tsx:130-132` | — |
| 17 | "No nonprofit discount yet" | `/for-churches` FAQ, `page.tsx:134-136`; `src/app/(church)/church/[slug]/(admin)/settings/nonprofit` exists for verification, not discount | — |
| 18 | "There is no import" | `/for-churches` FAQ, `page.tsx:126-128`; no import route exists under `src/app/api` | — |
| 19 | "single sign-on and a custom web address… are not built yet" | no SAML/OIDC-SSO code in `src/`; subdomain routing is behind `process.env.SUBDOMAIN_ROUTING` (`src/proxy.ts:58`), DNS open in `INBOX.md` since 2026-04-20 | — |
| 20 | "No church is running on PrayerJar yet" | prod DB, 2026-07-25: `churches` = 1, and that row is `name: 'Test Church'`, `slug: 'test-church-7l78'`, `description: 'This is a test church. It will eventually be deleted'`, `subscription_id: null`, `first_paid_at: null` | — |
| 21 | "Reporting is on the screen… no board-ready report to email out" | `.../dashboard/analytics/page.tsx` renders charts only; the sole CSV route in `src/` is #4; `src/app/api/v1/export/route.ts` is per-user JSON, not church data | — |

---

## 4. Before you send this — what verification found

Ranked by severity. Items 1–4 are why the asset above is narrower than the brief expected.

**1. `prayers.church_id` is never written by any code path. Sprint-scope escalation.**
The column exists (`src/db/migrations/0018_mature_terrax.sql:26`). Only three inserts into `prayers`
exist — `src/services/prayer.service.ts:48`, `src/services/group.service.ts:263`, and
`src/app/api/debug/seed-prayer/route.ts:27` — and **none sets `churchId`**. `CreatePrayerInput`
(`prayer.service.ts:8-15`) has no such field, and the POST schema (`api/v1/prayers/route.ts:6-10`)
does not accept one. Prod confirms: `select count(*) from prayers where church_id is not null` → **0**.

Everything keyed on that column is therefore dead:

| Surface | Reads | Result |
|---|---|---|
| Private church prayer wall | `church-platform.service.ts:303` | always empty; its empty state links to `/pray`, the *public* form |
| Church analytics (all 5 charts) | `church-analytics.service.ts:25,52,74,90,95` | always zero |
| Pastoral dashboard "active prayers" | `pastoral.service.ts:328-337` | always zero |
| Monday church digest prayer + answered counts | `api/cron/church-digest/route.ts:62-78` | always zero |

The private church wall is the headline feature of the $19 tier (`plans.ts:51`) and the first feature
card on `/for-churches` (`page.tsx:41-44`). This is the same defect class as the PDF-report claim
that justified pj-s26-01 — except it is on the pitch page, and it is a broken feature rather than
only broken copy. **PM decides whether pj-s26-01 widens or a new task opens. Not fixed here:** three
agents are in parallel and this is Backend plus Frontend scope.

**2. Two more church surfaces have no caller.**
- `flagPrayer` (`pastoral.service.ts:114`) is never called from anywhere in `src/`, so
  `dashboard/flagged` can never show anything. There is no member-facing report-to-my-church path.
- `POST /api/v1/church/[slug]/testimony` (creates the approval-queue row) has no caller in any
  component. The admin queue can approve and reject, but nothing can enter it. `/for-churches`
  feature card 5 (`page.tsx:69-72`) describes an end-to-end flow that does not connect.

**3. The pastoral care inbox is not an inbox.**
`/for-churches:55-57` says it "surfaces prayer requests your care team has not yet reached — just a
list of people waiting." The page (`dashboard/care/page.tsx:69-115`) renders `getPastoralNotes` plus
a create-note form. It is a manual notes list. A pastor reading that card and then seeing the product
will feel misled. Copy fix, not a build.

**4. The `/for-churches` trust strip is publishing a test record as a production number.**
`page.tsx:281-311` renders live counts. As of 2026-07-25 they resolve to **1 church / 11 prayers /
1 member** — and the "1 church" is `Test Church`, whose own description says it will be deleted.
The hero jar label at `page.tsx:178` renders `"11 prayers held across 1 churches"` — a broken plural,
on the page every CTA in this asset points near. Any pastor who lands there reads the real n before
Ron gets to frame it. Options: suppress the strip below a threshold, or delete the test church.
Frontend scope; flagging, not touching.

**5. Custom subdomain is stated as delivered on the pitch page and rendered with a checkmark on the
pricing cards.** `for-churches/page.tsx:324-330` — "You get unlimited everything, a custom subdomain
for your network" — present tense. `plans.ts:94` lists `'Custom subdomain'` with no label while
`:95-96` correctly say "coming soon", and `tier-cards-section.tsx:115-120` renders every entry
verbatim with a `Check` icon. Routing is gated on `process.env.SUBDOMAIN_ROUTING` (`proxy.ts:58`)
and DNS has been open in `INBOX.md` since 2026-04-20. Same defect class as pj-s26-01, in a pricing
column.

**6. The "CSV exports" claim on `/for-churches` is wrong twice.** `page.tsx:92-93`: "Growing Church
adds advanced analytics and CSV exports for leadership meetings," tier-labelled "Advanced analytics
+ CSV exports — Growing Church and above." There is no analytics CSV anywhere; the only CSV route in
`src/` is the live-event report, and events are available on Small Church
(`plans.ts:58`, `limits.events: 2`). The Sprint 26 kickoff's "CSV export **is** real" holds only for
event reports.

**7. Planning Center has no tier gate at all.** `settings/integrations/page.tsx` checks role only
(`:52`); neither `api/auth/chms/connect/planning-center/route.ts` nor
`api/cron/chms-full-sync-scheduler/route.ts` reads the plan. `/for-churches:100` sells it at Growing
Church ($49). A Free church can connect it today. Revenue leak, not a false claim — the copy
under-promises. Same shape: the private church wall page (`church/[slug]/wall/page.tsx`) has no tier
gate either, though `plans.ts:52` sells it at Small Church.

**8. Live events are advertised one tier too high.** `/for-churches:86` says Growing Church;
`plans.ts:58` gives Small Church 2 events and the admin page enforces `limits.events !== 0`. The
one-pager above uses `plans.ts`, which its own comment block names as the source of truth. The page
should be corrected to match, not the other way round.

**9. Prayer-team assignments require pasting a raw UUID.** `AssignPrayerForm.tsx:63-69` is a free-text
field with a UUID placeholder, and nothing in the product surfaces a prayer's id to a pastor. The
record is created and displayed correctly, so the feature is not vapor — but it is not a workflow.
It stays in the pricing table above and out of the body copy for that reason.

**10. The embed widget posts to the public wall, not to the church.**
`(public)/embed/[churchSlug]/widget/EmbedForm.tsx:32` calls `/api/v1/prayers` with no church
association. A request submitted through a church's own embedded form lands on the open PrayerJar
wall. Not pitched above; worth a decision before it is pitched anywhere.

**11. `docs/church-review/recommendations.md` Q1 is stale.** It names the Free tier's 50-member cap
as the blocker on small churches. Free is now 75 members and 3 groups (`plans.ts:38`). The brief said
its verdicts still stand; that one does not.

**12. Stale tier name in the product.** `(admin)/events/page.tsx:84,90` says "Starter plan" —
the display name has been "Small Church" since Sprint 17 (`plans.ts:42`). Brand guide §5, minor.

---

## 5. On social proof — what does not exist and what would earn it

There is nothing to quote. Prod holds one church record, and it is a test row Ron created on
2026-04-14; `church_members` = 1; `pastoral_notes`, `prayer_assignments`, `testimony_approvals`,
`event_prayers` and `events` are all 0; there are 0 testimonies. No pastor has used this product.

Do not manufacture the gap shut. No composite pastor, no "churches like yours," no seeded wall in a
screenshot, no invented pilot discount. The Sprint 26 guardrail on fabricated prayers applies to
marketing assets, and a fabricated testimonial is the version of it that would actually get sent.

The shortest honest path to real proof, in order:

1. **Fix the `churchId` write path** (§4 item 1). Until a prayer can belong to a church, no church
   can generate a story worth telling.
2. **Run one live event with one real church.** It is the only church feature that is complete
   end-to-end today, it produces a moment a pastor will describe unprompted, and it yields a
   downloadable artefact. One retreat or one Sunday is enough.
3. **Ask that pastor for two sentences and permission to use their name and church.** Named, or it
   is worth nothing. One real line beats any amount of copy in this file.
4. **Only then** replace the "no church is running on this yet" paragraph. Not before.

Ron's decisions, not the agents':

- Whether to offer the first church anything — free year, founding pricing, a discount. Nothing of
  the sort was invented here.
- Whether "I would set it up with you myself" stays in the email as volume grows.
- Whether the `Test Church` row gets deleted from prod, which would take the trust strip to zero
  churches and stop it rendering (`page.tsx:281` guards on `trust.churches > 0`).

---

## 6. Handoffs this asset needs

Not written to `tasks.json` or `handoffs.md` — PM is handling task state this sprint (three agents
in parallel). Flagged here instead:

| To | What |
|---|---|
| **PM** | §4 item 1 — scope decision: widen pj-s26-01, or open a new task for the `prayers.churchId` write path. Highest priority item in this document. |
| **PM + Copywriter** | §4 items 3, 5, 6, 8 — four copy corrections on `/for-churches`, same defect class as the pj-s26-01 gate. |
| **Frontend** | §4 item 4 — trust strip and the "1 churches" plural at `page.tsx:178`. |
| **Backend** | §4 items 2, 7, 10 — dead `flagPrayer` and testimony-POST callers; ungated PCO and private wall; embed widget routing. |
| **Ron** | §5 decisions, and approval before either piece of copy is sent to anyone. |
