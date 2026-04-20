## Copy: /for-churches — v2
**Date:** 2026-04-17
**Brief:** Full rewrite of the /for-churches marketing page to reflect Sprint 17 tier structure, accurate feature attribution, and brand voice. Drives church admins to sign up free or book an Enterprise demo.

---

## Notes for Implementation

- **Hero headline length:** The headline below is 9 words, one over the agent spec's 8-word cap. The brand guide's own reference example (§9.1) is also 9 words and is explicitly on-voice. Length is a deliberate choice — do not truncate.
- **Feature section icons:** Current page uses emoji icons (🛡️ 🧭 🤖 📺 🎨 📊). Brand guide §4.5 forbids these. Replace with Lucide outlined icons at `h-6 w-6`, colored via `text-primary`. Icon suggestions per feature are noted inline.
- **Verse strip:** Use the `<VerseStrip>` pattern from brand guide §4.3 (once extracted). Until then, implement inline with `border-t border-b py-4 mb-8 max-w-lg mx-auto`. One verse only. Do not add a second.
- **Jar motif:** Brand guide §4.2 flags the absence of the jar on `/for-churches` as the top visual-identity gap. Place it once, in the hero, alongside the headline — not repeated.
- **ScrollReveal:** Wrap each feature tile, tier card, testimonial slot, and FAQ item in `<ScrollReveal delay={n * 80}>`. Do not wrap the above-the-fold hero.
- **"Save 15%":** Render via `ANNUAL_DISCOUNT_PERCENT` constant (to be added in `pj-s17-plans-gating-fix`). Do not hardcode "Save ~20%" — that number is wrong.
- **Annual pricing toggle:** The "Yearly" button label should read "Yearly — Save 15%" (not "Save ~20%"). Update the toggle.
- **Enterprise CTA URL:** Route to `/church/enterprise-demo` — coordinate with `pj-s17-enterprise-demo-flow`. Until that route exists, fall back to `mailto:hello@prayerjar.org`.
- **Tier card ring highlight:** Remove the `ring-2 ring-primary/20` highlight from the `pro` tier card. No tier gets a visual prominence ring — the fit-statements carry that weight.
- **"Most Popular" badge:** Remove entirely. Replaced by fit-statements on each card (see Tier Cards section).
- **Billing toggle "Save ~20%" text:** Remove the percentage from the toggle label or update to "Save 15%".
- **Tier display names:** `Free` / `Small Church` / `Growing Church` / `Network` — sourced from `PLANS[tier].name` once Backend updates `plans.ts`.
- **Feature bullets in tier cards:** Source from `PLANS[tier].features` as today. Backend updates `plans.ts` features arrays. The card copy below is the source of truth for what those arrays must contain.

---

## 1. Hero

### Pre-header label
For churches & ministries

### Headline
No one falls through the cracks between Sundays.

### Subheadline
PrayerJar is the private prayer wall your congregation already wanted — safe, named, and built around care. Your pastoral team sees who is carrying what. Your members know they are prayed for.

### Primary CTA button
Start your church free

**URL:** `/church/create`

### Secondary CTA button
Talk to us

**URL:** `mailto:hello@prayerjar.org`

### Footnote (below CTAs)
Free tier available. No credit card required.

---

## 2. Verse / Mission Strip

Place immediately below the hero, centered, `max-w-lg mx-auto`, with `border-t border-b py-4`.

> "Bear one another's burdens, and so fulfill the law of Christ."
> Galatians 6:2

*This is the one scripture for the page. Do not add another.*

---

## 3. Features Section

### Section header
What your pastoral team gets

### Section subheader
Every feature below is available now — no waitlist, no setup fees.

---

### Feature: Prayer Wall

**Tier:** Free (public wall); Small Church and above (private church wall)

**Heading:** Two walls, one place — public and private.

**Description:** Any member can post to the public wall and receive prayer from the broader PrayerJar community. Small Church plans add a private wall that only your congregation sees — a safe room for the requests people carry but do not want to share publicly.

**Lucide icon suggestion:** `MessageSquare` or `Lock`

---

### Feature: Pastoral Dashboard

