# PrayerJar Enterprise (Network) Demo Flow
**Date:** 2026-04-17
**Author:** Sales agent
**Status:** DRAFT — awaiting Reviewer approval
**Task:** pj-s17-enterprise-demo-flow
**Price anchor:** Starting at $199/mo — bespoke agreement, contact for pricing

---

## 1. Lead Qualification Logic

### Qualification Threshold

A church qualifies for the Network (Enterprise) demo flow — and must NOT be routed to self-serve Growing Church ($49/mo) — if **any one** of the following is true:

| Signal | Threshold | Why it matters |
|--------|-----------|----------------|
| Total members | 500+ | Growing Church cap is "unlimited" in product terms but support overhead scales; $49 is undersized for large operations |
| Multi-site | Yes (any number of campuses > 1) | Requires custom admin structure, reporting rollups, and likely a custom agreement |
| Denomination / network | Yes | Purchasing authority is at denomination level; custom agreement needed for multi-church rollout |
| SSO / SAML need | Yes | Feature is "coming soon" — requires custom scoping conversation, not self-serve |
| DPA / custom contract | Yes | Legal docs are in place (`/legal/dpa`), but custom terms require human review and negotiation |
| Seminary | Yes | Distinct use case (student cohorts, faculty care, chapel programs) that requires bespoke scoping |

### Decision Tree

```
START: Visitor arrives at /for-churches or clicks "Contact for pricing" on Network card
│
├─ Q1: "How many members does your church have?"
│   ├─ 500+ → ENTERPRISE PATH (route to demo form)
│   └─ <500 → continue to Q2
│
├─ Q2: "Are you a multi-site church, denominational network, or seminary?"
│   ├─ Yes → ENTERPRISE PATH
│   └─ No → continue to Q3
│
├─ Q3: "Do you need SSO / SAML authentication?"
│   ├─ Yes → ENTERPRISE PATH (with note: SSO is coming soon — demo sets expectations)
│   └─ No → continue to Q4
│
└─ Q4: "Do you require a data processing agreement or custom contract?"
    ├─ Yes → ENTERPRISE PATH
    └─ No → SELF-SERVE PATH
        → Show Growing Church ($49/mo) with upgrade CTA
        → Message: "Growing Church covers unlimited members and everything you need.
           Start free and upgrade when you're ready."
        → CTA: "Start Growing Church" → /church/create
```

### Notes on Qualification
- A church that scores "no" on all four triggers should never see a demo wall. Redirect warmly to Growing Church.
- If a church is between 150–500 members and says "multi-site," still route to Enterprise — the multi-site flag overrides the member count.
- Do not use member count alone as a disqualifier for Enterprise curiosity; a small church with a DPA requirement is a legitimate Network lead.

---

## 2. Demo Request Form Fields

All fields appear on `/for-churches/demo`. The form is the entry point to the Network funnel; it also populates the rep-facing brief.

**Price anchor displayed above form:** "Network plans start at $199/mo — we set this up with you, not through a checkout screen."

**Trust signals displayed near the form:**
- "Data Processing Agreement available at [/legal/dpa]"
- "Sub-processor list published at [/legal/subprocessors]"
- "No shared-wall data. Your congregation's prayers stay in your church."

### Required Fields (10)

| # | Field label | Field type | Required | Notes |
|---|-------------|------------|----------|-------|
| 1 | Church / organization name | Text | Required | Maps to `church_name` |
| 2 | Denomination or network affiliation | Text | Optional | Leave blank if independent; helps rep prep |
| 3 | Primary location (City, State) | Text | Required | Helps rep understand time zone for Calendly |
| 4 | Church website | URL | Required | Rep uses this for pre-call research |
| 5 | Total members (approximate) | Dropdown | Required | Buckets: `<50` / `50–150` / `150–500` / `500–2,000` / `2,000+` |
| 6 | Number of campuses | Dropdown | Required | `1 (single site)` / `2–4` / `5–10` / `11+` |
| 7 | Current ChMS in use | Dropdown | Required | `Planning Center` / `Breeze` / `ChurchTrac` / `Elvanto` / `Other` / `None` |
| 8 | Primary use case | Multi-select or single dropdown | Required | `Prayer ministry` / `Small groups` / `Pastoral care` / `All of the above` |
| 9 | Timeline to get started | Dropdown | Required | `Ready now` / `1–3 months` / `3–6 months` / `Just exploring` |
| 10 | Contact: name + email + phone (optional) | Three sub-fields | Name + Email required; Phone optional | Name = text, Email = email, Phone = tel |

