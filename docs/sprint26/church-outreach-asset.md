# Church outreach asset — the thing Ron hands a pastor

**Task:** pj-s26-06 · **Sprint:** 26 · **Date:** 2026-07-25
**Author:** Growth + Content
**Status:** DRAFT — awaiting human approval before any of this is sent

---

## Read this before anything else

The brief asked for the asset Ron hands a pastor to sell a church plan. Verification against the
codebase and the production database says he cannot honestly send one yet.

**The church-scoped data model is never populated by application code.** `prayers.church_id` and
`groups.church_id` exist as columns and are written by nothing. There is no UI anywhere that creates
a live prayer event. `flagPrayer` and the testimony-approval POST have no callers. The consequence
is that a church account can hold members, branding, and private notes — and nothing else. No prayer,
group, event, flag, or testimony can be associated with a church today. Full evidence in §4.

So this document contains **two** things:

1. **§1–§3 — an asset Ron can send today**, built only from what was verified working end to end.
   It invites a congregation onto the free product. It does not sell a plan, because the paid
   features are not reachable.
2. **§4 — the reason the paid pitch is on hold**, with file paths and prod counts, escalated to PM.

The second is the more valuable half. Sending the paid pitch as the brief imagined it would put Ron
in front of a pastor promising a private church wall, a care inbox, a live event wall, and analytics
that a demo would immediately expose as empty.

---

## 1. The email

**Send to:** a named pastor or care-team lead Ron has actually met, at a church of roughly 60–300.
Not a list. One to one.
**The ask:** get a congregation praying on PrayerJar together, free. Not a sale.
**Success metric:** replies, then members joined on a church page. Ten sends with one church page
created and five members joined is a working message at this stage. Zero replies from ten sends means
the message is wrong, not that the market is wrong.

**Subject:** Something small for your church to pray with

---

Pastor [Name],

Most of what people carry never makes it to you. It surfaces in a text at 11pm, or it does not
surface at all.

I built PrayerJar for that. Anyone can post what they are carrying — by name or anonymously — and
real people pray for it. Not likes, not a feed. I have set it up so a church can have its own page
with your name and colours and one invite link you can put in a bulletin, so your people are praying
alongside each other rather than scattered.

It is free. Prayer on PrayerJar is free permanently, for every member, and always will be. I am not
selling you anything.

I will be straight with you: no church is using it yet, and the pastoral side is still being built.
What works today is the praying. If your people used it for a month and told me what was missing,
that would shape what I build next more than anything else could.

Can I send you the invite link?

Ron Pineda
prayerjar.org

---

**Notes on the email**

- 176 words. One ask, and the ask is small on purpose. At zero churches the goal is usage, not
  revenue.
- "the pastoral side is still being built" is doing real work. It is true, it pre-empts the demo
  problem in §4, and it turns the gap into an invitation.
- Do not attach the one-pager to a first send. It goes after a reply.
- No testimonial, no church name, no usage figure. There are none. See §5.

---

## 2. The one-page leave-behind

---

### A quiet place for your church to pray

PrayerJar is a prayer wall, not a feed. Someone posts what they are carrying. Real people pray for
it. Nothing is ranked and nobody is counting likes.

Be straight with your congregation about this: prayers posted here go on the **public** wall, and
a shared prayer link is a public page that search engines can index. Anyone can post anonymously,
and most do. There is no church-only wall today — that is still in development.

Your church gets its own page and one invite link. Prayer is free for every member, permanently.

---

**What most churches are using right now**

| | What it costs you |
|---|---|
| **A group chat** | Everyone sees everything, so nobody asks for the hard thing. Monday's request is buried under Wednesday's photos. |
| **A card box or connect card** | Somebody has to read them, type them up, and remember them. Nobody can tell you which were prayed for. |
| **A spreadsheet** | Right on Monday, stale by Wednesday. One person opens it, and that person is you. |

---

**What is here today**

**Anyone can ask, including the people who would never raise a hand.** A member posts a request under
their own name or anonymously. Every submission runs a safety check before it posts. Requests rest
after 30 days rather than accumulating forever.

**People actually pray, and the person knows it.** Members pray for a specific request and the count
is on it. When something is answered, the person who asked can write what happened.

**A page for your church, with your name on it.** Your church page carries your name, description,
logo, colours, and a welcome message you write. One invite link goes in a bulletin or a group text
and people join from it.

**A roster you are not hand-keeping.** Members who join are on your church's list. If you use
Planning Center, PrayerJar can connect to it and pull your people and groups in overnight, so the
list matches your church records without anyone re-typing it.

