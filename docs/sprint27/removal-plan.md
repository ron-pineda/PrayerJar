# Sprint 27 — Paid Surface Removal Plan

**Task:** `pj-s27-01-paid-surface-audit`
**Author:** Architect
**Date:** 2026-07-25
**Status:** Plan only. No code changed by this task.

> Ron's direction: *"Pull it for now. I just want a free working product and carefully
> plan and implement the paid version in the future using fable."*

Every claim below was verified by reading the code on `feature/prayer-jar` at
commit `6109ec6`. Where I could not verify something, I say so rather than
repeating it.

---

## 0. Corrections to the task brief

Four statements in the brief are wrong or overstated. All four change the plan.

### 0.1 The `events/new` dead link is already fixed — do not schedule it

The brief says `/church/[slug]/events/new` "does not exist while
`(admin)/events/page.tsx:74` links to it." The route still does not exist, but
**the link is gone.** Sprint 26 (`pj-s26-09`) removed both branches. Lines 71–77
of that file are now a comment recording exactly that, and the page renders a
static `Creating events is not available yet` chip plus an amber banner reading
*"Live events are not ready on any plan… please do not upgrade for it."*

Sprint 27 action: none for the link. The banner copy still says "on any plan" and
"do not upgrade," which becomes nonsense once plans are gone — that is a copy
edit, listed in §A.

### 0.2 It is four analytics charts, not five

`getMemberGrowth` (`src/services/church-analytics.service.ts:107`) reads
`churchMembers.churchId`, which **is** written — every church join writes a
`church_members` row. That chart works today.

The four that are permanently empty are exactly the four the brief cited by line
number (`:25`, `:52`, `:74`, `:90`): Prayer Trend, Interaction Trend, Category
Breakdown, Answered Rate. The brief's line list was right; its prose overshot it.

This matters: the analytics page is not uniformly dead, so "hide the page" is
still correct but the reason is 4/5, not 5/5.

### 0.3 Only two of the four free limits are enforced. Groups and admins are decoration

The brief treats `75 members / 3 groups / 0 events / 1 admin` as four dead ends.
Exhaustive grep for `limits.` across `src/` (excluding tests) returns **two**
enforcement sites:

| Limit | Enforced? | Where |
|---|---|---|
| `members: 75` | **Yes** | `src/services/church-platform.service.ts:173` (`addChurchMember`) |
| `events: 0` | **Yes** | `src/services/event.service.ts:30` (`createEvent`) |
| `groups: 3` | **No** | Never read outside marketing copy and `pricing-calculator.tsx` |
| `admins: 1` | **No** | Never read anywhere at all — not even marketing |

`groups: 3` appears only in `/for-churches` FAQ copy (`page.tsx:93`, `:134`) and
the pricing calculator. `admins: 1` has zero readers. Neither can dead-end
anybody because neither exists in a code path.

This shrinks §B from four problems to two.

### 0.4 `/api/v1/checkout` cannot be deleted — it serves live donations

The route (`src/app/api/v1/checkout/route.ts`) is a discriminated union over
three types. `type: 'donation'` is called by `/give` (`give/page.tsx:37`) — a
working, shipped, non-church feature that has nothing to do with the church
tiers. `type: 'subscription'` and `type: 'event_license'` are the paid-tier
paths.

Deleting this route breaks donations. Handling in §A.

### 0.5 Two smaller additions the brief missed

- **`/church/[slug]/dashboard/flagged` has no tier gate either.** The brief flags
  the analytics page for this. The Flagged Prayers page has the same defect —
  role check only, no `getChurchTier` call, despite the sidebar marking it
  `minTier: 'starter'`. Two ungated pages, not one.
- **`/docs/churches:305` still contains a false number.** *"The free plan
  supports up to 25 members"* — `plans.ts` says **75**. This is a third survivor
  of the Sprint 26 honesty pass, in a file that pass edited. It disappears with
  the §A rewrite, but it is worth naming, because it is the same failure mode
  Ron cited as the reason to remove rather than relabel.

### 0.6 What I could **not** verify this pass

**The "zero churches have ever paid" claim is inherited from Sprint 26 and was
not re-verified in this task.** I attempted a read-only `SELECT` against the prod
Neon database; the connection opened but the query execution was blocked by the
tool permission layer. I did not work around it.

