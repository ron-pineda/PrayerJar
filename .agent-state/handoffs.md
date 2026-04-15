[2026-04-15] Database Engineer → Backend Engineer: pj-s13-admin-p1-schema — 3 tables (moderation_logs, admin_actions, contact_submissions) + enums added to src/db/schema.ts, migration 0025_oval_quasar.sql generated. Backend can now implement auth helpers and service layer.
[2026-04-15] PM → Planning: Sprint 12 planned — 5 proposed tasks: fix-double-interaction (high), fix-sse-polling (high), prayer-deletion (medium), fire-forget-side-effects (medium), claim-link (medium, moved from s11, held)
[2026-04-15] Backend → Done: pj-s11-fix-moderation-timeout, pj-s11-fix-browse-own-prayers, pj-s11-fix-pray-for-another-loop, pj-s11-fix-google-oauth-createuser — four prod bug fixes committed c6b7a4b + db01d5e, all deployed
[2026-04-14] Full Stack → Done: pj-s8.5-4 — Church member invite flow — join page, server action, copy-link component, team page invite section all complete
[2026-04-11] Frontend → Reviewer: pj-s2.3-37 + pj-s2.3-38 + pj-s2.3-39 -- groups pages, group wall, activity feed
[2026-04-11] Backend → QA: pj-s2.2-35 — rework complete, ready for re-QA
[2026-04-11] Backend → QA: pj-s1.3-28 — rework complete, ready for re-QA
[2026-04-11T04:00:00.000Z] Backend Engineer → PM: pj-002 DONE — prayerjar.org live. Domain (Porkbun) → Vercel domains + Resend DNS configured, click tracking disabled, AUTH_EMAIL_FROM set to noreply@prayerjar.org, auth.ts back on Resend API provider. Resend domain verification pending at deploy time — sign-in email sender should switch from onboarding@resend.dev to noreply@prayerjar.org once verified.
[2026-04-11T03:00:00.000Z] Backend Engineer → PM: pj-004 DONE — sign-in fixed. Root cause: Resend click tracking domain (us-east-1.resend-clicks.com) down. Switched to Nodemailer SMTP, then text-only email, then back to Resend API with click tracking disabled on custom domain. Also fixed: provider ID mismatch, missing redirectTo, Base UI error #31 (DropdownMenuLabel outside Group).
[2026-04-10T21:52:00.000Z] Backend Engineer → PM: pj-001 DONE — deploy workflow verified (run 24265781881, 1m24s, all green). Push to feature/prayer-jar now auto-deploys to production.
[2026-04-10T00:01:00.000Z] Backend Engineer → PM: pj-001 — created .github/workflows/deploy.yml. Triggers on push to feature/prayer-jar, uses vercel build --prod + deploy --prebuilt pattern. Blocked on human adding VERCEL_TOKEN secret to GitHub repo (vercel.com/account/tokens → Repo Settings → Secrets → VERCEL_TOKEN). Once added, commit and push the workflow file to activate.
[2026-04-10T00:00:00.000Z] PM onboarded PrayerJar into dashboard. Project is post-launch (all 19 original tasks + Phase 1 improvements + Church Finder + Lights redesign + Know Jesus page complete). Live at https://prayer-jar.vercel.app/. 3 known pending items added as tasks pj-001 through pj-003.
[2026-04-11T12:41:56.447Z] Human approved: pj-s0.1-7 — Empty state design — all dashboard and list pages
[2026-04-11] Database → Backend: pj-s1.3-27 + pj-s1.3-29 — checkIns and griefDates tables added, migration generated at 0006
[2026-04-11] AI Engineer → Frontend: pj-s1.3-30 — generateEncouragement() implemented in ai.service.ts, ready for guided-prayer.tsx wiring
[2026-04-11] Backend → QA: pj-s1.3-27 + pj-s1.3-28 + pj-s1.3-29 — check-in API, intercessor care cron, grief anniversaries cron — ready for QA
[2026-04-11] Database → Backend+Frontend: pj-s2.1-31 + pj-s2.1-32 — prayerPartnerships and partnerMessages tables added, migration 0007 generated
[2026-04-11] Frontend → Reviewer: pj-s1.3-27 + pj-s1.3-30 — check-in-pulse.tsx and encouragement in guided-prayer — ready for review
[2026-04-11] Reviewer → done: pj-s1.3-27 Anonymous check-ins (7-day pulse)
[2026-04-11] Reviewer → done: pj-s1.3-30 Scripture with encouragement — AI-generated in guided prayer
[2026-04-11] QA → Reviewer: pj-s1.3-27 Anonymous check-ins (7-day pulse) — passed QA
[2026-04-11] QA → Architect: pj-s1.3-28 Care for the intercessor — thank-you email — REWORK: cron route sends email via inline new Resend() instead of email.service.ts sendEmail() as required by acceptance criteria
[2026-04-11] QA → Architect: pj-s1.3-29 Grief anniversaries — remembrance email — REWORK: grief date picker + label field on prayer submission form never built (criterion 3 unmet); assign to Frontend Engineer
[2026-04-11] QA → Reviewer: pj-s1.3-28 Care for the intercessor — thank-you email — re-QA passed
[2026-04-11] QA → Reviewer: pj-s1.3-29 Grief anniversaries — remembrance email — re-QA passed
[2026-04-11] Reviewer → done: pj-s1.3-28 Care for the intercessor — thank-you email
[2026-04-11] Reviewer → done: pj-s1.3-29 Grief anniversaries — remembrance email + form
[2026-04-11] Backend → QA: pj-s2.1-31 + pj-s2.1-32 + pj-s2.1-33 — partner service, matching cron, message APIs, extend/end APIs

