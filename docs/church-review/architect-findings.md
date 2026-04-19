# Architect Findings — /for-churches claims vs implementation

**Date:** 2026-04-19
**Author:** Architect agent
**Task:** `pj-s21r-02` — Sprint 21-review
**Scope:** Every feature claim on `src/app/(public)/for-churches/page.tsx` and every bullet in `src/lib/plans.ts`, traced to code.

---

## Top-line verdict

**YES — WITH CONDITIONS.** `/for-churches` materially overstates capability on three Pro-tier claims (PDF reports, PCO group sync, weekly-summary-to-PCO) and on one billing-UX FAQ claim (monthly↔annual switch). The core pastoral stack (dashboard, care inbox, assignments, testimony queue, private wall, groups, events, analytics, branding, welcome message, member-cap enforcement) is real and works. Sprint 17 hotfixes (AI-Flagged Care kill, SSO/SAML/subdomain coming-soon, pastoral-dashboard tier gate) still hold on the marketing surface. **New drift was introduced by Sprint 18 (PCO)** — the card over-promises versus what ships — and the hero regained a phrase Sprint 17 had removed.

---

## Claims matrix

| # | Feature claim | Tier | Claim location | Implementation file(s) | State | Severity |
|---|---|---|---|---|---|---|
| 1 | Two walls — public + private | Free / Starter+ | page.tsx:42–45 | `(public)/browse`, `(church)/.../dashboard`, `church-platform.service` | **built** | — |
| 2 | Pastoral dashboard | Starter+ | page.tsx:50, plans.ts:55,71 | `(church)/church/[slug]/dashboard/page.tsx`, `plans.ts` (`hasPastoralDashboard`) | **built** | — |
| 3 | Pastoral care inbox | Starter+ | page.tsx:57, plans.ts:56,72 | `(church)/church/[slug]/dashboard/care/page.tsx`, `pastoral.service.ts` | **built** | — |
| 4 | Prayer-team assignments | Pro+ | page.tsx:64, plans.ts:73 | `(church)/church/[slug]/dashboard/team/page.tsx`, `AssignPrayerForm`, `assignments` API route | **built** | — |
| 5 | Testimony approval queue | Pro+ | page.tsx:71, plans.ts:74 | `(church)/church/[slug]/dashboard/testimony/page.tsx`, `testimony` API routes, `admin/queue` | **built** | — |
| 6 | Prayer circles / groups (Starter ≤5; Pro unlimited) | Starter+ / Pro | page.tsx:78 | `(church)/church/[slug]/groups/page.tsx`, `group.service.ts`, plan `limits.groups` | **built** | — |
| 7 | Real-time live event wall + moderation console | Pro+ | page.tsx:85, plans.ts:75 | `(church)/.../events/[eventId]/{wall,display,moderation}/page.tsx`, `event.service.ts` | **built** | — |
| 8 | Basic analytics (Starter) / Advanced + PDF reports (Pro) | Starter+ / Pro | page.tsx:92–93, plans.ts:77 | Analytics: `(church)/.../dashboard/analytics/page.tsx` + `church-analytics.service.ts` **built**. Event `report.csv` exists. **No PDF generator anywhere in src** (no `@react-pdf`, `pdfkit`, `puppeteer`). | **partial** (PDF specifically **missing**) | **ship-stopper** for the PDF-report line; analytics itself ships |
| 9a | PCO member sync (no CSV) | Pro+ | page.tsx:98–101 | `PlanningCenterAdapter.listMembers/syncMember`, `chms-sync-runner`, `chms-full-sync-scheduler` | **built** | — |
| 9b | PCO delta sync via webhook | Pro+ | page.tsx:98–101 (implied by "automatically") | `api/webhooks/chms/[provider]/route.ts`, `PlanningCenterAdapter.handleWebhook`. **`webhookSecret` never populated** — OAuth callback route (`api/auth/chms/callback/planning-center/route.ts`) does not write one; `handleWebhook` early-returns `null` when secret is absent → all webhooks rejected. | **partial** | **ship-allowed-with-label** — add "nightly sync; real-time webhook sync coming soon" |
| 9c | "Small groups sync too" | Pro+ | page.tsx:99 | `listGroups()` implemented on adapter (paginated, 403 handled), **but `chms-sync-runner/route.ts:66` destructures to `_groups` and never persists them.** No `syncGroup` method on the adapter; no writes from PCO groups → `groups` table. | **stub** (read-only, not persisted) | **ship-stopper** — either build the persist leg or remove the sentence |
| 9d | "Weekly prayer summary appears as a note on each person's PCO record" | Pro+ | page.tsx:99–100 | Adapter method `pushPrayerSummary()` exists and the runner handles `push_summary` job type. **No scheduler anywhere inserts `push_summary` jobs.** No cron, no action, no trigger — the capability is latent. | **stub** (latent code, no scheduler) | **ship-stopper** — this is the per-person push-to-PCO differentiator the card sells |
| 10 | Network section: "unlimited everything" | Enterprise | page.tsx:318–332, plans.ts:90–93 | plans.ts limits all null/999, Enterprise has no Stripe price (contact-sales only) | **built** | — |
| 11 | Network: custom subdomain + SSO "on the roadmap" | Enterprise | page.tsx:328–329, plans.ts:93–94 | Not built. Copy explicitly labels as roadmap/"coming soon." Sprint 17 hotfix still holds. | **coming-soon-labeled** | — |
| 12 | Network: "custom agreement available" | Enterprise | plans.ts:95 | Marketing bullet only; no MSA template in repo. Legal flagged this as Sprint 18 condition E4. Not a ship-stopper (sales can author per-deal). | **partial** | cosmetic — soft promise, backable per-deal |
| 13 | Free tier: 50 members / 3 groups | Free | plans.ts:31–37 | `plans.ts` limits enforced by `church-platform.service.ts` (member-cap code found in grep) | **built** | — |
| 14 | Starter: custom welcome message | Starter | plans.ts:52 | `(church)/.../settings/WelcomeMessageForm.tsx`, `api/v1/church/[slug]/welcome/route.ts` | **built** | — |
| 15 | Starter: email digest for pastors | Starter | plans.ts:53 | `api/cron/church-digest/route.ts` (Monday 8am UTC, Resend + `emails/church-digest`) | **built** | — |
| 16 | Pro: custom branding | Pro | plans.ts:76 | `(church)/.../dashboard/branding/BrandingForm.tsx`, `api/v1/church/[slug]/branding` | **built** | — |
| 17 | Pro: priority support | Pro | plans.ts:78 | No code. No triage queue, no SLA, no routing. Marketing-only claim. | **missing** | **ship-allowed-with-label** — either remove the bullet or define the commitment (same §5 shape as the "dedicated support" claim Sprint 17 removed) |
| 18 | FAQ: "switch between monthly and annual from your billing settings at any time" | All paid | page.tsx:119 | `(dashboard)/billing/page.tsx` + `BillingActions.tsx`. `UpgradeButton` has `billing: 'monthly' \| 'yearly'` prop, **but every usage in billing/page.tsx:117,177 hard-codes `billing="monthly"`**. No UI toggle, no switch flow. | **missing** (from settings — yearly checkout is reachable only if code passes `yearly`, never exposed) | **ship-allowed-with-label** — reword FAQ to "contact us to switch" or ship a toggle |
| 19 | FAQ: cancel anytime from billing settings | All paid | page.tsx:131 | `CancelSubscriptionButton` in `BillingActions.tsx` + `cancelSubscriptionAction` | **built** | — |
| 20 | FAQ: prorated upgrade, data carries over | All paid | page.tsx:122–123 | `UpgradeButton` → `createCheckoutAction` → Stripe Checkout | **built** (Stripe handles proration) | — |
| 21 | FAQ: member-cap notice in admin panel | All paid | page.tsx:114–115 | `church-platform.service.ts` referenced in grep; cap approach path visible. Verify the specific "approaching limit" UI copy — cap enforcement is there. | **built** (enforcement) — UI "approaching" nudge not independently verified, low-risk | cosmetic |
| 22 | Hero: "No one falls through the cracks between Sundays." | N/A (hero) | page.tsx:183 | Phrase was among the 11 Sprint 17 killed (signoff doc p. 31: *"A repository grep for `…\|falls through the cracks\|…` across `src/` returns zero hits"*). The phrase is **back**. | **drift** — Sprint 17 regression | **ship-allowed-with-label** — Legal should confirm this phrasing is acceptable without the AI-flagged-care backing. Likely OK (it's aspirational about pastoral *workflow*, not a product promise of automatic surfacing), but the exact string was previously scrubbed. |

---

## Follow-up list (non-built rows, with one-line fix)

1. **PDF reports (row 8)** — ship a PDF generator for the analytics page (any of `@react-pdf`, Puppeteer-on-Vercel, or print-stylesheet + browser export). Until then, reword to "CSV exports" or mark "PDF — coming soon."
2. **PCO webhook delta sync (9b)** — persist `webhookSecret` during OAuth callback (Sprint 18 known gap, already tracked); until shipped, add "nightly sync" qualifier to the card. Sprint 18 notes already name this as Sprint-19 follow-up.
3. **PCO group sync (9c)** — implement `syncGroup(churchId, group)` on the adapter + call it from `chms-sync-runner` (currently `_groups` is discarded). Until shipped, remove "Small groups sync too" from the card.
4. **PCO weekly summary push (9d)** — add a cron that inserts `push_summary` jobs per church-member with a weekly-digest string, ideally co-located with `church-digest` (Monday 8am UTC). Until shipped, remove the "brief weekly prayer summary appears as a note on each person's PCO record" sentence.
5. **Priority support (17)** — either define the triage commitment (e.g., 1-business-day email response for Pro) and document at `/help` + ToS, or remove the bullet from `plans.ts:78`.
6. **Billing monthly↔annual switch (18)** — either ship a toggle in `BillingPage` that calls `createCheckoutAction(tier, 'yearly')` or reword FAQ: "Contact us at hello@ to switch billing cadence."
7. **Custom agreement template (12)** — Legal + outside counsel draft a baseline MSA (Sprint 17 condition E4 already tracked). Soft promise until then.
8. **Hero phrase (22)** — not a blocker, but flag to Legal: the exact string Sprint 17 removed is back. Decide: keep (and document the rationale distinct from AI-Flagged Care), or rephrase.

---

## PCO-specific section (per task AC)

Sprint 18 shipped an extensive Planning Center integration: OAuth connect, token storage (encrypted), full-sync scheduler (daily), sync-job runner with retry/backoff/dead-letter, admin-notify on dead jobs, list-members, list-groups (with 403 fallback), syncMember, pushPrayerSummary, handleWebhook (HMAC-verified, timing-safe, replay-window). The plumbing is production-grade where it exists.

**Three gaps directly affect `/for-churches` claims:**

| Gap | Evidence | Impact on marketing |
|---|---|---|
| `webhookSecret` never populated during OAuth | `api/auth/chms/callback/planning-center/route.ts` exchanges tokens but writes nothing to `webhookSecret`. `handleWebhook` returns `null` if `this.config?.webhookSecret` is absent → every webhook is silently dropped. Sprint 18 notes flag this for Sprint 19. | "Automatically" (page.tsx:98) on the PCO card currently means nightly batch, not real-time. **partial** — needs a label. |
| PCO group sync returned but not persisted | `chms-sync-runner/route.ts:66` — `const [members, _groups] = await Promise.all(...)`. `_groups` is discarded. No `syncGroup` in the adapter interface (`ChmsAdapter.ts` only has `listGroups`). | "Small groups sync too" (page.tsx:99) is **stub** — reads from PCO, writes nothing. Ship-stopper for that specific sentence. |
| Weekly PCO summary push has no scheduler | `pushPrayerSummary()` on adapter, `push_summary` branch in runner, but grep finds zero inserts of `jobType: 'push_summary'` anywhere in `src/` outside schema/migration/runner-consumer. The trigger side does not exist. | "Weekly prayer summary appears as a note on each person's PCO record" (page.tsx:99–100) is **stub**. Ship-stopper for that specific sentence. |

**Sandbox integration tests** remain pending per Sprint 18 close notes (`PlanningCenterAdapter.integration.test.ts` gates on human credentials). This is a verification gap, not a marketing gap — the unit tests pass, but no end-to-end run against real PCO sandbox has confirmed the happy path in production-equivalent conditions.

**Verdict for PCO card overall:** **partial**. Anything the card says that depends on real-time webhooks, group-tree arriving in PrayerJar, or summaries appearing in PCO today is not true. The one-time member import on OAuth + daily full-sync **is** true and is already significant value — but it is not what the copy promises.

---

## Sprint 17 hotfix status — still hold?

- **AI-Flagged Care kill (Sprint 17 hotfix 1):** Grep `AI.?[Ff]lagged|flagged care|automatically.?surfaced` across `src/` still returns **zero** hits. **HOLDS.** Separately: "falls through the cracks" is back in the hero — see row 22. The Sprint 17 signoff grouped that phrase with the AI-flagged-care kill; its return is drift, though the §5 risk is lower because the hero is no longer paired with an AI-surfacing capability claim.
- **Enterprise claims (Sprint 17 hotfix 2):** SSO/SAML/subdomain still labeled "on the roadmap" / "coming soon" on page.tsx:328 and plans.ts:93–94. SLA and dedicated-support remain absent. **HOLDS.**
- **Pastoral dashboard tier consistency (Sprint 17 hotfix 3):** page.tsx resolves the tier label from `PASTORAL_DASHBOARD_TIER_NAME` (imported line 22–27). No hand-typed tier string. `plans.test.ts` still locks this. **HOLDS.**

No Sprint 17 regressions except the hero phrase.

---

## Severity summary

- **Ship-stoppers (3):** PDF reports (row 8), PCO group sync (9c), PCO weekly summary push (9d).
- **Ship-allowed-with-label (4):** PCO webhook delta (9b), priority support (17), monthly↔annual switch (18), hero phrase (22).
- **Cosmetic (2):** custom agreement (12), member-cap nudge UI (21).

All three ship-stoppers are Pro-tier claims — they face the paying buyer, which is the FTC §5 framing Legal used in the Sprint 17 sign-off: "a promise made *inside the product the buyer paid for* is a cleaner §5 case."