The strongest evidence I *can* cite is the Sprint 26 task record
(`.agent-state/tasks.json:6709`), which states prod holds exactly one church row —
name `Test Church`, slug `test-church-7l78`, `subscription_id: null`,
`first_paid_at: null`, `current_plan` set to `pro` **by hand**. A null
`subscription_id` with a null `first_paid_at` is consistent with no money ever
having changed hands, and no Stripe subscription existing.

**Before any deletion PR merges, someone with DB access must run:**

```sql
SELECT id, tier, status, stripe_subscription_id, created_at FROM subscriptions;
SELECT id, name, slug, current_plan, subscription_id, first_paid_at FROM churches;
```

If either returns a real paying record, **stop** — this plan assumes no billing
to unwind and no customer to migrate, and that assumption would be false. On the
evidence available, there is no billing to unwind and no customer to migrate, but
I am flagging this as unconfirmed rather than laundering it as fact.

---

## A. Marketing / pricing / checkout surfaces to remove

Verdict key: **DELETE** (route gone) · **REWRITE** (route stays, paid content
gone) · **REDIRECT** (route gone, 308 to a live page) · **EDIT** (small copy fix).

### A.1 Public routes

| Surface | Verdict | Why |
|---|---|---|
| `/for-churches` (`src/app/(public)/for-churches/page.tsx`, 451 lines) | **REWRITE** | Highest-value church acquisition page. In the sitemap at priority 0.7 and linked from the **global site footer** (`src/app/layout.tsx:123`). Deleting it costs the free product its only church-facing landing page. Strip `<PricingCalculator />` (:343), `<TierCardsSection />` (:356), the `FAQ_ITEMS` entries that quote tiers (:93, :134), and the pricing `<h2>`s. Keep hero, `FEATURES`, trust strip, and the create-church CTA. |
| `/for-churches/demo` | **DELETE** | Enterprise lead-capture for a tier that no longer exists. Page metadata literally sells *"Starting at $199/mo"* (`page.tsx:8`). Not in the sitemap. Its only inbound links are the two CTAs being removed (`tier-cards-section.tsx:70`, `pricing-calculator.tsx:82`). Nothing else reaches it. The `church_enterprise_leads` **table stays** (see §D). |
| `/docs/paid` (477 lines) | **REDIRECT → `/docs/churches`** | In the sitemap at priority 0.4 and linked from four places (`/docs`, `/docs/guide`, `/docs/churches` ×3). The whole page is the tier comparison — there is nothing to keep. A 404 on a sitemap URL produces GSC errors; `/docs/churches` is the correct successor. |
| `/docs/churches` (456 lines) | **REWRITE** | The genuine church documentation page and the redirect target for `/docs/paid`. Remove `PLAN_COLORS` / `PlanBadge` / all `plan:` fields on the section list, the "Which plan do I need?" block (:303–312, which also holds the false "25 members"), the Billing section (:220–241), and the `/docs/paid` cards at :433. |
| `/docs/features` | **EDIT** | Only one paid reference: `:175`, a "(coming soon)" label on the church prayer wall. Drop the `(coming soon)` suffix convention and state plainly that church-scoped prayers are not wired up yet. |
| `/help` | **EDIT** | `:127`, `:135`, `:139` quote tier names via `PASTORAL_DASHBOARD_TIER_NAME` and mention "paid plans" / "Enterprise plans." Rewrite to describe one product. Drop the `plans.ts` import. |
| `/give` | **KEEP UNCHANGED** | Donations. Not a tier. |

### A.2 Authenticated routes

