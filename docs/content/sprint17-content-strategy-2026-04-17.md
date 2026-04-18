# Sprint 17 — Content Strategy for Church SEO & Pipeline

**Date:** 2026-04-17
**Author:** Content agent
**Context:** Downstream of Growth's `/for-churches` SEO audit and Research's competitor pricing report. Ron is solo — this plan has to be batch-writable, template-able, and compounding.

---

## 1. Current content inventory

Long-form content today (all under `src/app/(public)/`):

- `/docs/churches` — "Church Admin Guide," 8 sections, server-rendered w/ metadata. Useful but it's product docs, not top-of-funnel SEO.
- `/docs/features`, `/docs/guide`, `/docs/paid` — tier/product docs; `/docs/paid` has an FAQ component.
- `/help`, `/about`, `/trust`, `/partners`, `/press`, `/privacy`, `/terms` — institutional.
- `/for-churches` — inline "Common questions" FAQ.

**Missing:** `/blog`, `/case-studies`, `/resources`, `/testimonials`, `/compare`, pastor-facing FAQ. Zero content targeting Growth's keywords.

---

## 2. Blog post titles — 10-15, priority-ranked

Priority = (search intent strength) x (1 / competitive difficulty) x (PrayerJar fit). Keywords mapped to Growth's list.

| # | Title | Primary keyword | Diff. | Why it matters |
|---|-------|-----------------|-------|----------------|
| 1 | How to Start an Online Prayer Wall for Your Church (2026 Guide) | online prayer wall for church | Med | ChurchTrac ranks here with one article; beatable with depth. Pillar-adjacent. |
| 2 | Private vs Public Prayer Walls: Which Does Your Church Need? | private prayer wall for church | Low-Med | Directly targets PrayerJar's #1 differentiator keyword. |
| 3 | Live Prayer Wall Displays for Sunday Service: A Setup Guide | live prayer wall display for church service | Low | Growth flagged this as the #1 rankable term in 60 days. Pro-tier feature moat. |
| 4 | The Pastor's Guide to Managing Prayer Requests Digitally | prayer request management software | Med | B2B phrasing pastors use in ChMS eval docs. |
| 5 | 7 Prayer Request App Options for Churches (Honest Comparison) | church prayer request app | Med-High | Comparison posts rank. Honest = credibility; include ourselves fairly. |
| 6 | How AI Helps Pastors Spot Urgent Prayer Needs (Without Breaking Confidence) | AI prayer request triage church | Low | New category; PrayerJar can define it. |
| 7 | Planning Center + Prayer Walls: What Integrates, What Doesn't | planning center prayer | Low | Growth/Research both flagged PCO as wedge. Captures intent. |
| 8 | Church Prayer Chain Software in 2026: What Replaced Email Chains | church prayer chain software | Med | Older phrasing, still searched. Prayer Chain Online is weak incumbent. |
| 9 | Free Prayer Wall Options for Small Churches (and When You Outgrow Them) | free prayer wall for church | Med | Price-sensitive intent; funnels into Starter. |
| 10 | How to Set Prayer Wall Privacy for Members Only | private prayer group app church | Low | Long-tail, exact pastor question. |
| 11 | Pastoral Care Without Burnout: Systems for Tracking Prayer Follow-Up | prayer team management software | Med | Pastoral-care-lead persona match. |
| 12 | Why Your Church Prayer App Keeps Feeling Empty (and How to Fix It) | church prayer app engagement | Low | Problem-aware content; links to Pro features. |
| 13 | Church Prayer Wall Software Compared: PrayerJar vs PrayerMate vs Uplift | church prayer wall software | Med | Primary keyword; comparison format ranks well. |
| 14 | Digital Prayer Wall Etiquette: 10 Rules Your Church Should Set | digital prayer wall church | Low | Informational, link-bait, easy to batch-write. |
| 15 | Exporting Your Church's Prayer Data: What Pastors Should Demand | church prayer data export / GDPR | Low | Trust signal; differentiates from closed-data competitors. |

**Cadence:** 2 posts/month. Posts 1-6 = Q1, covering every primary/secondary keyword. One template (H1 / TL;DR / 3-5 H2s / bullet checklist / CTA to `/for-churches`); 3-4 hrs per post.