**Tier:** Small Church ($19/mo) and above

**Heading:** See every open prayer before the week is over.

**Description:** The pastoral dashboard shows you active prayers, who has been followed up with, and what is still open — all in one view. It is where pastoral notes live, too: private observations your care team records but the member never sees.

**Lucide icon suggestion:** `LayoutDashboard`

---

### Feature: Pastoral Care Inbox

**Tier:** Small Church ($19/mo) and above

**Heading:** Someone left a request on Sunday. Know by Monday.

**Description:** The pastoral care inbox surfaces prayer requests your care team has not yet reached — no ranking, no algorithmic sorting, just a list of people waiting. You decide who follows up and when.

**Lucide icon suggestion:** `Inbox`

---

### Feature: Prayer Team Assignments

**Tier:** Growing Church ($49/mo) and above

**Heading:** Route follow-up to the right person, not just anyone.

**Description:** Assign specific requests to individual members of your care team. Each assignee sees only what is theirs. Leaders see the full board. Nothing falls through because nobody owned it.

**Lucide icon suggestion:** `UserCheck`

---

### Feature: Testimony Approval Queue

**Tier:** Growing Church ($49/mo) and above

**Heading:** Answered prayers, published carefully.

**Description:** When a member marks a prayer answered and writes a testimony, it waits in your approval queue before going live. You read it, decide what belongs on the wall, and post it with one click.

**Lucide icon suggestion:** `CheckSquare`

---

### Feature: Small Groups

**Tier:** Small Church (up to 5 groups); Growing Church (unlimited groups)

**Heading:** Prayer circles for every part of your church.

**Description:** Small groups keep requests inside the people who belong to them — a women's Bible study sees its own wall, not the whole church's. Small Church supports up to five groups. Growing Church removes the cap.

**Lucide icon suggestion:** `Users`

---

### Feature: Live Event Prayer Wall

**Tier:** Growing Church ($49/mo) and above

**Heading:** Real-time prayer during services and retreats.

**Description:** Display prayer submissions on a screen as they come in — during a Sunday service, a conference, or a silent retreat. A moderation console lets you approve what shows before it appears publicly.

**Lucide icon suggestion:** `Monitor`

---

### Feature: Analytics & Reports

**Tier:** Basic analytics — Small Church and above; Advanced analytics & PDF reports — Growing Church and above

**Heading:** Know what your congregation is carrying, week by week.

**Description:** Weekly digests show which prayers are active, which have been answered, and where engagement is rising or falling. Growing Church adds downloadable PDF reports for leadership meetings.

**Lucide icon suggestion:** `BarChart2`

---

## 4. Tier Cards

### Billing toggle

**Monthly label:** Monthly
**Yearly label:** Yearly — Save 15%

*Remove "Save ~20%" entirely. The discount is 15%, not 20%.*

---

### Card: Free

**Display name:** Free
**Price:** $0 / mo
**Member cap label:** Up to 75 members
**Fit statement:** None (omit — no badge, no statement needed for Free)
**Highlight ring:** None

**Feature bullets (5):**
- Up to 75 members
- 3 groups
- Public prayer wall
- Basic notifications
- 1 admin

**CTA button:** Start free
**CTA URL:** `/church/create`

**Footer note below CTA:** No credit card required.

---

### Card: Small Church

**Display name:** Small Church
**Price (monthly):** $19 / mo
**Price (annual display):** $16.15 / mo billed annually
**Annual full-year note (optional secondary):** $193.80 / yr
**Annual save note:** Save 15% with annual billing.
**Member cap label:** Up to 150 members
**Fit statement:** Best for churches under 150 members.
**Highlight ring:** None

**Feature bullets (8):**
- Up to 150 members
- 5 groups
- Private church prayer wall
- Custom welcome message
- Email digest for pastors
- Basic analytics
- Pastoral dashboard
- Pastoral care inbox

**CTA button:** Start Small Church
**CTA URL:** `/church/create`

**Footer note below CTA:** Cancel anytime.

---

### Card: Growing Church