| Surface | Verdict | Why |
|---|---|---|
| `/billing` (`src/app/(dashboard)/billing/page.tsx`) | **REWRITE → "Giving"** | **Do not delete.** This page renders three things: the tier grid (remove), Event Licenses (remove — see §D), and **Donation History** (keep — real, working, tied to `/give`). Rewrite as a giving-history page. |
| `UpgradeButton` (`billing/BillingActions.tsx:74`) | **DELETE export** | Only consumers are `billing/page.tsx:118` and `:203`, both removed. `CancelSubscriptionButton` in the same file goes with it — there is nothing to cancel. |
| `NavItem` upgrade callout (`(admin)/NavItem.tsx:44–79`) | **DELETE branch** | The entire `if (locked)` branch, plus the `locked` and `tierName` props. Once §C lands, nothing is locked. |
| `ChurchSidebar` (`(admin)/ChurchSidebar.tsx`) | **REWRITE** | Drop `minTier` from `NAV_ITEMS`, drop the `PLANS`/`TIER_RANK` import and the `tier` prop, and drop the six lock computations at `:75`. Hidden items in §C come out of the array entirely. |
| Six in-page upgrade CTAs | **DELETE** | `dashboard/page.tsx:71`, `dashboard/care/page.tsx:54`, `dashboard/groups/page.tsx:54`, `dashboard/team/page.tsx:153`, `dashboard/testimony/page.tsx:61` — each a `<Link href="/billing">View plans</Link>` inside a tier-gate block. All five blocks are deleted wholesale by §C. |
| `BrandingForm.tsx:153` | **EDIT** | Links to `/for-churches` to explain the subdomain tier requirement. See §C.6. |

### A.3 Components

| Surface | Verdict | Why |
|---|---|---|
| `src/components/tier-cards-section.tsx` | **DELETE** | Pure pricing UI. Only consumer is `/for-churches:356`. Note for the record: its paid CTAs point at `/church/create`, **not** checkout — so these cards never actually took money. No test file exists for it. |
| `src/components/pricing-calculator.tsx` + `.test.ts` | **DELETE** | Only consumer is `/for-churches:343`. |
| `trackPricingView` (`src/lib/analytics.ts`) | **DELETE** | Only caller is `tier-cards-section.tsx`. Check `src/lib/analytics.server.ts:60` for the matching server-side `church_enterprise_leads` helper — it becomes unreferenced when `/for-churches/demo` goes. |

### A.4 API

| Surface | Verdict | Why |
|---|---|---|
| `/api/v1/checkout` | **REWRITE — narrow the union to `donation`** | Delete the `subscription` (:59–74) and `event_license` (:76–87) branches and their schema members (:14–22). Keep the `donation` branch and the route itself. **The service functions `createSubscriptionCheckout` and `createEventLicenseCheckout` stay in `billing.service.ts` (§D) — only the HTTP entry points go.** This is the one place where "keep the code, remove the surface" needs care: leaving the subscription branch reachable would let anyone POST a Stripe price ID and buy a tier that no longer exists in the UI. |
| `/api/webhooks/stripe` | **KEEP UNCHANGED** | §D. Still needed for donation webhooks regardless. |
| `src/app/actions/billing.actions.ts` | **KEEP, unreferenced** | §D. |

### A.5 Sitemap and redirects

**Sitemap** (`src/app/sitemap.ts`): remove the `/docs/paid` entry (:32). Keep
`/for-churches` (:17) — the page survives as a rewrite.

**Redirect mechanism.** Verified against `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`
for Next **16.2.2** (the installed version):

- `async redirects()` in `next.config.ts` is still the mechanism and is unchanged in 16.x.
- `permanent: true` emits **308**, not 301. Correct for a permanent doc move.
- Redirects are evaluated **before** the filesystem, so the redirect fires even
  if the route file lingers — but delete the route file anyway.
- `next.config.ts` currently has **no** `redirects()` key, and `vercel.json`
  contains **only** `crons` — no competing redirect config exists. Add the key.

```ts
// next.config.ts — add alongside the existing headers()
async redirects() {
  return [
    { source: '/docs/paid', destination: '/docs/churches', permanent: true },
    { source: '/for-churches/demo', destination: '/for-churches', permanent: true },
  ];
}
```

`/for-churches/demo` is not in the sitemap, but a 308 is nearly free and covers
any link shared in outreach email. Do **not** use `src/proxy.ts` for this — that
file is Next 16's renamed middleware and already carries subdomain tenant
resolution, admin gating and attribution stamping. Static redirects belong in
config, and adding them to `proxy.ts` would put them behind the auth wrapper.

`robots.ts` needs no change — it disallows `/api/`, `/admin/`, `/church/` and
nothing being touched here.

---

## B. Plan gates that would dead-end a free user

Per §0.3, there are exactly **two** live enforcement points. Both must change.

### B.1 The member cap — the worst surface in the codebase after removal