---

## 3. Pillar pages — 3 proposals

Evergreen 1500-2500 word resources, each exports `metadata`, internally linked from every related blog post.

1. **`/resources/church-prayer-wall-guide`** — "The Complete Guide to Church Prayer Walls." Primary kw: `church prayer wall software`. Absorbs posts #1, #2, #14.
2. **`/resources/pastoral-prayer-care`** — "Pastoral Prayer Care: A Framework for Small and Mid-Size Churches." Targets pastoral-care intent without beating CareNote/Notebird head-on. Absorbs #4, #11.
3. **`/resources/planning-center-prayer-integration`** — captures PCO-intent search today; positions PrayerJar as ChMS-literate per Research rec #3. Absorbs #7.

Optional 4th: `/resources/live-event-prayer-wall-playbook` — Pro-tier sales asset for post #3.

---

## 4. Case study + testimonial plan

**Today:** zero testimonials. Growth flagged as top-5 CRO gap.

**Collection (Ron solo):** At day 30 on any tier, trigger a 3-question Typeform/in-product prompt: "Before PrayerJar? What surprised you? Would you recommend, and to whom?" Target 3 case studies in Sprint 17-18 — one per persona: small/free, mid/Starter-Pro, live-event/Pro.

**Format (template-able):** Church name + photo; size/denomination/location; pull quote (<25 words); Before / After / Metric sections; single CTA.

**Placement:** Homepage rotating strip above fold; `/for-churches` full block above pricing (fixes Growth §4.3); `/case-studies/[slug]` index + detail, added to sitemap.

---

## 5. Email drip sequence outline (topics only)

Two sequences, sent via the transactional provider already wired for auth emails.

**Sequence A — New free-tier admin (day 0 signup):**
- Day 0: Welcome + invite-link template.
- Day 2: 3 ways pastors kick off a prayer wall (links post #1).
- Day 5: Private by design — who sees what (links post #2, #1 pastor objection).
- Day 10: What members actually post (nudge-the-admin).
- Day 21: Ready for your first Sunday service wall? (Pro intro, links post #3.)

**Sequence B — Free-tier at 30 days (upgrade nudge):**
- Day 30: Approaching the 25-member limit — what Starter adds.
- Day 37: Small-church case study.
- Day 45: Offer — 2 months free on annual (pending Research rec #2).
- Day 60: Personal email from Ron.

9 emails, <150 words each, reusable quarterly.

---

## 6. Enterprise sales collateral

One-page PDFs in `docs/content/sales-collateral/`, sent manually by Ron.

1. **"What is PrayerJar Enterprise?"** — who it's for (multi-campus, 2000+), what's included (SSO, SLA, CSM, DPA, PCO sync), pricing posture, next step.
2. **Competitor comparison one-pager** — PrayerJar vs PrayerMate vs Subsplash vs Pushpay. Feature grid, honest about where competitors win.
3. **Security & data one-pager** — residency, retention, export, deletion. Links `/trust`. *(Sprint 18.)*
4. **Live Event Prayer Wall setup sheet** — Pro-tier enablement + delivery. *(Sprint 18.)*

Sprint 17 blockers: #1 and #2.

---

## 7. Sprint 17 — tasks to add

- **C-1: `/resources` route + pillar page `church-prayer-wall-guide`.** Owner: Frontend + Content (copy). Size: M. Server component, exports metadata, sitemap entry, internal link from `/for-churches`. Success: indexed in 14 days.
- **C-2: Blog posts #1, #2, #3 via `/resources/blog/[slug]`.** Owner: Content drafts + Frontend builds. Size: M. Shared template; staggered weekly across sprint. Success: all three indexed, each links the pillar.
- **C-3: Collect + publish 2 case studies under `/case-studies/[slug]`.** Owner: Content (Ron outreach) + Frontend (route + testimonial strip on homepage and `/for-churches` above pricing). Size: M.
- **C-4: Drip sequence A (5 welcome emails) + "What is Enterprise?" one-pager PDF.** Owner: Content drafts + Backend sends. Size: S-M. Drip DRAFT — awaiting human approval.

---

**Status:** DRAFT — awaiting PM approval before C-1 through C-4 are created in `.agent-state/tasks.json`.