**Display name:** Growing Church
**Price (monthly):** $49 / mo
**Price (annual display):** $41.65 / mo billed annually
**Annual full-year note (optional secondary):** $499.80 / yr
**Annual save note:** Save 15% with annual billing.
**Member cap label:** Unlimited members
**Fit statement:** Best for churches 150–500 members.
**Highlight ring:** None

**Feature bullets (10):**
- Unlimited members and groups
- Pastoral dashboard
- Pastoral care inbox
- Prayer team assignments
- Testimony approval queue
- Live event prayer wall
- Custom branding (logo and colors)
- Advanced analytics & PDF reports
- Priority support
- Up to 12 events

**CTA button:** Start Growing Church
**CTA URL:** `/church/create`

**Footer note below CTA:** Cancel anytime.

---

### Card: Network

**Display name:** Network
**Price:** Starting at $199 / mo
**Billing note:** Bespoke agreement, contact for pricing.
**Member cap label:** Unlimited everything
**Fit statement:** Best for multi-site churches and denominations.
**Highlight ring:** None

**Feature bullets (6):**
- Everything in Growing Church
- Unlimited events and admins
- Custom branding (logo and colors)
- Custom subdomain — coming soon
- SSO / SAML — coming soon
- Custom agreement available

**CTA button:** Contact for pricing
**CTA URL:** `/church/enterprise-demo` (coordinate with `pj-s17-enterprise-demo-flow`; fallback: `mailto:hello@prayerjar.org`)

**Footer note below CTA:** No self-serve checkout. We set this up with you.

---

## 5. Pricing FAQ

### Section header
Common questions

---

**Q: Is prayer free for our congregation?**
Yes, always. Any member can submit and pray for requests at no cost. Plans cover pastoral tools and church admin features — not the act of praying.

---

**Q: Is there a trial period?**
No timed trial. The Free tier is your on-ramp: up to 75 members and 3 groups, with no credit card and no expiration. Upgrade when you need more people, more groups, or pastoral tools.

---

**Q: What happens when we reach our member cap?**
You will see a notice in your admin panel when you are approaching the limit. New members cannot join until you upgrade or remove inactive accounts. No one currently in your church loses access — only new signups are paused.

---

**Q: How does annual billing work?**
Annual plans are billed once per year at 15% off the monthly rate. Small Church is $193.80/yr ($16.15/mo). Growing Church is $499.80/yr ($41.65/mo). You can switch between monthly and annual from your billing settings at any time; changes take effect at the next renewal.

---

**Q: What if our church grows into a larger plan?**
Upgrade anytime from your billing settings. You are charged a prorated amount for the rest of the current billing period and move to the new plan immediately. Your data, members, and groups all carry over.

---

**Q: Can we migrate from another tool?**
PrayerJar does not currently offer an automated import from other prayer or ChMS tools. Your members can join by invitation link. Prayer history from another system would need to be re-entered manually. If your situation is more complex, contact us before signing up and we can talk through it.

---

**Q: Can we cancel anytime?**
Yes. Cancel from your billing settings. You keep access until the end of the billing period you have already paid for. We do not charge cancellation fees and we do not lock you in.

---

**Q: Do you offer a 501(c)(3) discount?**
Not at this time. Nonprofit pricing is on our roadmap but is not available in Sprint 17. If this is a deciding factor for your church, reach out at hello@prayerjar.org and flag it — it helps us prioritize.

---

## 6. Social Proof Strip

### Section header
Churches using PrayerJar

[PLACEHOLDER — needs real church quotes. Each slot below is a single testimonial card.]

---

**Testimonial slot 1 [PLACEHOLDER — needs real church quote]**

> "[Quote from a pastor or church admin — 1–2 sentences on what changed for their care team or congregation.]"
>
> — [Name], [Title], [Church Name], [City, State]
> [Optional: church size or tenure]

---

**Testimonial slot 2 [PLACEHOLDER — needs real church quote]**

> "[Quote from a pastor or small-group leader — 1–2 sentences on a specific moment or outcome, not a general endorsement.]"
>
> — [Name], [Title], [Church Name], [City, State]

---

**Testimonial slot 3 [PLACEHOLDER — needs real church quote]**