[2026-04-11] Frontend → Reviewer: pj-s2.1-32 + pj-s2.1-33 — partner dashboard, message thread, extend/end flow
[2026-04-11] Reviewer → done: pj-s2.1-32 Partner encouragement exchange
[2026-04-11] Reviewer → Architect: pj-s2.1-33 Extend / re-match flow — REWORK: (1) EndPartnershipButton redirects to /dashboard?toast=partnership_ended but /dashboard does not exist and the param is never read — toast is silently dropped; needs product decision on redirect destination and toast wiring. (2) MobileNav is now 7 items on a 375px bar — recommend dropping Church link from bottom nav.
[2026-04-11] QA → Reviewer: pj-s2.1-31 Prayer partner matching — passed QA
[2026-04-11] QA → Reviewer: pj-s2.1-32 Partner encouragement exchange — passed QA (backend criteria confirmed; already marked done by Reviewer)
[2026-04-11] QA → Architect: pj-s2.1-33 Extend / re-match flow — REWORK: backend APIs all pass; rework is frontend-only (redirect destination invalid, toast param unread, MobileNav overflow)
[2026-04-11] Frontend → Reviewer: pj-s2.1-33 — rework complete, ready for re-review
[2026-04-11] Reviewer → done: pj-s2.1-33 Extend / re-match flow
[2026-04-11] Database → Backend+Frontend: pj-s2.2-34 + pj-s2.2-35 — prayerAdoptions, prayerChains, chainParticipants added, migration 0009 generated
[2026-04-11] Backend → QA: pj-s2.2-34 + pj-s2.2-35 + pj-s2.2-36 — adoption service/APIs, chain service/APIs, SSE praying-now
[2026-04-11] Frontend → Reviewer: pj-s2.2-34 + pj-s2.2-35 + pj-s2.2-36 — adopt button, prayer chain, praying now counter
[2026-04-11] QA → Reviewer: pj-s2.2-34 Adopt a prayer — passed QA
[2026-04-11] QA → Architect: pj-s2.2-35 Prayer chains (24hr coverage) — REWORK: participants endpoint (GET /api/v1/chains/[id]/participants) is public/unauthenticated but returns users.name (full name) aliased as nameInitial — full names must not be exposed publicly; either truncate to initial in getChainParticipants() or add auth guard
[2026-04-11] QA → Reviewer: pj-s2.2-36 Praying Now live counter — passed QA
[2026-04-11] Reviewer → done: pj-s2.2-34 Adopt a prayer
[2026-04-11] Reviewer → Architect: pj-s2.2-35 — REWORK confirmed: chain.service.ts line 51 selects users.name aliased as nameInitial; public participants endpoint returns full user name verbatim to any unauthenticated caller. Fix: truncate to first character (users.name.charAt(0)) in the service or route. Backend Engineer owns fix.
[2026-04-11] Reviewer → done: pj-s2.2-36 Praying Now live counter
[2026-04-11] QA → Reviewer: pj-s2.2-35 — re-QA passed, ready for final review
[2026-04-11] Reviewer → done: pj-s2.2-35 Prayer chains
[2026-04-11] Database → Backend+Frontend: pj-s2.3-37 + pj-s2.3-38 -- groups, groupMembers, groupId on prayers added, migration 0010 generated
[2026-04-11] Backend → QA: pj-s2.3-37 + pj-s2.3-38 + pj-s2.3-39 -- group service/APIs, group prayer APIs, public feed fix, activity service
[2026-04-11] QA → Reviewer: pj-s2.3-37 Self-created groups — passed QA
[2026-04-11] QA → Reviewer: pj-s2.3-38 Private group prayer wall — passed QA
[2026-04-11] QA → Reviewer: pj-s2.3-39 Group activity feed — passed QA
[2026-04-11] Reviewer → done: pj-s2.3-37 Self-created groups
[2026-04-11] Reviewer → done: pj-s2.3-38 Private group prayer wall
[2026-04-11] Reviewer → done: pj-s2.3-39 Group activity feed
[2026-04-11T22:29:08Z] Dashboard sync — Sprint 3.1 (Prayer Map) done, Sprint 3.2 (Shareable Moments) in progress
[2026-04-11T23:11:42Z] Dashboard sync — Sprint 3.2 (Shareable Moments) done

