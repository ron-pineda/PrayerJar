# CustomerSuccess Findings — Per-Segment Fit Rubric for `/for-churches`

**Prepared by:** CustomerSuccess
**Date:** 2026-04-19
**Sprint:** `21-review` (audit, not build)
**Task:** `pj-s21r-03`
**Answers:** Q1 — can a church of size X actually get value today from `/for-churches`?

**Note on parity claims:** Research `pj-s21r-01` has not landed at time of writing. Competitor-specific names below are drawn from the Sprint 17 pricing research. Where a feature gap is called out, it is tagged **[assumes competitor parity]** unless Research confirms a specific competitor. Rubric color conventions: **G** good / **Y** acceptable w/ friction / **R** blocker.

---

## Segment 1 — Small Church (<100 members)

**Candidate tiers:** Free (50 members / 3 groups) → Small Church $19/mo (150 / 5 groups, pastoral dashboard + care inbox).

| Dimension | Rating | Why |
|---|---|---|
| Features | **G** | Private wall, pastoral dashboard, care inbox, 5 groups. Fully covers the small-church pain ("someone left a request Sunday — know by Monday"). |
| Tier price | **G** | $19/mo (or $16.15/mo annual) sits cleanly under the "one small-group Bible-study budget line" threshold — no finance-committee approval needed. |
| Onboarding friction | **Y** | Sprint 17 audit identified 15 friction points. Sprint 18 picked up the checklist + redirect work, but the public-profile-as-landing-screen and plan-gate dead-end risks remain if those shipped only partially. A lone pastor with no tech staff will still feel post-signup ambiguity. |
| PCO integration relevance | **R** | PCO is gated at `pro` ($49). Small churches frequently run PCO Free (<50 people). The church that *most* needs automated roster sync is locked out. Also — per kickoff, `webhookSecret` population is deferred and sandbox tests pending, so even on `pro` this is "partial." |

**Verdict: CONDITIONAL YES.** A 60-member church with a lone pastor can sign up today, land on Small Church $19, and get real value within a week — provided they navigate past the post-creation ambiguity. The Free tier 50-member cap is the single biggest friction; churches with 51–100 members get pushed to paid on member count alone before they have felt any pastoral-tool value.