**Where:** `src/services/church-platform.service.ts:173`, inside `addChurchMember`.
**Reached by:** `src/app/actions/church-join.actions.ts:30` — the **public**
church-join flow, `/church/join?code=<slug>`.

**What happens today at member 76:** a congregant clicking their church's invite
link gets a thrown `Error('Member limit reached for your plan. Upgrade to add more members.')`.
Not the admin — the *member*. A stranger to the billing relationship is shown an
upsell for a product that, after this sprint, cannot be bought at all.

**Recommendation: remove the cap entirely.** Delete lines 172–181 (the
`getChurchTier` call, the `limit` lookup, the count query and the throw) and set
`PLANS.free.limits.members = null`. Do not raise the number — a raised cap is the
same wall further back, and it will be re-derived from real pricing research when
the paid tier is rebuilt with fable. `null` already means unlimited throughout
`plans.ts` and the guard is written as `if (limit !== null)`, so removing the
block and setting `null` are consistent with each other and belt-and-braces.

Also drop the now-dead `getChurchTier` import if nothing else in the file uses it.

**Cost of being wrong:** unbounded `church_members` rows. At current scale
(one test church) this is not a real risk. Abuse control, if ever needed, belongs
in rate limiting on the join action, not in a pricing table.

### B.2 The events cap — the gate is live and reachable, contrary to appearances

**Where:** `src/services/event.service.ts:30`.
**Reached by:** `POST /api/v1/church/[slug]/events` (`route.ts:54`), which is
auth'd + role-gated to admin/pastor but is a **real, callable endpoint**. There
is no create-event UI, so no button hits it — but the gate is not dead code, and
a free church calling that API today gets
`Error('Live events require a Starter plan or higher.')`.

**Recommendation: neutralise the gate, keep the feature hidden.** Set
`PLANS.free.limits.events = null` and delete the `limit === 0` throw at :32–34.
Keep the `limit !== null` counting branch — with `null` it no-ops, and it is the
right shape for a future cap.

Rationale: the error message names a plan that will not exist, so it cannot
survive as written. Rewriting it to "events are not available yet" would be
honest but would put a second, competing "not ready" message next to the one
`pj-s26-09` already shipped on the events page. Making the gate a no-op is
cleaner: the feature stays unreachable because **no UI creates events**, which is
the true reason, and `pj-s26-10` then has nothing to unpick.

### B.3 Groups and admins — no action

Not enforced anywhere (§0.3). Setting them to `null` in `plans.ts` costs nothing
and stops the numbers being copied into future marketing, so do it for tidiness,
but there is no code path to fix.

### B.4 Resulting free tier

```ts
free: { members: null, groups: null, events: null, admins: 999 }
```

Every church becomes what the old Growing Church tier described, minus the
features that never worked. There is no wall left for a free user to hit.

---

## C. Pro-gated features: what works vs. what does not

I read every gated page rather than trusting the marketing or the sidebar. The
split does **not** follow the tier boundaries.

### The single root cause

Everything in the "broken" column below traces to **one** defect:
`prayers.church_id` and `groups.church_id` are declared in the schema
(`src/db/schema.ts:121`, `:408`) and **never written**. `CreatePrayerInput`
(`prayer.service.ts:8`) has no `churchId` field; neither `prayer.service.ts` nor
`group.service.ts` contains the string `churchId` at all.

I checked one plausible exception: `PlanningCenterAdapter.syncGroup` (`:512`).
It writes `chms_groups`, a **separate** table — not `groups`. The brief is
correct that no path writes `groups.church_id`.

`pj-s26-10` fixes this. Everything below marked ⛔ is empty **until it ships**,
and unlocking any of it would just expose an empty screen to every church.

### C.1 Works today — unlock