### Field Notes for Frontend (pj-s17-enterprise-demo-ui)
- Fields 1, 3, 4, 10 are plain text / email / URL inputs.
- Fields 5, 6, 7, 8, 9 are `<select>` or `<fieldset>` radio/checkbox groups.
- Field 5 ("Total members") is the primary routing signal — if the user selects `500–2,000` or `2,000+`, the form confirms enterprise routing in the UI (no change, just confirmation copy).
- Field 7 ("Current ChMS") helps the rep prepare a relevant integration story (see ChMS landscape doc at `docs/integrations/chms-landscape.md`).
- All 10 fields confirmed against `docs/marketing/for-churches-copy-v2.md` §7 (Enterprise / Network Contact Section). The copy doc lists 10 qualification fields; this spec is the authoritative expanded version with field types and optionality.

---

## 3. Automated Follow-Up Sequence

Owned by Sales. Triggered by a successful form submission (status 200, row written to `church_enterprise_leads`).

All emails send from `hello@prayerjar.org` via Resend. ADMIN_EMAILS (env var, comma-separated) receives the internal notification.

**Important:** Do not make feature promises in any automated email. SSO and custom subdomain are "coming soon" — do not set delivery expectations. All automated copy below has been written to avoid commitments.

---

### Touch 1 — T+0: Confirmation Email (to lead)

**Trigger:** Form submit success  
**To:** Lead's submitted email address  
**Subject:** We received your PrayerJar request — [Church Name]

**Body:**
> Thanks for reaching out about PrayerJar's Network plan. We've received your request for [Church Name] and someone from our team will be in touch within one business day.
>
> In the meantime, you're welcome to explore our [Data Processing Agreement](/legal/dpa) and [sub-processor list](/legal/subprocessors) — both are public and require no login.
>
> — The PrayerJar team

**Notes:** The DPA and sub-processor links are genuine trust accelerators for church admins and denominational purchasing teams. Include them here, not later.

---

### Touch 2 — T+1h: Internal Notification (to ADMIN_EMAILS)

**Trigger:** 1 hour after form submit  
**To:** ADMIN_EMAILS (env var)  
**Subject:** New Network lead: [Church Name] — [Member Bucket] members, [Timeline]

**Body (auto-populated from form fields):**
```
New Network demo request — [timestamp]

Church: [church_name]
Denomination: [denomination or "Independent"]
Location: [city_state]
Website: [website]
Members: [member_bucket]
Campuses: [campus_count]
Current ChMS: [chms]
Use case: [use_case]
Timeline: [timeline]

Contact: [contact_name]
Email: [contact_email]
Phone: [contact_phone or "Not provided"]

Qualification flags:
  Members 500+: [YES/NO]
  Multi-site: [YES/NO — based on campuses > 1]
  Denomination: [YES/NO — based on denomination field]
  SSO/SAML noted: [YES/NO — flag if use_case or notes mention it]
  DPA: [YES/NO — flag if denomination is present, size is large, or contact noted it]

Recommended action: Book a discovery call within 24h. See rep brief template below.
```

**Notes:** This notification is the rep's actionable trigger. The 1-hour delay (not immediate) gives the system time to confirm the row is committed before alerting. Do not send if the form submission fails validation.

---

### Touch 3 — T+24h: "Still reviewing" touch (to lead, if no Calendly booking)

**Trigger:** 24 hours after form submit AND no Calendly booking detected (check via `calendly_booked` flag on the lead row, set to `true` by the Calendly webhook or thank-you step confirmation)  
**To:** Lead's submitted email address  
**Subject:** Your PrayerJar demo request — still on it

**Body:**
> Hi [Contact Name],
>
> We're still reviewing your request for [Church Name] and putting together a call that's worth your time. If you'd like to move faster, you can book a slot directly on our calendar: [CALENDLY_URL]
>
> We'll also reach out directly if we haven't heard from you.
>
> — The PrayerJar team

**Notes:** This is the highest-converting touch in the sequence. The Calendly link gives the lead agency without pressure. Short, no sales language, no urgency bait.

---

### Touch 4 — T+72h: Feature spotlight (to lead, if no Calendly booking)

**Trigger:** 72 hours after form submit AND still no Calendly booking  
**To:** Lead's submitted email address  
**Subject:** What PrayerJar looks like for a church your size

**Body (personalized by member bucket):**