**Private notes for the people who shepherd.** Your pastors and admins can keep notes on a person
that only your leadership sees. Members never see them. *Included from the $19 plan.*

---

> *"Bear one another's burdens, and so fulfill the law of Christ."* — Galatians 6:2

---

**Where we are early, plainly**

- **No church is using PrayerJar yet.** You would be the first. That means direct attention from the
  person who built it, and it means you would be finding the rough edges.
- **Nothing here has been run by a real church.** The church page, the roster, and the Planning
  Center sync are built and tested in code, but no congregation has completed any of it end to end.
  Expect to hit something I have not seen.
- **The pastoral side is not finished.** A church-only prayer wall, a care queue, and reporting for
  your leadership are the next things being built. They are not ready, and I would rather say so than
  demonstrate them to you.
- **Prayers your members post are on the open PrayerJar wall**, prayed for by people beyond your
  church. That is the product today. If you need a wall only your congregation can see, it is not
  ready yet.
- **There is no import.** Prayer history from another tool has to be re-entered by hand.
- **No single sign-on, no custom web address, no nonprofit discount yet.** If your elders require any
  of those, PrayerJar is not ready for you.

---

**What it costs**

Nothing to start, and prayer is free for every member on every plan, permanently. A free church
account holds 75 people. Paid plans cover pastoral features, most of which are still being built — so
the honest recommendation today is to stay on the free plan and tell me what you need.

**Start your church free** — prayerjar.org/church/create
**Or reply to Ron first** — hello@prayerjar.org

---

## 3. Claims table

Every factual claim in §1 and §2, and the code that proves it ships. Also checked against the
production database on 2026-07-25.

| # | Claim (as written) | Proof | Tier |
|---|---|---|---|
| 1 | "A member posts a request under their own name or anonymously" | `src/app/api/v1/prayers/route.ts:6-10` accepts `isAnonymous`; `src/services/prayer.service.ts:48-56` persists it | all |
| 2 | "Every submission runs a safety check before it posts" | `src/services/prayer.service.ts:27-44` — `moderateContent` runs before insert, throws `ModerationError`; rejections logged via `logModerationRejection` | all |
| 3 | "Requests rest after 30 days" | `src/services/prayer.service.ts:59` — `expiresAt: addDays(new Date(), 30)`; `src/app/api/cron/expire-prayers` runs daily (`vercel.json`) | all |
| 4 | "Members pray for a specific request and the count is on it" | `src/app/api/v1/prayers/[id]/pray/route.ts`; `prayer_interactions` table | all |
| 5 | "the person who asked can write what happened" | `src/app/api/v1/prayers/[id]/testimony/route.ts`; public testimony pages at `src/app/(public)/testimony/[id]` | all |
| 6 | "not a feed… nothing is ranked" | `src/services/prayer.service.ts:66-95` `getRandomPrayer` orders by `RANDOM()`; no ranking or engagement signal in any public read | all |
| 7 | "Your church page carries your name, description, logo, colours, and a welcome message" | `src/app/(public)/church/[slug]/page.tsx`; `src/app/(church)/church/[slug]/(admin)/dashboard/branding/page.tsx`; `src/app/api/v1/church/[slug]/branding` and `/welcome`. Prod: the existing church row has `primary_color` and `welcome_message` populated | Free and above |
| 8 | "One invite link… and people join from it" | `src/app/(public)/church/join/page.tsx` — `?code=<slug>` resolves the church, `JoinButton` joins | Free and above |
| 9 | "Members who join are on your church's list" | `src/services/church-platform.service.ts` `getChurchMembers`; `church_members` table | Free and above |
| 10 | "A free church account holds 75 people" | `src/lib/plans.ts:38` (`members: 75`); enforced at `src/services/church-platform.service.ts:173` | Free |
| 11 | "PrayerJar can connect to [Planning Center] and pull your people and groups in overnight" | `src/app/api/auth/chms/connect/planning-center` (OAuth); `src/app/api/cron/chms-full-sync-scheduler` 03:00 and `chms-sync-runner` 04:00 daily (`vercel.json`); `chms-sync-runner/route.ts:66-74` calls and persists `syncMember` and `syncGroup`. **Never exercised — see §4 item 6** | ungated in code; `/for-churches:100` advertises it at $49 |
| 12 | "notes on a person that only your leadership sees" | `src/app/(church)/church/[slug]/(admin)/dashboard/care/page.tsx` — admin/pastor gate at `:34`, tier gate at `:52`; `src/services/pastoral.service.ts:176-198` `createPastoralNote`, `isPrivate` defaults true | Small Church ($19) and above — `plans.ts:157` |
| 13 | "prayer is free for every member on every plan" | `src/lib/plans.ts:24-101` — no plan gates prayer submission or intercession; `/for-churches` FAQ `page.tsx:106-108` | all |
| 14 | "Prayers your members post are on the open PrayerJar wall" | `src/services/prayer.service.ts:48-61` sets no church or group association; the embed widget posts there too (`(public)/embed/[churchSlug]/widget/EmbedForm.tsx:32`) | all |
| 15 | "If you need a wall only your congregation can see, it is not ready" | §4 item 1 — `prayers.church_id` is never written; prod count 0 | — |
| 16 | "There is no import" | `/for-churches` FAQ `page.tsx:126-128`; no import route under `src/app/api` | — |
| 17 | "No single sign-on, no custom web address, no nonprofit discount yet" | no SAML/OIDC-SSO code in `src/`; subdomain routing gated on `process.env.SUBDOMAIN_ROUTING` (`src/proxy.ts:58`) with DNS open in `INBOX.md` since 2026-04-20; nonprofit FAQ `page.tsx:134-136` | — |
| 18 | "No church is using PrayerJar yet" | prod DB 2026-07-25: `churches` = 1, and that row is `name: 'Test Church'`, `slug: 'test-church-7l78'`, `description: 'This is a test church. It will eventually be deleted'`, `subscription_id: null`, `first_paid_at: null`; `church_members` = 1 | — |
| 19 | "Nothing here has been run by a real church" | prod DB 2026-07-25: `events` = 0, `event_prayers` = 0, `pastoral_notes` = 0, `prayer_assignments` = 0, `testimony_approvals` = 0, `chms_provider` = null on the only church row | — |