[2026-04-12T00:14:46Z] Dashboard sync — Sprint 3.3 (Feedback & Compliance) done — 5 tasks back-filled (pj-s3.3-46 through pj-s3.3-50)
[2026-04-12T00:24:05Z] Dashboard sync — Sprint 4.1 (Donations) kicked off — 4 tasks created (pj-s4.1-51 through pj-s4.1-54), status: approved, ready for engineers
[2026-04-12T00:49:57Z] Dashboard sync — Sprint 4.1 (Donations) done — all 4 tasks marked complete, code verified
[2026-04-12T01:56:58Z] Dashboard sync — Sprint 4.2 (Subscription Infrastructure) done — all 4 tasks marked complete, code verified
[2026-04-12T02:07:13Z] Dashboard sync — Sprint 5.1 (Church Foundation) back-filled, 5 tasks added (pj-s5.1-59 through pj-s5.1-63)
[2026-04-12T03:18:14Z] Dashboard sync — Sprint 5.1 done (all files verified), Sprint 5.2 back-filled 5 tasks

[2026-04-12T03:37:49.710Z] Dashboard sync — 5 fix(es): pj-s5.2-64: in-progress → done (all sprint files present); pj-s5.2-65: approved → done (all sprint files present); pj-s5.2-66: approved → done (all sprint files present); pj-s5.2-67: approved → done (all sprint files present); pj-s5.2-68: approved → done (all sprint files present)
[2026-04-12T04:23:06Z] Dashboard sync — Sprint 5.2 done (files verified), Sprint 5.3 tasks created (pj-s5.3-69 through pj-s5.3-72)

[2026-04-12T04:26:49.957Z] Dashboard sync — 4 fix(es): pj-s5.3-69: approved → done (files present: page.tsx, pastoral.service.ts); pj-s5.3-70: approved → done (files present: page.tsx); pj-s5.3-71: approved → done (files present: page.tsx); pj-s5.3-72: approved → done (files present: page.tsx)
[2026-04-12T04:28:22Z] Dashboard sync — Sprint 5.3 done, all files verified
[2026-04-12T04:38:23Z] Dashboard sync — Sprint 5.4 (Live Events) tasks created, in progress

[2026-04-12T04:46:16.231Z] Dashboard sync — 4 fix(es): pj-s5.4-73: approved → done (files present: route.ts, church-digest.tsx); pj-s5.4-74: approved → done (files present: page.tsx); pj-s5.4-75: approved → done (files present: church-analytics.service.ts); pj-s5.4-77: approved → done (files present: route.ts)