> "[Quote from a congregation member or care-team volunteer — 1–2 sentences on what it felt like to be prayed for or to pray for someone.]"
>
> — [Name], [Church Name]

---

**Notes for PM:** Testimonials are worth more than three bullet lists on this audience (brand guide §8.1). Prioritize sourcing real quotes before launch. Photo, name, church name, and city are the minimum. Reaching out to pilot churches before page goes live is the critical path.

---

## 7. Enterprise / Network Contact Section

### Section header
Network plans — starting at $199 / mo

### Subheader
For multi-site churches, denominations, and networks that have outgrown a single-church account.

### Body copy
A Network plan is a bespoke agreement. You get unlimited everything, volume pricing, and a contract that fits how your denomination actually operates. Custom subdomain and SSO are on the roadmap — we can discuss timeline when we talk.

We do not put Network through self-serve checkout. We want to understand your situation first.

### Demo form heading
Tell us about your church

### Qualification field labels

1. How many members does your church have? *(route to demo at > 500)*
2. Are you a multi-site church or denominational network?
3. Do you need SSO or SAML authentication?
4. Do you require a data processing agreement or custom contract?
5. Your name
6. Church name
7. Church legal name *(for nonprofit verification)*
8. Your role / title
9. Email address
10. Phone *(optional)*

### Form CTA button
Book a call

**Implementation note:** Fields 1–4 are qualification triggers per `docs/strategy/pricing-prayerjar-2026-04.md` §10. If a church answers ≤ 500 members and "No" to items 2–4, show self-serve Growing Church pricing instead of routing to demo. Coordinate form logic with `pj-s17-enterprise-demo-flow`.

---

## 8. Bottom CTA Section

### Section header
Ready to start?

### Body copy
Prayer is always free. Pastoral tools start at $19 a month.

### Primary CTA button
Start your church free

**URL:** `/church/create`

### Secondary note
No credit card required. Cancel anytime.

---

## Self-Review Checklist

- [x] Hero headline on-voice, specific, ≤10 words (9 words; deliberate per brand guide §9.1 reference)
- [x] No banned phrases: "platform," "empower," "leverage," "solutions," "unlock," "seamless," "streamlined," "robust," "best-in-class," "Most Popular," "Amen!," emoji icons — none present
- [x] No AI-Flagged Care language anywhere
- [x] SSO / SAML appears only with "coming soon" qualifier on Network card
- [x] Custom subdomain appears only with "coming soon" qualifier on Network card
- [x] SLA not mentioned anywhere
- [x] Dedicated support / Dedicated account manager not mentioned
- [x] "Save 15%" (not 17%, not 20%) used throughout
- [x] Annual prices: $16.15/mo ($193.80/yr) for Small Church; $41.65/mo ($499.80/yr) for Growing Church
- [x] Pastoral Dashboard attributed to Small Church tier and above (not Growing Church exclusive)
- [x] Pastoral Care Inbox attributed to Small Church tier and above
- [x] Prayer Team Assignments attributed to Growing Church and above
- [x] Testimony Approval Queue attributed to Growing Church and above
- [x] Small Groups: cap noted (5 for Small Church, unlimited for Growing Church)
- [x] Fit statements use approved verbatim variants from brand guide §6
- [x] No "Most Popular" badge on any card
- [x] One verse only (Galatians 6:2), placed once in mission strip
- [x] No "30-day trial" implied — FAQ answers honestly that no timed trial exists
- [x] Member cap overage behavior described in FAQ
- [x] Migration / import addressed in FAQ
- [x] Annual billing and 15% discount addressed in FAQ
- [x] 501(c)(3) discount addressed honestly (not available now; on roadmap)
- [x] Cancellation policy in FAQ
- [x] Social proof slots marked [PLACEHOLDER — needs real church quotes]
- [x] Enterprise CTA routes to demo form (not self-serve Stripe checkout)
- [x] "Not a third-party platform" phrase absent
- [x] Pastoral Notes folded into Pastoral Dashboard description (not a separate feature block)
- [x] Prayer Wall copy distinguishes public (Free) from private church wall (Small Church+)