**Deliberately absent from the copy**, because verification could not back them: private church prayer
wall, pastoral care inbox, live event prayer wall and its CSV, church analytics, weekly digest
numbers, testimony approval queue, flagged-content queue, prayer-team assignments, church prayer
circles, PDF reports, SSO, custom subdomain.

---

## 4. Why the paid pitch is on hold — verification findings

Ranked by severity. Items 1–4 are why §1 and §2 are far narrower than the brief anticipated.

### 1. The church-scoping columns are never written. Sprint-scope escalation.

`prayers.church_id` exists (`src/db/migrations/0018_mature_terrax.sql:26`). Only three inserts into
`prayers` exist in the codebase — `src/services/prayer.service.ts:48`,
`src/services/group.service.ts:263`, `src/app/api/debug/seed-prayer/route.ts:27` — and **none sets
`churchId`**. `CreatePrayerInput` (`prayer.service.ts:8-15`) has no such field; the POST schema
(`api/v1/prayers/route.ts:6-10`) does not accept one.

`groups.church_id` is the same story. `createGroup` (`src/services/group.service.ts:46-56`) sets
`name`, `description`, `createdBy`, `inviteCode` — never `churchId`.

Prod confirms both:

```
select count(*) from prayers where church_id is not null   ->  0   (of 11)
select count(*) from groups  where church_id is not null   ->  0   (of 2)
```

Everything keyed on those columns is dead:

| Surface | Reads | Result |
|---|---|---|
| Private church prayer wall | `church-platform.service.ts:303` | always empty; its empty state links to `/pray`, the *public* form |
| Church prayer circles | `church-platform.service.ts:309-316` | always empty |
| Church analytics — all five charts | `church-analytics.service.ts:25,52,74,90,95` | always zero |
| Pastoral dashboard "active prayers" | `pastoral.service.ts:328-337` | always zero |
| Monday church digest, prayer + answered counts | `api/cron/church-digest/route.ts:62-78` | always zero |

The private church wall is the headline feature of the $19 tier (`plans.ts:51`) and the first feature
card on `/for-churches` (`page.tsx:41-44`). Church prayer circles are feature card 6
(`page.tsx:76-79`). This is the same defect class as the PDF-report claim that justified pj-s26-01 —
except it is on the pitch page, and these are broken features rather than only broken copy.

**PM decision required: widen pj-s26-01, or open a new task.** Not fixed here — three agents are in
parallel and this is Backend plus Frontend scope.

### 2. A pastor cannot create a live prayer event. There is no creation route.

`src/app/(church)/church/[slug]/(admin)/events/page.tsx:74` links "Create Event" to
`/church/${slug}/events/new`. **That route does not exist.** The `(admin)/events/` directory contains
exactly `page.tsx` and `setup/page.tsx`. The button 404s.