| Feature | Route | Evidence |
|---|---|---|
| **Pastoral Care Inbox** ✅ | `dashboard/care` | Reads `pastoralNotes` by `churchId` (`pastoral.service.ts:149`); written by `createPastoralNote` via `POST /api/v1/church/[slug]/notes:51`, which is called by the on-page `CreateNoteForm`. Full round trip. Gate at `care/page.tsx:45` → delete. |
| **Prayer Team Assignments** ⚠️✅ | `dashboard/team` | Reads `prayerAssignments` by `churchId` (`pastoral.service.ts:266`); written by `POST /api/v1/church/[slug]/assignments:56`, called by `AssignPrayerForm`. Works — **but** the form requires an admin to paste a raw prayer UUID by hand (`AssignPrayerForm.tsx:62–72`), because there is no church-scoped prayer list to pick from (same root cause). Unlock it; file the UX as follow-up. |
| **Synced Groups** ✅ | `dashboard/groups` | Advisor predicted this was in the empty bucket. **It is not.** It reads `chmsGroups`/`chmsGroupMembers` (`groups/page.tsx:70–90`), which `PlanningCenterAdapter.syncGroup` genuinely writes. Works whenever a church connects Planning Center. Gate at `:46` → delete. Note it is currently reachable only from `dashboard/page.tsx:163` — not in the sidebar. |
| **Custom branding (logo + colors)** ✅ | `dashboard/branding` | The **page** has no tier gate — role only. Free churches already have logo and color customization today. No change needed beyond §C.6. |
| **Member Growth chart** ✅ | — | `church-analytics.service.ts:107`. Works, but see C.2 — it is the only live chart on a page that is otherwise dead. |
| **Audit log** ✅ | `admin/audit` | Not tier-gated for access; only retention length varies. See §D.3. |

### C.2 Does not work — hide, do not unlock

| Feature | Route | Why it is empty |
|---|---|---|
| **Private church prayer wall** ⛔ | `church/[slug]/wall` | `getChurchPrayers` (`church-platform.service.ts:297`) filters `prayers.churchId`. Always zero rows. **Correction to the brief:** this page has **no tier gate at all** — it is member-gated only. It was *sold* as the $19 headline; it was never *gated* as one. Nothing to ungate; the fix is removing the marketing claim (§A) and leaving the empty state. |
| **Church groups page** ⛔ | `church/[slug]/groups` | `getChurchGroups` (`:309`) filters `groups.churchId`. Same story, same lack of a gate. |
| **Church Analytics** ⛔ | `dashboard/analytics` | 4 of 5 charts dead (§0.2). **Has no tier gate** (`analytics/page.tsx:32–34`, role only) — so free churches can already reach it and see four zeroed charts. **Recommendation: hide the route from the sidebar and return `notFound()` until `pj-s26-10`.** Do not add a tier gate; do not unlock. |
| **Flagged Prayers** ⛔ | `dashboard/flagged` | `getFlaggedPrayers` reads `prayerFlags`, written **only** by `flagPrayer` (`pastoral.service.ts:114`), whose only callers are its own tests. Queue can never fill. Also **ungated** (§0.5). Hide the route. |
| **Testimony Approval Queue** ⛔ | `dashboard/testimony` | Reads `testimonyApprovals`; the write path `POST /api/v1/church/[slug]/testimony:61` exists but **no client anywhere calls it** (grep across `src/` returns zero callers). Structurally identical to `flagPrayer`. Hide the route; the gate at `:52` goes with it. |
| **Live events** ⛔ | `church/[slug]/events/*` | Wall, moderation, display and report screens are all built; nothing can create an event. Already honestly labelled by `pj-s26-09`. Leave as-is; §A.1 fixes the plan-referencing copy. |
| **Pastoral Dashboard** ⚠️ | `dashboard` | **Mixed — the one entry that does not resolve cleanly.** `getPastoralStats` (`pastoral.service.ts:321`) returns four numbers: `activePrayers` (⛔ `prayers.churchId`), `pendingFlags` (⛔ never written), `openAssignments` (✅), `memberCount` (✅). **Recommendation: unlock the page, remove the two dead stat tiles.** It is the hub linking to Care Inbox and Synced Groups, both of which work — hiding it would orphan them. Restore the two tiles in `pj-s26-10`. |

### C.3 Summary of route dispositions

- **Unlock (delete gate):** `dashboard`, `dashboard/care`, `dashboard/team`, `dashboard/groups`
- **Hide (`notFound()` + remove from sidebar):** `dashboard/analytics`, `dashboard/flagged`, `dashboard/testimony`
- **No gate to change:** `church/[slug]/wall`, `church/[slug]/groups`, `dashboard/branding`, `church/[slug]/events`

### C.4 The `plans.ts` predicates

