# Sprint 17 — Churches & Ministries Compliance Review
**Date:** 2026-04-17
**Reviewer:** Legal agent
**Scope:** Legal/compliance gaps in the churches & ministries product surface.

This requires real legal counsel before any enterprise church contract is signed, any nonprofit verification flow ships, or the DPA is published. I can draft starting points but they should not go live without attorney review.

---

## 1. Legal liabilities (fix now)

- **Pricing claim mismatch — Pastoral Dashboard.** The pricing card (`src/lib/plans.ts`) lists Pastoral Dashboard under **Pro only**, but the for-churches FAQ states "Admins and pastors on **Starter and Pro** get a dedicated dashboard." The dashboard route (`src/app/(church)/church/[slug]/dashboard/page.tsx`) is gated only by member role, **not by plan tier**. Three versions of the truth. This is exactly the fact pattern that triggers deceptive-practices claims under FTC Act §5 and state consumer-protection laws. Pick one answer (I recommend Starter+Pro, since the code already allows it), reconcile all three surfaces, and add a regression test.
- **"AI-Flagged Care" with no disclaimer.** `src/services/ai.service.ts` moderates with `claude-haiku-4.5` and **explicitly fails open after an 8s timeout**. Marketing says prayers in crisis "are automatically surfaced… before anyone falls through the cracks." If a crisis prayer is missed and a user self-harms, plaintiff's counsel will put that sentence on a screen next to the fail-open comment. Add a plain-language disclaimer on the feature card and in ToS: AI assists moderation but is not a substitute for pastoral judgment; the platform is not a crisis service; direct crisis users to 988/Crisis Text Line. The `trust` page already does part of this well — mirror its language on the for-churches page.
- **ToS has no limitation of liability, indemnity, or governing-law clause.** `src/app/(public)/terms/page.tsx` is a four-paragraph consumer ToS. For B2B sale to churches, this is inadequate. At minimum: LoL cap, mutual indemnities, governing law/venue, warranty disclaimer for the AI feature, and a clause that the church is solely responsible for pastoral decisions.
- **Privacy policy does not name prayer content as sensitive pastoral data.** Current policy treats prayer content generically. Prayer requests routinely include health, grief, abuse, addiction — categories that are "special" under GDPR Art. 9 and sensitive under CCPA/CPRA. Add an explicit section: we treat prayer content as sensitive; we do not use it for training, advertising, or any secondary purpose; retention is 30 days active + expired-state handling.

## 2. Gaps blocking enterprise/medium-church sales

- **No Data Processing Agreement.** `docs/legal/` didn't exist before this review. Any church with a privacy-literate board member, any diocese, any multi-site church, and any EU/UK mission partner will ask for a DPA. Need a DPA that designates **church = controller, PrayerJar = processor**, with sub-processor list (Resend, hosting, AI gateway), SCCs for EU transfers, breach notification SLA, and audit rights.
- **No sub-processor list / trust page for churches.** The public `/trust` page is consumer-oriented. Enterprise buyers want a page listing every sub-processor (Resend, Vercel/hosting, Anthropic via AI gateway, Stripe) with purpose and region.
- **SSO/SAML is advertised on Enterprise but not implemented.** Grep found zero SSO/SAML code. Selling Enterprise with SSO without building it is misrepresentation. Either build it before taking Enterprise orders or change the Enterprise page to "SSO on roadmap — contact us" and require a signed order form before any commitment.
- **No nonprofit / 501(c)(3) verification or discount.** Churches expect this. Absent verification, a for-profit wedding-venue LLC calling itself "Grace Ministry" gets the same price as a real 501(c)(3). Add a verification step (TechSoup, Percent, or manual EIN + IRS determination-letter upload).
- **Invoices insufficient for nonprofit accounting.** Confirm Stripe invoices include church legal name, EIN field, itemized line items, and a downloadable PDF archive. Finance directors need this at audit time.

## 3. Future cost (not blocking now, but track)

- **COPPA.** ToS says 13+. Youth ministry is a natural expansion; the moment an under-13 user is knowingly onboarded, COPPA applies (verifiable parental consent, limited data collection). Decide now whether to explicitly exclude under-13 or build consent flow.
- **International.** GDPR (EU), UK-GDPR, PIPEDA (Canada), LGPD (Brazil), Australian Privacy Act. Minimum viable posture: DPA with SCCs, data-subject-request workflow, breach notification within 72 hours, EU representative if EU marketing starts.
- **Right-to-erasure completeness.** Export endpoint exists (`/api/v1/export`). Confirm deletion is cascading (prayers, interactions, church memberships, moderation logs, AI-generated tags) and documented. Partial deletion is a GDPR Art. 17 violation.

## 4. Sprint 17 tasks to add

**Critical (ship-blockers for church push):**
1. Reconcile Pastoral Dashboard tier claim across `plans.ts`, for-churches page, FAQ, docs; add regression test.
2. Add "AI assists, not substitute" disclaimer to AI-Flagged Care marketing + ToS + feature UI.
3. Rewrite ToS for B2B: LoL cap, indemnities, governing law, AI disclaimer, pastoral-responsibility clause. **Attorney review required.**
4. Update privacy policy to name prayer content as sensitive pastoral data; explicit no-training/no-secondary-use commitment.
5. Publish sub-processor list at `/trust/subprocessors` (or similar).

**Should (sales enablers):**
6. Draft Data Processing Agreement; publish at `/legal/dpa`. **Attorney review required.**
7. Either build SSO/SAML for Enterprise or reword the Enterprise tier to "on request / roadmap."
8. Ship 501(c)(3) verification flow + nonprofit discount SKU.
9. Verify Stripe invoices meet nonprofit accounting requirements (legal name, EIN, itemization).

**Nice-to-have:**
10. Document data-subject-request runbook (access, deletion, portability, rectification).
11. Confirm account deletion cascades across all prayer-adjacent tables; add integration test.
12. Decide COPPA posture; update ToS accordingly.