`setup/page.tsx` is a static how-to guide, not a form — and its step 1 instructs the pastor to "Go to
your events page and click 'Create Event'", the button that 404s. Nothing in `src/` links to
`events/setup`, so a pastor would not find that page either.

`POST /api/v1/church/[slug]/events` exists and works (`createEvent`, `event.service.ts:20`, with the
tier limit enforced at `:30`), but **no client code calls it**. The only fetch to a church-events
endpoint anywhere in `src/` is the display-mode toggle on an already-existing event
(`events/[eventId]/display/page.tsx:219`).

So the whole live-event chain — submit, moderate, display, CSV report — is reachable only by an event
that cannot be created. Prod: `events` = 0, `event_prayers` = 0. `/for-churches:82-86` sells it.

### 3. Two more church surfaces have no caller.

- `flagPrayer` (`pastoral.service.ts:114-126`) is called from nowhere in `src/`, so
  `dashboard/flagged` can never show anything. There is no member-facing report-to-my-church path.
- `POST /api/v1/church/[slug]/testimony`, which creates the approval-queue row, has no caller in any
  component. The admin queue can approve and reject; nothing can enter it. `/for-churches:68-72`
  describes an end-to-end flow that does not connect.

### 4. The pastoral care inbox is not an inbox.

`/for-churches:55-57` says it "surfaces prayer requests your care team has not yet reached — no
ranking, no algorithmic sorting, just a list of people waiting." The page
(`dashboard/care/page.tsx:69-115`) renders `getPastoralNotes` plus a create-note form. It is a manual
notes list, and it is the one pastoral feature that genuinely works — which is why §2 describes it
accurately as private notes rather than as an inbox. Copy fix, not a build.

### 5. `/for-churches` is publishing a test record as a production number.

`page.tsx:281-311` renders live counts. As of 2026-07-25 they resolve to **1 church / 11 prayers /
1 member** — and the "1 church" is `Test Church`, whose own description says it will be deleted. The
hero jar label at `page.tsx:178` renders `"11 prayers held across 1 churches"`: a broken plural, on
the page every CTA points near. Options: suppress the strip below a threshold, or delete the test
church — the strip is already guarded on `trust.churches > 0` (`page.tsx:281`), so deleting the row
hides it. Frontend scope; flagging, not touching.

### 6. Planning Center has never been exercised, and is ungated.

The code is complete and the crons are scheduled, but `chms_provider` is null on the only church row,
so no sync has ever run against a real Planning Center account. Separately, there is no tier gate
anywhere: `settings/integrations/page.tsx` checks role only (`:52`), and neither
`api/auth/chms/connect/planning-center/route.ts` nor `api/cron/chms-full-sync-scheduler/route.ts`
reads the plan. `/for-churches:100` sells it at $49; a free church can connect it today.

§2 claims it with "PrayerJar can connect to it" rather than a flat assertion, and the early-days
section says plainly that nothing has been run by a real church. If Ron would rather not risk it on a
first call, cut the sentence — nothing else depends on it.

### 7. The "CSV exports" claim on `/for-churches` is wrong twice.

`page.tsx:92-93`: "Growing Church adds advanced analytics and CSV exports for leadership meetings,"
tier-labelled "Advanced analytics + CSV exports — Growing Church and above." There is no analytics
CSV anywhere; the only CSV route in `src/` is the live-event report (unreachable, per item 2), and
events are available from Small Church (`plans.ts:58`, `limits.events: 2`). The Sprint 26 kickoff's
"CSV export **is** real" holds only for event reports, which no one can produce.

### 8. Custom subdomain is stated as delivered, and rendered with a checkmark on the pricing cards.

`for-churches/page.tsx:324-330` — "You get unlimited everything, a custom subdomain for your network"
— present tense. `plans.ts:94` lists `'Custom subdomain'` with no label while `:95-96` correctly say
"coming soon", and `tier-cards-section.tsx:114-121` renders every entry verbatim with a `Check` icon.
Routing is gated on `process.env.SUBDOMAIN_ROUTING` (`proxy.ts:58`) and DNS has been open in
`INBOX.md` since 2026-04-20. Same defect class as pj-s26-01, in a pricing column.

### 9. Plan limits: two of four are enforced.