*For 500–2,000 or 2,000+ bucket:*
> Hi [Contact Name],
>
> Churches your size tell us two things most often: pastoral care falls through the cracks between Sundays, and the pastor doesn't know what the congregation is carrying until something surfaces publicly.
>
> PrayerJar's pastoral dashboard and care inbox give your team visibility across every open prayer request — without requiring your congregation to use a new app. They join by invitation link, post from their phone, and your care team sees everything from one place.
>
> If you're coordinating across multiple campuses or staff teams, that's exactly what a Network plan is built for. Want to see how it works for a church at your scale? [Book a 20-minute call here: CALENDLY_URL]
>
> — The PrayerJar team

*For 150–500 bucket (borderline Enterprise — caught by multi-site or DPA flag):*
> Hi [Contact Name],
>
> Most churches at your size are running pastoral care out of a spreadsheet or group text — and the pastor is the only one who knows who needs follow-up. PrayerJar replaces that with a private prayer wall your whole congregation can use, and a care inbox that tells your team exactly who hasn't been reached yet.
>
> A Network plan makes sense when you have multiple staff members coordinating care, need a data processing agreement for your denomination, or are planning to grow into a multi-site structure. [Book a 20-minute call here: CALENDLY_URL]
>
> — The PrayerJar team

**Notes:** Do not mention SSO or custom subdomain in this email — they are "coming soon" and should not anchor a prospect's buying decision on an unshipped feature.

---

## 4. Rep-Facing Brief Template

**File this at:** Wherever your team tracks leads (CRM, Notion, internal doc). Pre-fill from the form submission data before the call.

---

```markdown
# Demo Call Brief — [Church Name]
**Date:** [call date]
**Rep:** [rep name]
**Calendly slot:** [time + timezone]

---

## Church Background
- **Name:** [church_name]
- **Denomination:** [denomination or "Independent"]
- **Location:** [city_state]
- **Website:** [website] — *review before call; note any existing prayer or care infrastructure visible on site*
- **Current ChMS:** [chms] — *see docs/integrations/chms-landscape.md for integration notes*
- **Member count:** [bucket]
- **Campuses:** [campus_count]

## What They Told Us (from form)
- **Primary use case:** [use_case]
- **Timeline:** [timeline]
- **Contact:** [contact_name], [contact_email], [contact_phone]

## Qualification Flags
- [ ] Members 500+ (high-value, show full Network feature set)
- [ ] Multi-site (show cross-campus admin; note custom subdomain on roadmap)
- [ ] Denomination / network (ask about purchasing authority; custom agreement likely)
- [ ] SSO / SAML interest (set honest expectations: coming soon, no ETA to share)
- [ ] DPA / contract needed (DPA is live at /legal/dpa; custom terms require legal review)

## Flagged Needs (fill in from above + pre-call research)
1. [Need 1]
2. [Need 2]
3. [Need 3]

## Recommended Features to Demo
*Check the boxes that apply based on qualification flags above.*

- [ ] **Pastoral Dashboard** — lead with this; it's the visual hook for any size church
- [ ] **Pastoral Care Inbox** — show the "no one falls through" workflow
- [ ] **Prayer Team Assignments** — for multi-staff or multi-campus coordination
- [ ] **Testimony Approval Queue** — if they have an active prayer culture / testimony tradition
- [ ] **Small Groups** — if multi-campus or cell-group structure
- [ ] **Live Event Prayer Wall** — if they run services, retreats, or conferences
- [ ] **Analytics & PDF Reports** — if they report to a board, elder team, or denomination
- [ ] **DPA + sub-processor transparency** — always show for denominations and large churches

## Features to Mention with Care (Coming Soon)
- Custom subdomain — on roadmap, no ETA
- SSO / SAML — on roadmap, no ETA
*Do not promise delivery dates. Say: "We're building toward that. It won't be in the initial setup, but we want to understand your timeline so we can sequence it right."*

## Suggested Calendly Agenda (20 min)
1. **0–3 min:** Intro + confirm what they submitted ("You mentioned X — tell me more about that")
2. **3–8 min:** Their current pastoral care workflow — what's breaking, what's working
3. **8–15 min:** Live product walkthrough (pastoral dashboard → care inbox → relevant add-ons)
4. **15–18 min:** Pricing conversation — "Starting at $199, we build the agreement around how you actually operate"
5. **18–20 min:** Next steps — pilot church? denomination committee? who else is in the room?

## Internal Notes
- Minimum deal size: $199/mo. Do not go below $149/mo without PM approval (Finance floor).
- If they're not ready: leave the door open. Say "The free tier is always there — 75 members, no card. Come back when the timing is right."
- Handoff SLA: Internal notification fires T+1h. Rep should attempt first contact within 24 hours of the notification. If no response from lead after 72h, touch 4 triggers automatically; rep can follow up with a personal email on day 5.
```