`hasPastoralDashboard`, `hasPastoralCareInbox`, `hasPrayerTeamAssignments`,
`hasTestimonyApprovalQueue` and their `*_TIER` / `*_TIER_NAME` constants lose all
callers. **Recommendation: keep the functions, delete nothing.** They are the
tier map for the rebuild, they are covered by `plans.test.ts`, and §D already
accepts unreferenced exports in this file. Note in `decisions.md` that they are
intentionally dormant.

### C.5 `hasCustomSubdomain` — the one gate to leave enforcing

`hasCustomSubdomain` gates `POST /api/v1/church/[slug]/branding:89` and the
`canClaimSubdomain` prop at `branding/page.tsx:68`.

**Recommendation: leave this gate in place, and change the copy only.**

Unlike every other gate, this one guards a **scarce global namespace**. Handing
out `*.prayerjar.org` subdomains to every free church, in a sprint whose whole
purpose is to defer pricing decisions, gives away the asset a future paid tier
would most plausibly charge for — irreversibly, since you cannot reclaim a
subdomain someone has published.

It is also not currently costing anyone anything: `src/proxy.ts:112` shows
subdomain routing is behind a `SUBDOMAIN_ROUTING === 'true'` env flag that
requires wildcard DNS and a wildcard cert. Until that flag is on, a claimed
subdomain resolves nowhere. So a free church loses nothing today by not being
able to claim one.

`BrandingForm.tsx:153` explains the restriction by linking to `/for-churches`.
Rewrite to something like *"Custom subdomains aren't available yet — contact us
if you need one."* No plan name, no link to pricing.

### C.6 Hazard: two competing sources of tier truth

Worth recording before the rebuild. Two functions answer "what tier is this
church?" and they disagree:

- `getChurchTier()` (`church-platform.service.ts:27`) reads the **`subscriptions`** table via `churches.subscription_id`, defaulting to `free`.
- `hasCustomSubdomain(church.currentPlan)` and `api/cron/audit-cleanup:22` read the **`churches.current_plan`** column directly.

The prod test church has `subscription_id: null` **and** `current_plan: 'pro'`
(hand-set). So today `getChurchTier()` says `free` while `current_plan` says
`pro` — the audit page (`audit/page.tsx:63`, via `getChurchTier`) would show 90
days retention while the cleanup cron (via `current_plan`) retains 365. Live,
observable drift. **Pick one source when the paid tier is rebuilt.** Add to
`decisions.md`.

---

## D. What must NOT be deleted

Ron's instruction is that the paid machinery stays in the repo, unreferenced, for
a deliberate rebuild with fable. Concretely:

### D.1 Keep, fully intact