| Limit | Enforced? |
|---|---|
| `limits.members` | Yes — `church-platform.service.ts:173` |
| `limits.events` | Yes — `event.service.ts:30` (moot per item 2) |
| `limits.groups` | **No** — referenced only in marketing copy (`for-churches:79,111`) |
| `limits.admins` | **No** — no reader in `src/` |

Moot today because churches have no groups, but it becomes a revenue leak the moment item 1 is fixed.

### 10. Smaller items.

- **Assignments.** `AssignPrayerForm.tsx:63-69` is a free-text field expecting a raw prayer UUID, and
  nothing in the product surfaces a prayer's id to a pastor. Compounded by item 1: the prayer it
  points at could not belong to the church anyway. Not claimed in §2.
- **The embed widget posts to the public wall.** `(public)/embed/[churchSlug]/widget/EmbedForm.tsx:32`
  calls `/api/v1/prayers` with no church association. A request submitted through a church's own
  embedded form lands on the open wall. Stated honestly in §2 rather than hidden.
- **`docs/church-review/recommendations.md` Q1 is stale.** It names the Free tier's 50-member cap as
  the blocker on small churches. Free is now 75 members and 3 groups (`plans.ts:38`). The brief said
  its verdicts still stand; that one does not.
- **Stale tier name.** `(admin)/events/page.tsx:84,90` says "Starter plan"; the display name has been
  "Small Church" since Sprint 17 (`plans.ts:42`). Brand guide §5, minor.
- **`.env.local` points at the production Neon pooler.** That is how the counts above were obtained
  (read-only `select count(*)`). Worth a decision independently of this task.

---

## 5. On social proof — what does not exist, and what would earn it

There is nothing to quote. Prod holds one church record and it is a test row Ron created on
2026-04-14. `church_members` = 1. `pastoral_notes`, `prayer_assignments`, `testimony_approvals`,
`event_prayers`, and `events` are all 0. There are 0 testimonies. No pastor has used this product.

Do not manufacture the gap shut. No composite pastor, no "churches like yours," no seeded wall in a
screenshot, no invented founding-church discount. The Sprint 26 guardrail on fabricated prayers
applies to marketing assets, and a fabricated testimonial is the version of it that would actually
get sent.

The shortest honest path to real proof, in order:

1. **Fix the church-scoping write path** (§4 item 1) and **ship an event-creation route**
   (§4 item 2). Until a prayer can belong to a church and an event can exist, there is no church
   story to tell and no paid tier to sell.
2. **Send the §1 email now anyway.** It does not depend on either fix. Getting one congregation onto
   the free product produces the first real prayers, the first real roster, and the first honest
   answer about what a pastor actually wants — which is worth more than another sprint of guessing.
3. **When the pastoral side lands, go back to that same church first.** A church already praying on
   the free product is the cheapest possible first paid customer.
4. **Then ask for two sentences and permission to use their name and church.** Named, or it is worth
   nothing. One real line beats every word in this file.

Ron's decisions, not the agents':

- Whether to send §1 at all, or hold outreach until §4 items 1 and 2 are fixed. Both are defensible.
  Sending now buys real feedback; holding avoids a pastor's first impression being a thin product.
- Whether to keep the Planning Center sentence in the leave-behind before it has ever run (§4 item 6).
- Whether the `Test Church` row gets deleted from prod, which would take `/for-churches` to zero
  churches and stop the trust strip rendering.
- Whether to offer the first church anything. Nothing of the sort was invented here.

---

## 6. Handoffs this asset needs

Not written to `.agent-state/tasks.json` or `handoffs.md` — PM is handling task state this sprint
because three agents are running in parallel. Both role specs (Growth, Content) require a
`handoffs.md` entry; deviating on PM's explicit instruction. Flagged here instead:

| To | What |
|---|---|
| **PM** | §4 items 1 and 2 — scope decision. The church product does not function; `/for-churches` sells six features that no user can reach. Highest priority in this document. |
| **PM + Copywriter** | §4 items 4, 7, 8 — copy corrections on `/for-churches`, same defect class as the pj-s26-01 gate. |
| **Frontend** | §4 items 2 and 5 — missing `events/new` route; trust strip and the "1 churches" plural at `page.tsx:178`. |
| **Backend** | §4 items 1, 3, 6, 9 — church-scoping write paths; dead `flagPrayer` and testimony POST; ungated PCO; unenforced group and admin limits. |
| **Ron** | §5 decisions, and approval before either piece of copy is sent to anyone. |

**Verification note:** no code was changed by this task, so `tsc`, `vitest`, and `next build` were not
run — per the brief, the claims table in §3 is the verification. Sprint gates are unaffected.