---

## 5. Disqualification Paths

When a church fails all four qualification triggers (under 500 members, single-site, no SSO need, no DPA need), do NOT route them to the demo form. Show a redirect message instead.

### Redirect Message (inline, before or instead of the demo form)

**Heading:** Growing Church is built for you.

**Body:**
> Based on what you told us, PrayerJar's Growing Church plan covers everything you need — unlimited members, pastoral dashboard, care inbox, prayer team assignments, testimony approval queue, and priority support — at $49/month.
>
> There's no contract and you can start free today.

**Primary CTA:** Start Growing Church — `/church/create`  
**Secondary CTA:** See all features — `/for-churches` (anchors to the tier card section)

**Tone note:** The redirect is not a rejection. The message should feel like guidance, not a gate. Avoid language like "you don't qualify" or "this plan isn't for you."

---

### If They Push Back (rep handling)

If a redirected church contacts sales directly (email or otherwise) and insists they need Network, the rep should:
1. Ask one question: "What's the thing Growing Church doesn't cover for you?"
2. If the answer is SSO, multi-site, or a contract requirement — re-enter the Enterprise flow.
3. If the answer is price — this is a Growing Church objection, not an Enterprise need. Offer annual billing ($499.80/yr = $41.65/mo) as the resolution.
4. Do not up-sell a church into Network if they don't need it. The support overhead at $199 is only justified by genuine Enterprise use cases.

---

## 6. Calendly Integration Note

**Recommended placement:** Inline widget on the thank-you step after form submission — do not redirect to Calendly.com. An inline embed keeps the session on PrayerJar, reduces drop-off, and lets us track `demo_requested` → `calendly_booked` as a funnel event (per `docs/analytics/church-funnel-spec.md`).

**Environment variable:** `CALENDLY_URL` — set this in Vercel environment variables before the UI ships. The value is the Calendly scheduling link for the sales calendar (e.g., `https://calendly.com/prayerjar/network-demo`).

**Implementation note for Frontend (pj-s17-enterprise-demo-ui):**
- After successful form submit, render the thank-you message + Calendly inline widget using Calendly's embed script.
- Set `calendly_booked = true` on the lead row via the Calendly webhook (if webhook is available) or via a Calendly redirect URL parameter.
- If `CALENDLY_URL` is not set in the environment, fall back to: "We'll reach out to schedule your call within one business day."
- The `demo_requested` funnel event should fire on form submit (before Calendly loads). The `calendly_booked` event fires separately when the booking is confirmed.

**Calendar account:** To be configured by PM. Route all Network demo bookings to the same calendar account ADMIN_EMAILS is associated with. Do not use a personal calendar.

---

## Self-Review Checklist

- [x] Price anchor matches `docs/strategy/pricing-prayerjar-2026-04.md` exactly: "Starting at $199/mo"
- [x] Qualification threshold: 500+ members OR multi-site OR denomination OR seminary OR SSO need OR DPA need
- [x] 10 form fields listed with type and required/optional marker
- [x] Field list confirmed against `docs/marketing/for-churches-copy-v2.md` §7
- [x] Automated sequence has 4 touches over 72h (T+0, T+1h, T+24h, T+72h) — exceeds the 3-touch minimum over 14 days
- [x] Each touch has trigger event, cadence, and message body
- [x] Rep brief includes qualification rubric and disqualification triggers
- [x] Handoff-to-Sales SLA: 24 hours from internal notification
- [x] SSO / SAML mentioned only with "coming soon" qualifier — no delivery date given
- [x] Custom subdomain mentioned only with "coming soon" qualifier — no delivery date given
- [x] No SLA or dedicated account manager language
- [x] DPA and sub-processor pages referenced as trust signals (both are live)
- [x] Disqualification path redirects warmly to Growing Church, not to a dead end
- [x] Calendly embed recommended (inline, not redirect); `CALENDLY_URL` env var named
- [x] No claims about features not currently shipped
- [x] All outreach copy labeled DRAFT or template — no content goes live without human approval
- [x] Demo floor noted ($149/mo minimum without PM approval)