**Missing features (small segment):**
1. **Bulk email invite for 10–30 members from a CSV or paste-list** — competitors ship this [assumes competitor parity]. Today the only path is a single copy-paste link (audit Friction #14).
2. **Printable QR-code handout for Sunday bulletins** — the lowest-tech, highest-impact small-church acquisition loop [assumes competitor parity].
3. **Free-tier member cap of 75, not 50** — the 50 ceiling is the most common reason a tiny church gets blocked before feeling value. Not a feature gap, a limit tune.

**Top 3 quick wins — Small segment (all <1 day):**
1. **Raise Free cap to 75 members** (`src/lib/plans.ts` one-line limit change, plus marketing copy) — immediately unlocks the 50–75 band (the majority of plants and house churches) to experience the platform before a paywall decision. **Impact: removes #1 small-church blocker.**
2. **Add a printable QR-code "invite handout" PDF** accessible from the church dashboard — wraps the existing `CopyInviteLink` slug into a print-ready page. Kills the "how do I get 40 elders onto this?" friction for Sunday-bulletin-driven congregations.
3. **Surface the existing Setup Guide link on the public church profile (admin view only)** — already flagged as Sprint 18 task #9 in the onboarding audit. Confirm it shipped; if not, ship it. Straight line to solving Friction #4.

---

## Segment 2 — Medium Church (100–500 members)

**Candidate tier:** Growing Church $49/mo (unlimited members, unlimited groups, prayer team assignments, testimony approval, live event wall, custom branding, PDF reports, PCO).

| Dimension | Rating | Why |
|---|---|---|
| Features | **G** | This tier is the product's *center of gravity*. Prayer team assignments, testimony approval queue, live event wall, custom branding, PDF reports for elder meetings, PCO — every marketed feature maps to a concrete mid-size pastoral workflow. |
| Tier price | **G** | $49/mo ($41.65 annual) is meaningfully below the $60–$99 range that Sprint 17's pricing work flagged as the competitor mid-tier band. Value-per-dollar is the strongest in the ladder. |
| Onboarding friction | **Y** | Same generic friction as Small, plus a new risk: a mid-size church has a worship pastor, admin, and elder team who all need varying access. No marketed self-serve admin-role management on `/for-churches`; team setup is a nav-discovery problem (audit Friction #13). |
| PCO integration relevance | **Y** | This is the segment that actually has PCO deployed — high relevance. But the marketing page claims "member list syncs automatically" while the backend has *deferred webhookSecret and pending sandbox tests* (per kickoff). That makes the claim **built-but-unverified** at the exact tier where churches will evaluate it against real PCO data. |

**Verdict: YES** — with a caveat on PCO. A 250-member church can sign up, land on Growing Church $49, and get all the marketed pastoral value immediately. The only thing that will wobble is PCO sync at the moment of first real-data test — and that's the feature most likely to be the close-the-deal item for this segment.

**Missing features (medium segment):**
1. **Email-based member invites (not just link-copy)** — medium churches invite in batches of 50+, not one-at-a-time [assumes competitor parity]. Audit Friction #14.
2. **Role templates beyond owner/admin/member** (e.g., "worship-team leader," "small-group leader" scoped to their own group) — a mid-size church has more than two kinds of leader [assumes competitor parity].
3. **PCO webhook reliability parity** — not a missing *claim*, a missing *production-grade implementation*. Architect audit (`pj-s21r-02`) will have the final word.

**Top 3 quick wins — Medium segment (all <1 day):**
1. **Add a "PCO sync status" badge on the dashboard** — a visible "last synced at …" + manual "Sync now" button. Turns the kickoff's unpopulated-webhookSecret risk from a silent failure into a user-visible, user-recoverable state. **Impact: converts a deal-breaker into a forgivable delay.**
2. **Ship a minimal email-invite form** — paste a list of emails, server sends each recipient the existing invite link via the already-configured transactional mailer. Closes Friction #14 for the segment that most needs it.
3. **Marketing-page tweak: add a single line on `/for-churches` under the PCO feature tile — "New PCO installs may need 1 manual sync on day one."** Sets correct expectations before a $49 decision, costs 1 copy change, saves a refund ticket.

---

## Segment 3 — Large Church (500+ members)

**Candidate tier:** Network $199+/mo (unlimited everything, Enterprise demo gate — `/for-churches/demo`). Custom subdomain and SSO/SAML are marked **coming soon**.

| Dimension | Rating | Why |
|---|---|---|
| Features | **Y** | Unlimited members/groups/events/admins is strong. But the differentiators that actually matter to multi-site / denominational buyers — **SSO/SAML**, **custom subdomain**, **multi-campus reporting**, **data-residency / BAA-adjacent language** — are either "coming soon" or unmentioned. The feature set is "more of Pro" rather than "enterprise-grade." |
| Tier price | **Y** | $199 starting point is defensible for a 500+ church and below the competitor bespoke band. But "starting at" with no published ceiling makes procurement-minded buyers nervous — a 2,000-member multi-site needs to know it isn't $1,999. |
| Onboarding friction | **Y** | Demo gate (`/for-churches/demo`) is the right motion for this segment — but it is also a hard wall. A large-church decision-maker exploring on a Sunday evening cannot self-serve *any* first-touch answer — no sandbox, no read-only sample, no PDF overview. |
| PCO integration relevance | **G** | 500+ churches run PCO at scale and this integration is the single strongest justification for Network over rolling their own. Same asterisk as Medium on webhook hardening. |

**Verdict: NO (today).** A 1,200-member multi-site church visiting `/for-churches` today sees a tier with two visible "coming soon" items (SSO, subdomain) and an opaque "starting at $199" — and they must book a call to get further. Either the features land or the positioning must change. Running sales outreach into this segment right now would burn credibility.

**Missing features (large segment):**
1. **SSO / SAML** — listed as coming soon, but this is the single most common procurement checklist item for 500+ churches [assumes competitor parity — Planning Center, Subsplash, and Gloo-tier tools all ship it]. Until built, Network is not enterprise-ready.
2. **Custom subdomain** — coming soon. Table stakes for any multi-site brand.
3. **Multi-campus / multi-congregation reporting** — not mentioned on `/for-churches`. A denomination needs roll-up reporting across child churches; the current data model and UI assume one church.
4. **Published price ceiling or per-seat formula** — "Starting at $199" with no upper bound is a procurement red flag for institutional buyers.
5. **A downloadable one-pager PDF** for decision-committees who want to share internally before booking the demo.

**Top 3 quick wins — Large segment (all <1 day):**
1. **Add a downloadable "PrayerJar for Networks" one-pager PDF** linked from the Network contact section — gives procurement something to circulate internally without blocking on a scheduled call. **Impact: highest conversion per hour of build time in this segment.** No code — a PDF asset + a link.
2. **Publish a price example pair on `/for-churches`** under the Network section — e.g., "Example: a 3-campus, 1,500-member network lands at $X/mo." Removes the procurement-side anxiety created by the open-ended "starting at." Copy-only change.
3. **Replace the two "coming soon" items in the Network tile with a dated roadmap** — "SSO/SAML — targeting [quarter]. Custom subdomain — targeting [quarter]." If dates are not committable, strip them out entirely and reposition Network as "currently best-fit for single-congregation 500+ churches" — truthful positioning beats a vaporware list.

---

## Cross-segment verdict summary

| Segment | Verdict | One-line rationale |
|---|---|---|
| Small (<100) | **Conditional YES** | Tier value is right; the 50-member Free cap and post-signup drop-off keep the smallest churches from ever feeling value. |
| Medium (100–500) | **YES** | Growing Church $49 is the ladder's strongest rung; the only wobble is PCO webhook reliability where claim-vs-implementation risk sits. |
| Large (500+) | **NO, today** | Network tier's enterprise differentiators are "coming soon" or unmentioned; self-serve first-touch is a hard demo-gate wall. Positioning or features must move before sales outreach. |

## If only one thing ships

**Ship the Free-tier cap raise from 50 → 75.** Small churches are the highest-volume segment, the 50-member ceiling is the most-reported friction that the audit already surfaced, and the change is a single-line edit to `src/lib/plans.ts` plus three copy updates. It unlocks the largest pool of real users to experience pastoral-tool value before a paid decision — which is the whole theory of the ladder.

---

*Document owner: CustomerSuccess. Feeds: `pj-s21r-04` (Strategist synthesis). Sister docs (pending): `research-findings.md`, `architect-findings.md`. If Research surfaces a competitor feature not named here, fold into the missing-features lists above — it does not change the per-segment verdicts.*