| Path | Note |
|---|---|
| `src/services/billing.service.ts` + `.test.ts` | All three checkout builders, including the two whose HTTP entry points §A.4 removes. |
| `src/app/api/webhooks/stripe/route.ts` | Still live for donation webhooks. Its `getPlanByStripePriceId` import keeps that `plans.ts` export referenced. |
| `src/app/actions/billing.actions.ts` | Becomes unreferenced once `BillingActions.tsx` loses its buttons. Keep. |
| `src/lib/plans.ts` + `plans.test.ts` | See D.3 — this file does **not** become unreferenced. |
| `src/lib/finance/mrr.ts` + `.test.ts` and `/admin/finance` | Imports `PLANS`. Admin-only, not user-reachable, harmless. |
| DB schema: `subscriptions`, `donations`, `event_licenses`, `church_enterprise_leads`, `churches.current_plan` / `previous_plan` / `first_paid_at` / `subscription_id`, `plan_tier` enum | **No migration in this sprint.** Dropping columns is irreversible and there is nothing to gain. |
| Stripe env vars (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`) | Leave in Vercel. `plans.ts:46` etc. read them; absent, they resolve `null` harmlessly. |

### D.2 `event_licenses` — keep the table, remove the UI

The Event Licenses section on `/billing` (`:200–250`) is a paid surface and comes
out with the rewrite. The table and `createEventLicenseCheckout` stay.

### D.3 "plans.ts stays unreferenced" is not achievable — and should not be

The brief implies `plans.ts` becomes dead code. It does not. After every change
above it retains **three live, non-marketing consumers**:

1. `auditRetentionDays` → `admin/audit/page.tsx:64` and `api/cron/audit-cleanup:22`
2. `getPlanByStripePriceId` → `api/webhooks/stripe/route.ts:6`
3. `PLANS` → `lib/finance/mrr.ts:13`

The correct framing: **user-facing tier gating disappears; `plans.ts` survives as
a live module.**

**Recommendation on audit retention:** leave `auditRetentionDays` exactly as
written. Every church now resolves to `free` through `getChurchTier`, so the
function returns a constant 90 days in practice — collapsing it to a literal
gains nothing and loses the tier map. But **fix the source-of-truth split in
C.6 first**, because the cron reads `current_plan` and would retain 365 days for
the hand-set test church while the UI claims 90.

### D.4 Implications of keeping dead code

- **ESLint:** `eslint.config.mjs` should be checked for `no-unused-vars` on exports; TS `noUnusedLocals` does not flag unused *exports*, so this is likely a non-issue. Confirm before the PR, do not pre-emptively add suppressions.
- **Bundling:** `billing.service.ts` and `billing.actions.ts` become unreachable from any route, so they are tree-shaken out of the client bundle. Server code is not shipped to clients. No size cost.
- **Tests:** `billing.service.test.ts`, `plans.test.ts` and `mrr.test.ts` keep passing — they test modules, not routes. **`pricing-calculator.test.ts` must be deleted with its component.** `e2e/` contains **no** billing/pricing/tier specs (verified by grep), so no E2E breakage. `church-platform.service.test.ts` and `__tests__/event.service.test.ts` assert the limit throws being removed in §B and **will fail** — update them in the same PR.
- **Dead-code detection:** if a `knip`/`ts-prune` pass is ever added, `billing.service.ts` and `billing.actions.ts` must be allowlisted. Not present today.

---

## E. Suggested task breakdown

Sequenced so nothing lands half-removed. Tasks are proposals for PM approval, not
created in `tasks.json` by this task.

| # | Task | Agent | Depends on |
|---|---|---|---|
| 1 | **Verify prod billing state** (§0.6) — run both queries, record output. Hard gate on everything else. | Database | — |
| 2 | Neutralise both plan limits; update the two failing service tests (§B) | Backend | 1 |
| 3 | Unlock 4 routes / hide 3 routes; strip `ChurchSidebar` + `NavItem` lock logic (§C) | Frontend | 1 |
| 4 | Rewrite `/billing` → giving history; narrow `/api/v1/checkout` to `donation` (§A.2, §A.4) | Backend | 1 |
| 5 | Rewrite `/for-churches`; delete `/for-churches/demo`, `tier-cards-section`, `pricing-calculator` (§A.1, §A.3) | Frontend | 1 |
| 6 | Rewrite `/docs/churches`, delete `/docs/paid`, edit `/docs/features` + `/help` (§A.1) | DocWriter | 5 |
| 7 | `next.config.ts` redirects + sitemap removal (§A.5) | Frontend | 6 |
| 8 | Record ADRs: dormant tier predicates, tier-truth split, subdomain gate retained (§C.4, §C.5, §C.6) | Architect | 2–7 |
| 9 | Full-site sweep for surviving price/tier strings before sign-off | QA | 2–8 |

Task 9 is not optional. Sprint 26 shipped two honesty passes and a Reviewer still
found two false claims afterward, one in a file the pass had just edited. The
sweep should grep for `$19`, `$49`, `$199`, `/mo`, `Upgrade`, `upgrade`,
`Starter`, `Growing Church`, `Small Church`, `Network`, `plan`, `tier`,
`coming soon` across `src/` and read every hit — not just count them.

---

## F. Out of scope, found while auditing

Not part of this task; logged so they are not lost.

1. **`/billing` hides donation history from ordinary donors.** `page.tsx:43`
   redirects anyone who is not a church admin/pastor to `/profile`. A regular
   user who donated via `/give` has **no way to see their own donation history.**
   The §A.2 rewrite is the natural moment to drop that role check.
2. **The weekly church digest email contains a broken link.**
   `api/cron/church-digest/route.ts:157` builds
   `${BASE_URL}/church/${churchId}/dashboard` using the church **UUID**, where
   every route in the app expects the **slug**. That link 404s. Unrelated to
   pricing; worth a Sprint 27 bug task.
3. **`groups_chms_idx`** (`schema.ts:412–414`) is a unique index on
   `groups.church_id` — a column nothing writes. Vestigial. Revisit with `pj-s26-10`.