[2026-04-12T05:00:44.613Z] Dashboard sync — 4 fix(es): pj-s5.4-78: approved → done (files present: page.tsx, event.service.ts); pj-s5.4-79: approved → done (files present: route.ts); pj-s5.4-80: approved → done (files present: page.tsx); pj-s5.4-82: approved → done (files present: post-event-cta.tsx)

[2026-04-12T12:53:01Z] Dashboard sync — Sprint 5.4 closed (pj-s5.4-81 done); Sprint 5.5 (Church Onboarding) back-filled, 3 tasks done (pj-s5.5-83 through pj-s5.5-85); Sprint 6.1 (Audio & Media) created, 2 tasks in-progress (pj-s6.1-86, pj-s6.1-87)
[2026-04-12T15:27:43Z] Dashboard sync — Phase 6 complete: 6.1 closed (2 tasks done); 6.2 (Native App Wrapper) back-filled 1 task done (pj-s6.2-88); 6.3 (Partnerships) back-filled 4 tasks done (pj-s6.3-89 through pj-s6.3-92)

[2026-04-12T15:56:21.000Z] Dashboard sync — 1 fix(es): pj-test-sync: → done (git: Sprint 6.1 committed)

[2026-04-13T12:00:00Z] PM → Architect: UX audit complete. 12 tasks created across Sprint 7.1 (4 critical fixes) and Sprint 7.2 (8 UX improvements). Plan at .claude/plans/2026-04-13-ux-audit-fixes.md. All tasks proposed, awaiting approval.
[2026-04-13T13:00:00Z] PM: Plan revised — /pricing renamed to /for-churches (footer-only, ministry-first framing). Added 2 tasks: feedback widget overlap fix (pj-s7.1-5) and mobile nav 5-item rebalance (pj-s7.1-6). Sprint 7.1 now has 6 tasks.
[2026-04-13T14:00:00Z] PM: Added 2 more tasks after ministry-tone review — pj-s7.2-9 (hide billing from non-church users) and pj-s7.2-10 (press kit live stats). Total: 16 tasks across 7.1 and 7.2.

[2026-04-13T21:56:56.198Z] Dashboard sync — 0 fix(es): 

[2026-04-15] Architect → PM: Sprint 13 planned — Platform Admin Dashboard, 16 tasks across 5 phases, plan at docs/superpowers/plans/2026-04-15-admin-dashboard-plan.md. 3 open questions flagged (moderation-site scope, cron path, enum additions). Awaiting PM approval.
[2026-04-15] Architect → Database Engineer: pj-s13-admin-p1-schema Phase 1 — add 3 tables + enums to src/db/schema.ts, generate migration 0025_admin_dashboard.sql. Recommended kickoff task.
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p1-auth-helpers Phase 1 — extract requireAdmin to src/lib/admin-auth.ts (notFound not throw) + src/lib/env.ts startup assertion.
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p1-proxy-404 Phase 1 — src/proxy.ts 404 instead of redirect + admin rate-limit window.
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p2-service Phase 2 — moderation-log.service + snippet-purge cron.
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p2-wire-sites Phase 2 — wire logModerationRejection into 7 rejection sites (spec listed 5; grep found 7).
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p3-contact Phase 3 — persist contact submissions before Resend send.
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p4-backend Phase 4 — admin read helpers + audit-log existing report actions + new admin actions.
[2026-04-15] Architect → Frontend Engineer: pj-s13-admin-p4-ui Phase 4 — admin layout + overview + moderation + feedback pages.
[2026-04-15] Architect → Backend Engineer: pj-s13-admin-p5-notify Phase 5 — notifyAdmins helper + 3 triggers (selfHarm, harassment, contact).
[2026-04-15] Architect → QA: pj-s13-admin-p1-qa through pj-s13-admin-p5-qa — phase-gated QA, one per phase.
[2026-04-15] Architect → Reviewer: pj-s13-admin-reviewer — final cross-phase review.
[2026-04-15] Backend Engineer → QA: pj-s13-admin-p1-auth-helpers — requireAdmin/withAdmin helpers + proxy 404 + env assertion ready for security verification
[2026-04-15] Backend Engineer → QA: pj-s13-admin-p2-wire-sites — logModerationRejection wired at 7 sites, service layer complete
[2026-04-15] Backend Engineer → QA: pj-s13-admin-p3-contact — contact persistence + cron purge route ready for verification
