[2026-04-26] Various → done: pj-s23-pro-tier-pdf-copy-fix (plans.ts copy), pj-s23-jar-mark-png-script-sync (dual-write), pj-s23-chms-group-membership-reconcile (stale member delete + 7 tests). Commits 4eace71, 3131b0f.
[2026-04-21] Backend → QA: pj-s23-subdomain-auth-flow — in review (commits a10d724, 8621b4c). QA must test magic-link sign-in from subdomain end-to-end: verify browser stays on <sub>.prayerjar.org after callback, session cookie Domain is the subdomain, and /wall loads while signed in.
[2026-04-20] Reviewer → PM: pj-s22-22 Sprint 22 closed — 9 tasks shipped, 12 deferred, 4 Ron actions in INBOX.md
[2026-04-20] QA → Reviewer: pj-s22-17 subdomain QA complete — static cases PASS, DNS cases pending Ron action
[2026-04-20] QA → Reviewer: pj-s22-18 PCO group QA complete — PASS. 5/5 unit tests pass, 4 code-review checks clean, 3 CANNOT_VERIFY (build-blocked), stale-membership gap documented for Sprint 23. pj-s22-08 → done.
[2026-04-20] Copywriter → QA: pj-s22-21 Network-tier copy reposition — in review
[2026-04-20] QA → Reviewer: pj-s22-19 PCO summary QA complete — PASS
[2026-04-20] Integrations → QA: pj-s22-09 PCO summary scheduler — in review, ready for pj-s22-19
[2026-04-20] Integrations → QA: pj-s22-08 PCO group persistence — in review, ready for pj-s22-18. Migration 0031_chms_groups.sql. Limitation: stale membership removal not implemented (deferred). Two-table model note: groups.externalChmsId from Sprint 18 is unused/separate.
[2026-04-20] Backend → QA: pj-s22-16 subdomain routing — in review, ready for pj-s22-17. Ron must complete subdomain-launch-checklist.md before DNS-dependent tests. Note: API matcher (proxy.ts config) excludes /api paths — x-pj-church-id header not injected for API requests; handlers read Host directly if needed.
[2026-04-20] Backend+Copywriter → QA: pj-s22-03 Free cap 50→75 + pj-s22-04 hero/PCO copy — in review
[2026-04-20] Architect → Backend: pj-s22-05 subdomain design revised — SSO deferred, per-subdomain auth model documented, ready for pj-s22-16 implementation
[2026-04-20] Reviewer → PM: pj-s22-01 drizzle-pipeline — approved with Ron dry-run action pending
[2026-04-20T03:03:47Z] Reviewer → Human: pj-s22-24 — APPROVED, ready to deploy on next push. 2 Sprint-23 follow-ups recorded (pj-s23-clay-token-alpha-tune, pj-s23-jar-mark-png-script-sync) — both low-priority observations, not blockers.
[2026-04-20T03:03:47Z] Reviewer → (self): pj-s22-24 — starting final review
[2026-04-20T03:15:00.000Z] QA → Reviewer: pj-s22-24 — clay vessel verified. 12/13 criteria PASS; visual regression UNVERIFIABLE (build fails on missing ADMIN_EMAILS env, dev server blocked by Windows Sentry+Turbopack issue). Ron must eyeball on next local session or Vercel preview. tsc/eslint clean on the 8 changed files; 5 failing test files are all pre-existing Stripe/DB-mock issues unrelated to jar/mark/sign-in/error/not-found.
[2026-04-20T03:00:00.000Z] QA → (self): pj-s22-24 — starting verification
[2026-04-19] PM/Ron → Frontend Engineer: pj-s22-24-frontend-jar-swap APPROVED — implement clay vessel per docs/design/clay-vessel-spec.md. 13 acceptance criteria, 8 target files, spec §14 has sequenced checklist. Out-of-scope items in spec §13 are Sprint 23.
[2026-04-19] Designer → Frontend Engineer: pj-s22-23 — Clay vessel brand review APPROVED-WITH-CHANGES. Spec at docs/design/clay-vessel-spec.md. Clay is an on-brand upgrade over glass across all §3 voice attributes. Resolves Sprint-18-deferred two-amber tension: lights = OKLCH --primary, body = new --clay-* tokens, rgba(212,168,67) literals retired. Mark swap extended to 4 sites (nav+email+error+404) via new <PrayerJarMark> SVG. sm size bumped 100→170px (clay textures don't survive below 170). mode='slips' collapses to lights silently (API preserved). Follow-up task pj-s22-24-frontend-jar-swap created (proposed, awaiting PM/Ron approval).
[2026-04-19] DevOps → QA: pj-s22-01-drizzle-pipeline — wired drizzle migrate into deploy.yml (new step between vercel build + vercel deploy, gated VERCEL_ENV=production). Strategy: journal-seed via scripts/migrate-deploy.mjs on first prod run (creates drizzle schema + table, inserts 32 rows matching reality, then migrate no-ops). Repaired meta/_journal.json (added 0012_trigram_search, 0029, 0030). Dry-run at scripts/migrate-dry-run.mjs — verified against dev DB (27 rows, reports 5 pending matching known drift). Prod dry-run NOT run (no creds this session). Known gotcha documented: 0012_trigram_search uses CREATE INDEX CONCURRENTLY, breaks fresh-DB runs. docs/ops/deploy-migrations.md covers all. No prod DDL executed.
[2026-04-19] DevOps → QA: pj-s22-02-vercel-webhook — false-alarm recurrence; webhook was never broken (gh run list shows latest deploy succeeded 2m21s). Bumped checkout v4->v5, added failure-alert GitHub issue step, wrote docs/ops/vercel-deploy.md. Surfaced CHMS_CONFIG_ENCRYPTION_KEY missing in Vercel as separate PM follow-up.
[2026-04-19] Ron → PM: Sprint 22 scoping kickoff — make PrayerJar ready for Large-church marketing (10-item scope)
[2026-04-19] PM → Human: pj-hotfix-claim-reconcile shipped — 3 Pro-tier claims reconciled. Fix commit 26ab653 (for-churches/page.tsx, 3 lines), brief at docs/sprint21/copy-briefs/for-churches-claim-reconcile.md. Copywriter → Frontend → QA PASS → Reviewer APPROVED. Not deployed — user runs `vercel --prod` per session-recent CLI workaround.
[2026-04-19] PM → Human: Sprint 21-review closed — tier ladder HOLD, channel GO-WITH-CONDITIONS, three Pro-tier marketing claims (PDF reports, PCO group sync, PCO weekly summary) need stripping same-day and build-vs-remove scoping in Sprint 22. Deliverable: docs/church-review/recommendations.md (commit 779e5e3).
[2026-04-19] Strategist → PM: pj-s21r-04 synthesis complete — Tier ladder HOLD, Channel GO-WITH-CONDITIONS (3 Pro-tier ship-stopper claims must be stripped/shipped; Large segment HOLD pending SSO+subdomain), top rec = reconcile PDF/PCO-group-sync/PCO-weekly-summary claims. See docs/church-review/strategist-synthesis.md.
[2026-04-19] Research → Strategist: pj-s21r-01 DELTA DONE — 1 material change since 2026-04-17 (Breeze $67→$72/mo, indirect ChMS competitor). Direct prayer set unchanged; no new entrants; PCO still category-unique. HOLD ladder. See docs/church-review/research-findings.md.
[2026-04-19] CustomerSuccess → Strategist: pj-s21r-03 FIT RUBRIC DONE — Small=CONDITIONAL YES, Medium=YES, Large=NO-today. See docs/church-review/customersuccess-findings.md.
[2026-04-19] Controller → Research/Architect/CustomerSuccess: pj-s21r-01, -02, -03 dispatched in parallel. User approved PM kickoff plan. Strategist (-04) + PM (-05) gated on all three.
[2026-04-18] PM → Team: pj-s20-14 Sprint 20 CLOSED. All 10 pages refreshed, banned phrases cleared, brand voice consistent. See docs/sprint20/sprint-close.md.
[2026-04-18] Controller → Reviewer: pj-s20-09 /help rework + pj-s20-11 /docs rework — banned phrases cleared per PM ruling (spec §4 wins over light-pass scope). 3 one-line rewrites applied inline. Commit 3be08c0. Both back to review; all 10 page tasks now clean for final approval.
[2026-04-18] Designer → Reviewer: pj-s20-02, pj-s20-03 — spot-check complete, findings at docs/sprint20/design-spotcheck.md.
[2026-04-18] Frontend → Reviewer: pj-s20-09 /help refresh + anchors — ready for review.
[2026-04-18] Frontend → Reviewer: pj-s20-08 /contact refresh — ready for review. Mail icon replaces ✉️, warm labels (Your name / What's this about? / What's on your mind?), sentence-case subject options via {value,label} map (backend enum untouched), Sending… U+2026, unified error toast, response-time line with Clock icon, ScrollReveal on form + footer note.
[2026-04-18] Frontend → Reviewer: pj-s20-07 /world-prayer refresh — ready for review.
[2026-04-18] Frontend → QA: pj-s20-06 /find-a-church refresh — warmer pre-search + zero-results states (with ≥30mi conditional), fixed error copy (no raw errors leak), Lucide icons (MapPin/SearchX/AlertCircle/ChevronDown/List/Map), count line 'nearby', select labels updated. ChurchCard emoji audit — ✓/👋/👥 replaced with BadgeCheck/HandHeart/Users. Intro block skipped (search bar owns the hero slot). Ready for review.
[2026-04-18] Frontend → Reviewer: pj-s20-05 /browse refresh — Lucide icons replace all 10 category emoji + 📚 cover + 🙏 fallback, sentence-case headings, warmer empty states, ScrollReveal on 3 below-fold blocks. Ready for review.
[2026-04-18] Frontend → Reviewer: pj-s20-04 /about refresh — ready for review.
[2026-04-18] Frontend → Designer: pj-s20-02 /know-jesus refresh — visual + content complete, ready for design spot-check.
[2026-04-18] PM → Architect: Sprint 20 kickoff — 14 tasks created and approved (pj-s20-01 through pj-s20-14). Team activated: Copywriter, Frontend Engineer, Designer, QA, Reviewer, PM. Reason: visual+copy sprint across 10 public pages — Copywriter owns voice/banned-phrase cleanup from brand-guide, Frontend implements per-page refresh, Designer spot-checks /know-jesus and /give (high-stakes evangelism + donation surfaces), QA runs banned-phrase sweep + visual regression, Reviewer gates per-task. Spec: docs/superpowers/specs/2026-04-18-sprint20-visual-audit-design.md. Plan: docs/superpowers/plans/2026-04-18-sprint20-visual-audit.md. Gate task: pj-s20-01 (Copywriter briefs) blocks all 8 full-treatment page tasks; light-pass tasks pj-s20-10/11 can start immediately.
[2026-04-18] Reviewer → PM: pj-s19-09 Sprint 19 APPROVED. All 9 tasks done. 2 known deviations: stats strip shows Active not Submitted (PM to document); LightEscapeAnimation not a named export (accepted). Commit 868d64d.
[2026-04-18] Reviewer → Frontend Engineer: pj-s19-09 NEEDS-REWORK. 1 blocking fix required: signed-in greeting "prayed for you" line must lose text-muted-foreground (spec Part 3 explicit). 2 additional deviations documented in task notes (Active vs Submitted label — PM decision; LightEscapeAnimation not exported — low severity). Return to Reviewer after fix.
[2026-04-18] QA → Reviewer: pj-s19-08 QA PASS. All 5 surfaces verified. Fixed SlipDropAnimation zIndex (50→100) + animation fill (forwards→both). Commit 3f07f6e.
[2026-04-18] Frontend Engineer → QA: pj-s19-07 /praise-wall DONE. Lights jar hero + light-escape orb on each praise card. 359/5 tests. Commit 0319a4e. All 7 impl tasks complete — ready for QA.
[2026-04-18] Frontend Engineer → Reviewer: pj-s19-06 /pray DONE. Slips jar hero + "Someone wrote this for you." + live active count. Commit 51aabad.
[2026-04-18] Frontend Engineer → Reviewer: pj-s19-05 /for-churches DONE. Placeholder testimonials removed, live trust strip added, hero jar upgraded to size=lg. Commit e3874d4.
[2026-04-18] Frontend Engineer → Reviewer: pj-s19-04 PrayerDialog slip-drop DONE. SlipDropAnimation outside Dialog, fires on submit success. Commit f87c071.
[2026-04-18] Frontend Engineer → Reviewer: pj-s19-03 Homepage redesign DONE. Signed-out lg jar + new headline + Lucide icons. Signed-in personal stats + church CTAs. Fixed dead prayedFor query. Commit ca355cf.
[2026-04-18] Backend Engineer → Reviewer: pj-s19-02 Homepage service DONE. getMyIntercessionsCount/getMyAnsweredCount/getUserChurch + getHomepageData update. 6/6 tests. Fixed getUserChurch orderBy. Commit df1ff4b.
[2026-04-18] Frontend Engineer → Reviewer: pj-s19-01 PrayerJar upgrade DONE. size/mode/countLabel + SlipDropAnimation + CSS keyframes. Fixed: countLabel aria-hidden, reduced-motion onComplete. Commit ae12544.
[2026-04-18] PM → Team: pj-s19-01 through pj-s19-09 Sprint 19 kicked off — UI Modernization. 9 tasks approved. Jar-first approach. Spec: docs/superpowers/specs/2026-04-18-ui-modernization-design.md. Plan: docs/superpowers/plans/2026-04-18-ui-modernization.md. Start with pj-s19-01 (Frontend) + pj-s19-02 (Backend) in parallel.
[2026-04-18] Reviewer → PM: pj-s18-16 Sprint 18 APPROVED WITH CONDITIONS — all 16 tasks done. 353/358 tests pass (5 pre-existing failures, not Sprint 18). No secret leakage found. CSRF check verified non-bypassable. /for-churches claim materially backed. Known gaps documented (webhookSecret tracked for Sprint 19, sandbox integration tests pending human credentials). Sprint 18 marked done. See docs/sprint-reviews/sprint18-reviewer-signoff.md.
[2026-04-18] Sales → PM: pj-s18-15 done — pco-integration-brief.md (30-sec pitch, 5 objection handles, competitive positioning), pco-rollout.md (Phase 1 cohort, 30-day Enterprise notice window, monitoring checklist, canned responses, escalation path), PCO integration bullet added to /for-churches under Growing Church tier. Needs PM review before sprint close.
[2026-04-18] DocWriter → PM: pj-s18-14 ready for review — /docs/churches/connect-planning-center page + Learn more links from ChmsConnectCard. Brand voice follows brand-guide.md. Needs CustomerSuccess review for accuracy.
[2026-04-18] QA → PM: pj-s18-13 ready for review — 8 integration test scenarios scaffolded (skip without PCO_SANDBOX_CLIENT_ID). QA sign-off template at docs/qa/sprint18-chms-signoff.md. BLOCKED on human: obtain PCO sandbox org + credentials.
[2026-04-18] Analytics → PM: pj-s18-12 done — trackChmsConnectionStarted/Completed/Failed added to analytics.server.ts + fired from connect/callback/runner. church-funnel-spec.md updated.
[2026-04-18] Frontend → PM: pj-s18-11-frontend-connect-ui ready for review — integrations settings page + ChmsConnectCard (connected/disconnected states, sync status badge, Sync Now, Disconnect). TypeScript clean.
[2026-04-18] Backend → PM: pj-s18-10-sync-jobs-runner ready for review — runner + full-sync scheduler, 8 tests, backoff/dead-letter/Sentry all implemented.
[2026-04-18] Integrations → PM: pj-s18-09-push-summary ready for review — pushPrayerSummary with 403/404 graceful degradation, 3 new tests (14 total in adapter).
[2026-04-18] Security → PM: pj-s18-08 webhook review PASS WITH CONDITIONS — all 7 crypto checks pass (raw body HMAC, timingSafeEqual, full-body scope, chmsConfig secret, 5-min replay window, uniform 401s, Sentry scope). webhookSecret gap documented as Option b: known gap, delta sync non-operational until Sprint 19 registration task is implemented, nightly full-sync covers interim. Review at docs/security/sprint18-webhook-review.md.
[2026-04-18] Backend → Security: pj-s18-07-webhook-route ready for review — PCO HMAC-SHA256, timing-safe compare, 5-minute replay window, church lookup via pcoOrgId. pj-s18-08 security review needed. NOTE: webhookSecret is undefined for all current churches until a secret-registration UI is added (no existing OAuth flow writes it) — flag this in your review findings.
[2026-04-18] Integrations → PM: pj-s18-06-pco-adapter-sync ready for review — listMembers (paginated), listGroups (403-graceful), syncMember (stub user + notifyAdmins), RateLimiter (100 req/60s token-bucket). 11 tests passing.
[2026-04-18] Integrations → PM: pj-s18-05-pco-adapter-oauth ready for review — ChmsAdapter interface, providers registry, PlanningCenterAdapter OAuth (connect/disconnect/token exchange/refresh), callback + connect routes, 5 tests passing.
[2026-04-18] Security → PM: pj-s18-04-security-encrypt-review PASS — Integrations unblocked for pj-s18-05 (PCO OAuth adapter).
[2026-04-18] Backend → Security: pj-s18-03-encrypt-lib ready for review — AES-256-GCM encrypt.ts + 8 tests passing. Security sign-off (pj-s18-04) required before Integrations can use it.
[2026-04-18] Database → PM: pj-s18-02-schema-migrations ready for review — 0030_chms_integration.sql + schema.ts updated. TypeScript clean.
[2026-04-17] Reviewer → Architect: pj-s17-enterprise-demo-ui NEEDS-REWORK — demo_requested fires twice: server action fires trackDemoRequested() (correct, per spec §3.8 server-only), demo-form.tsx line 87 also fires raw track('demo_requested', ...) client-side with wrong property names. Remove client-side track() call from demo-form.tsx.
[2026-04-17] Reviewer → done: pj-s17-chms-architecture — APPROVED. All 6 AC met. ChmsAdapter interface (7 methods), job model + backoff [0/60s/300s], field-mapping tables, env-var convention CHMS_{PROVIDER}_{KEY}, Planning Center as Sprint 18 target with S18-1–S18-8 task table. No src/ code introduced.
[2026-04-17] Reviewer → done: pj-s17-funnel-instrumentation-fe — APPROVED. All 6 AC met. 8 events wired, typed wrappers enforce event names, plan_activated/plan_upgraded server-side only in Stripe webhook. 0 new tsc errors in production files.
[2026-04-17] Reviewer → done: pj-s17-seo-for-churches — APPROVED. All 6 AC met. 15 keywords, title/meta exact copy, on-page changes with file paths, 3 comparison pages, baseline measurement, sitemap fix applied.
[2026-04-17] Reviewer → Architect: pj-s17-audit-log NEEDS-REWORK — AC4 fail: audit page has no filter UI (action/date) and no pagination (hardcoded limit(200) + JS filter). AC6 fail: no scheduled job or documented manual query deletes rows older than retention window — display filter is not deletion.
[2026-04-18] Frontend → QA: pj-s17-funnel-instrumentation-fe — all 8 funnel events wired. 4 client events in analytics.ts typed wrappers (for_churches_view, pricing_view, calculator_interacted, signup_start). 4 server events in analytics.server.ts via @vercel/analytics/server (signup_complete in church API route, plan_activated + plan_upgraded in Stripe webhook, demo_requested in demo/actions.ts). 0 new tsc errors.
[2026-04-17] Security → Reviewer: pj-s17-audit-log Church audit log — migration 0029, 5 write-points (member.add, member.remove, role.change, prayer.delete, plan.change), auditRetentionDays() in plans.ts (90/365/1095d), read-only admin page /church/{slug}/admin/audit, 8/8 tests pass.
[2026-04-18] Security → Reviewer (rework): pj-s17-audit-log — AC4+AC6 fixed. AC4: DB-level filtering (action/from/to/page query params), 50-row pages, shared whereClause for count+data, GET form filter UI with action select + date inputs. AC6: /api/cron/audit-cleanup buckets churches by currentPlan, runs ≤3 DELETEs grouped by retention window (90/365/1095d), returns {deleted:N}. vercel.json cron at 0 3 * * * (same window as purge-moderation-snippets — independent operations). 6/6 cron tests pass, 0 new tsc errors.
[2026-04-18] Frontend → Reviewer: pj-s17-enterprise-demo-ui — /for-churches/demo page + requestDemo() server action + 10 tests all passing. Migration 0028_enterprise_leads.sql generated by drizzle-kit. Admin email fires directly via Resend to ADMIN_EMAILS with all lead fields + qualification flags. demo_requested funnel event via @vercel/analytics on submit. Calendly link on thank-you step using NEXT_PUBLIC_CALENDLY_URL. 0 new tsc errors.
[2026-04-17] Growth → Reviewer: pj-s17-seo-for-churches — SEO brief complete. 3 primary keywords, exact metadata copy, schema.org Product with offers, 3 comparison pages, internal link map, top 3 content priorities. robots/sitemap bug fixed: removed auth-gated /church/{slug} entries from sitemap.ts (robots.ts disallow was already correct). All 6 AC met.
[2026-04-17] Architect → Reviewer: pj-s17-chms-architecture — docs/architecture/chms-integration-layer.md complete. ChmsAdapter interface (7 methods), webhook route POST /api/webhooks/chms/[provider], 3 critical schema additions (churches.chmsProvider/chmsConfig, church_members.externalChmsId index, chms_sync_jobs table), Sprint 18 task list for Planning Center impl. Ready for Reviewer.
[2026-04-17] Frontend → Reviewer (rework): pj-s17-for-churches-build — fixed recommendTier() logic bug, added 8 pricing-calculator tests, corrected /for-churches/demo CTA path in 3 files, replaced details/summary FAQ with aria-expanded accordion component.
[2026-04-17] Reviewer → done: pj-s17-for-churches-build — APPROVED after targeted rework. All 4 failures resolved: recommendTier() downward-check with ENTERPRISE_THRESHOLD=500 correctly returns 'enterprise' for >500; 8/8 calculator tests pass; /church/enterprise-demo zero hits, /for-churches/demo confirmed in 3 files; faq-accordion.tsx 'use client' with aria-expanded={isOpen} on each button.
[2026-04-18] Reviewer → Architect: pj-s17-for-churches-build — REWORK: 4 AC failures: (1) recommendTier() can never return 'enterprise' — PLANS.pro.limits.members === null always short-circuits to 'pro'; 600-member test proves it; (2) no pricing-calculator tests — plans.test.ts covers gating predicates only, no test for recommendTier(); (3) enterprise CTA links to /church/enterprise-demo everywhere but sales doc §2 and UI task file list both say /for-churches/demo; (4) FAQ aria-expanded missing — native <details>/<summary> uses open attribute, not aria-expanded as AC requires.
[2026-04-18] Reviewer → done: pj-s17-enterprise-demo-flow — APPROVED. All 6 AC met. Qualification tree + 6-signal decision tree present; 10 fields with type/required markers in §2 table; 4-touch sequence (T+0/T+1h/T+24h/T+72h) with subject lines and full body copy; rep brief with rubric + disqualification triggers + 24h SLA; warm redirect to Growing Church in §5; Calendly inline embed + CALENDLY_URL env var in §6. Price anchor confirmed.
[2026-04-17] Frontend → QA: pj-s17-for-churches-build — /for-churches converted to server component (metadata export), PricingCalculator and TierCardsSection extracted as client components. All data sourced from plans.ts. 8 features, 4 tier cards, 8-item FAQ, jar motif, verse strip, social proof placeholders, enterprise section all shipped. 0 tsc errors on touched files.
[2026-04-17] Reviewer → done: pj-s17-plans-gating-fix — APPROVED. All 6 AC met. PASTORAL_DASHBOARD_TIER='starter'; Free 50/3; display names correct; 15% annual math verified; all three new predicates present; 44/44 tests pass; three dashboard routes plan-gated.
[2026-04-17] Reviewer → done: pj-s17-for-churches-rewrite — APPROVED. All 7 AC met. 4 tier cards with fit-statements; correct tier attribution; no banned claims; 8-Q FAQ; enterprise section present; all 3 hotfix blocks cleared.
[2026-04-17] Reviewer → done: pj-s17-dpa-subprocessor — APPROVED. All 8 AC met. /legal/dpa with click-through accept; acceptDpa() server action; /legal/subprocessors with 9 processors + last-updated constant; nonprofit upload flow; admin review queue; AI-drafted disclaimer; 19/19 tests pass.
[2026-04-17] Legal → Reviewer: pj-s17-dpa-subprocessor — /legal/dpa page + click-through accept server action (ip_address captured via x-forwarded-for, admin/pastor auth gate) + 501(c)(3) upload flow (Vercel Blob PDF, nonprofitVerifications table, /admin/legal-verifications review queue, status pill on church dashboard). migration 0027 already had nonprofit_verifications table + churchLegalAcceptances — no column added to churches. 19 tests pass. Footer linked. IMPORTANT: DPA is AI-drafted; consult counsel before relying on it.
[2026-04-17] Copywriter → Reviewer: pj-s17-for-churches-rewrite — docs/marketing/for-churches-copy-v2.md complete. Hero, verse strip, 8 feature blocks with tier flags, 4 tier cards (Free/Small Church/Growing Church/Network), 8-item FAQ, 3 social proof placeholder slots, Enterprise/Network demo section with qualification fields. No AI-Flagged Care, SLA, dedicated support, or Most Popular badge. Annual discount 15% throughout. Pastoral Dashboard and Pastoral Care Inbox at Small Church tier. Ready for Reviewer.
[2026-04-17] Reviewer → done: pj-s17-competitor-pricing — APPROVED. All 6 AC met. 8 competitors covered; Praytell/Pushpray gaps explained; source URLs + date present; explicit above/below-market narrative; unblocks pj-s17-tier-redesign.
[2026-04-17] Reviewer → done: pj-s17-onboarding-audit — APPROVED after rework. AC6 satisfied: docs/design/onboarding-wireframes.html covers all 3 required screens (post-creation welcome, persistent progress bar with 3 states, plan gate redesign). All 7 AC fully met.
[2026-04-17] Designer → Reviewer: pj-s17-onboarding-audit — wireframes added at docs/design/onboarding-wireframes.html. 3 screens: post-creation welcome (/church/[slug]/welcome route), persistent setup progress bar (layout.tsx header), plan gate redesign (free-tier actions before upgrade prompt). AC6 now met.
[2026-04-17] Reviewer → done: pj-s17-chms-integration-survey — APPROVED. All 5 AC met. All 4 platforms covered with auth/endpoints/rate limits/webhooks/sandbox/MVI scope + source links. PCO #1 (Sprint 18), Breeze #2 (Sprint 19), ChurchTrac skip, Elvanto deprioritize. Unblocks pj-s17-chms-architecture.
[2026-04-17] Reviewer → done: pj-s17-funnel-instrumentation — APPROVED. All 6 AC met. @vercel/analytics confirmed with file-path citations. 8 events fully spec'd with name/trigger/properties/types. plan_activated + plan_upgraded server-side only. Weekly review template + 4 dashboard views included.
[2026-04-17] Reviewer → Architect: pj-s17-onboarding-audit — REWORK: AC6 unmet. Wireframe or wireframe link required; document states "No wireframes are included." 6 of 7 AC pass (friction log, checklist, sample content, Sprint 18 tasks all solid). CustomerSuccess must add low-fi wireframes or a Figma link for 3 screens: post-creation welcome, persistent setup progress bar, plan gate redesign.
[2026-04-17] Reviewer → Architect: pj-s17-mrr-dashboard — REWORK: Two phase-1 criteria unmet: (1) docs/finance/mrr-dashboard-spec.md missing, (2) no UTM-at-signup code or test. MRR lib, migration, webhook, and 20/20 tests are solid — two additions needed.
[2026-04-17] Reviewer → done: pj-s17-mrr-dashboard — APPROVED after rework. Both gaps resolved: spec doc covers all 10 metrics with formulas, refresh cadence, permissions, and access path; UTM capture wired at church creation with body-first/query-param fallback. 68/68 tests pass.
[2026-04-17] Reviewer → done: pj-s17-brand-guide-v1 — All 8 AC met. docs/brand/brand-guide.md approved. Unblocks pj-s17-tier-redesign and pj-s17-for-churches-rewrite.
[2026-04-17] CustomerSuccess → Reviewer: pj-s17-onboarding-audit — docs/users/church-onboarding-audit.md complete. 15 friction points logged with file references. Top issue: post-creation redirect drops pastor on public profile, never the setup guide. 3 quick wins all under 1 day. 8-step checklist + sample content strategy + 9 Sprint 18 tasks included.
[2026-04-17] Analytics → Reviewer: pj-s17-funnel-instrumentation — docs/analytics/church-funnel-spec.md complete. @vercel/analytics confirmed as sole tool (no PostHog installed). 8 events defined with properties, firing sides (4 client / 2 server action / 2 Stripe webhook), and expected volumes. Weekly funnel review template + dashboard definition included.
[2026-04-17] Brand → Reviewer: pj-s17-brand-guide-v1 — docs/brand/brand-guide.md v1 shipped. 10 sections covering positioning, audience, 5 voice attributes with do/don't pairs, visual motifs (documented two-amber-systems state honestly — OKLCH --primary + Tailwind amber-*), tier-naming recommendation (Free / Small Church / Growing Church / Network — Strategist owns final call in pj-s17-tier-redesign), "Best for churches N–M" fit-statement rule, 16-entry banned-phrases list, usage-by-context guidance, 3 reference copy examples. Unblocks pj-s17-tier-redesign and pj-s17-for-churches-rewrite. Did NOT modify plans.ts or /for-churches copy (out of scope).
[2026-04-17] Legal → Reviewer: pj-s17-hotfix-ai-claim — APPROVED WITH CONDITIONS [A1/A2/A3]. Path (a) resolves FTC §5 exposure on public surfaces. Residuals (Sprint 18+, do not block close): pastor-tips.tsx:8 implied-feature tip, always-empty /dashboard 'Flagged Prayers' nav link, AI gateway fail-open with no alerting. Signoff: docs/legal/sprint17-hotfix-signoff-2026-04-17.md. Disclaimer: internal Legal agent, not qualified counsel.
[2026-04-17] Legal → Reviewer: pj-s17-hotfix-enterprise-claims — APPROVED WITH CONDITIONS [E1-E5]. 'Coming soon' SSO/SAML/subdomain defensible pending real ETA; SLA+dedicated-support removal resolves terms/page.tsx:33 contradiction. Residuals (Sprint 18+): audit executed Enterprise contracts for removed commitments (E1), create implementation tasks for SSO/OIDC + subdomain middleware (E2), GDPR Art.9/CCPA review when SSO ships (E3), SLA-reinstatement requires runbook+Terms amendment (E4), standard MSA template for 'custom agreement available' bullet (E5). Signoff: docs/legal/sprint17-hotfix-signoff-2026-04-17.md. Outside counsel required for E1.
[2026-04-17] Legal → Reviewer: pj-s17-hotfix-pastoral-consistency — APPROVED WITH CONDITIONS [P1/P2]. Single-source-of-truth (PASTORAL_DASHBOARD_TIER + hasPastoralDashboard() + 11 passing tests + server-side gate) closes FTC §5 exposure. Residuals (Sprint 18+): docs/paid:89 and docs/churches:78 still hard-code tier name (P1); docs/paid feature-comparison matrix is hand-coded (P2) — both will drift silently on tier rename. Signoff: docs/legal/sprint17-hotfix-signoff-2026-04-17.md. Disclaimer: internal Legal agent, not qualified counsel.
[2026-04-17] Architect → PM/Reviewer: pj-s17-hotfix-ai-claim → review — Path (a) chosen (kill the claim). Decision doc: docs/decisions/ai-flagged-care-claim-2026-04.md. AI-Flagged Care claim removed from 6 public surfaces (plans.ts Pro features, for-churches card+FAQ, docs/paid table+deep-dive, docs/churches pastoral-dashboard section+teaser, docs/features feature list, help moderation+church-features FAQs). pj-s17-ai-flag-wiring DELETED per GATE criterion. prayer.service.ts:41-45 unchanged — CrisisResources dialog already handles user-safety path. Legal sign-off still open (AC #6) — PM route to Legal agent before close.
[2026-04-17] Research → PM: competitor-pricing-2026-04-17 research complete — PrayerJar's $19/$49 ladder is in the correct segment but Starter is mispriced between Prayer Platform ($10) and PrayerMate ($12-15); free tier (25/1) is tightest in market; 3 recs: loosen free to 50/3, add annual pricing, advertise PCO integration.
[2026-04-16] Reviewer → PM: Sprint 15 complete — all 6 failure-bucket proofs verified and on record. Deliverables: Sentry + Better Stack observability wired, Playwright E2E suite (8 specs, 4 browser targets), Vitest integration tests (3 test files against real Neon), CI pipeline (unit/typecheck/lint/integration/e2e/lighthouse), post-deploy smoke (18 routes, runs on deploy + every 6h). Human actions pending: add 7 GitHub secrets + configure Sentry/Better Stack dashboards (see runbooks). Bucket #5 limitation noted: prayerInteractions has no unique constraint; primary safety net is E2E pray-for POST count, not integration test.
[2026-04-16] Backend Engineer → QA: pj-s15-integration — Neon branch workflow, vitest integration mode, driver-quirks tests (bucket #2), single-fire invariant (bucket #5), prayer authz tests (bucket #6). Note: integration tests need DATABASE_URL env var pointing to Neon preview branch — add NEON_INTEGRATION_DB_URL and NEON_PROJECT_ID/NEON_API_KEY to GitHub secrets. Key findings: prayerInteractions has no unique constraint (double-fire is allowed at DB level — documented not fixed), updatePrayer/deletePrayer return null/false for non-owner (not throw).
[2026-04-16] Frontend Engineer → QA: pj-s15-e2e — 8 e2e specs committed: oauth-redirect, magic-link (skips w/o SENTRY_DEBUG_TOKEN), global-setup fixture, add-prayer (homepage + my-prayers), pray-for, share, overflow. Debug endpoints: /api/debug/magic-link + /api/debug/seed-prayer. Key findings: prayers.content (not .text), no shareId column (public URL = prayers.id), button "Add a Prayer Request", overflow trigger aria-label="Prayer actions". Tests requiring auth need SENTRY_DEBUG_TOKEN for global-setup.
[2026-04-16] Backend Engineer → Reviewer: pj-s15-ci-gates — CI pipeline live (unit/typecheck/lint/integration/e2e/lighthouse), post-deploy smoke runs on every deploy + every 6h, Sentry release registration on deploy. GitHub secrets needed: NEON_INTEGRATION_DB_URL, E2E_BASE_URL, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT.
[2026-04-16] Backend Engineer → QA: pj-s15-observability — Sentry configs committed, debug endpoint live, Better Stack + alert runbooks written. Human action needed: add Sentry env vars to Vercel + configure Better Stack Vercel integration + create Sentry alert rule (see runbooks).
[2026-04-16] Architect → Backend/Frontend/Database Engineers: pj-s15-archaeology done — bug archaeology matrix committed, 6 failure buckets confirmed, workstreams B-E may proceed in parallel.
[2026-04-16] PM → Architect: Sprint 15 kickoff — 6 tasks (pj-s15-archaeology through pj-s15-reviewer-proof) created as approved; archaeology in-progress.
[2026-04-16] PM → Deploy: Sprint 14 complete — 19 commits pushed to feature/prayer-jar, Vercel redeploy triggered
[2026-04-16] QA → Reviewer: task-11-verify-prayer-card-render-sites — all 5 render sites verified (my-prayers, prayed-for, adopted, group-wall, og-card); no broken props, no removed props passed, TypeScript clean
[2026-04-16] Frontend Engineer → Reviewer: task-10-prayer-card-refactor — PrayerCard refactored: 17→11 useState, inline forms removed, PrayerCardMenu+3 dialogs wired, committed 7140b54
[2026-04-15] Copywriter → Designer: copy-audit-2026-04-15 — full copy audit complete, 10 priority fixes identified
[2026-04-15] Backend Engineer → QA: pj-s13-admin-p5-notify — notifyAdmins wired at selfHarm flag, harassment report, contact submission
[2026-04-15] QA → Reviewer: pj-s13-admin-p5-qa — Phase 5 notifications passed all 8 checks. No throws, correct env vars, ADMIN_EMAILS parsed correctly, all 3 triggers conditional and fire-and-forget, no user content in emails.
[2026-04-15] Reviewer → PM: Sprint 13 COMPLETE — all 16 tasks done. Admin dashboard fully shipped: schema, security, moderation logging, contact persistence, UI, push notifications.
[2026-04-15] Backend Engineer → Reviewer: pj-s12-claim-link — claim-to-platform church linking implemented
[2026-04-15] Backend Engineer → Reviewer: pj-s13-admin-p4-backend — audit log writes added to 3 report actions per rework request
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
[2026-04-15] QA → Reviewer: pj-s13-admin-p1-qa/p2-qa/p3-qa — security + logging + contact phases verified. ALL PASS with two NEEDS-REVIEW flags for Reviewer attention: (1) moderation category mapping only emits selfHarm|other — richer categories never populated; (2) cron returns 401 on bad auth (spec doesn't specify status code).
[2026-04-15] Frontend Engineer → QA: pj-s13-admin-p4-ui — admin layout + overview + moderation log + feedback inbox pages ready for review
[2026-04-15] Reviewer → PM: pj-s13-admin-reviewer — Phases 1–3 APPROVED, Phase 4 NEEDS-REWORK. The 3 existing report actions (approve/reject/dismiss) never write audit rows to admin_actions — spec §6.3 requirement missed. pj-s13-admin-p4-backend flagged needs-rework; Backend Engineer must add audit log writes to those 3 actions. Inline fix applied: proxy.ts filter(Boolean) added. Phase 5 (notifications) not yet started.
[2026-04-15] Reviewer → PM: pj-s13-admin-reviewer — Phases 1–4 APPROVED. Schema, security, moderation logging, contact persistence, admin UI all complete. Phase 5 (push notifications) remains.
[2026-04-15] Backend Engineer → Reviewer: pj-s12-fix-sse-polling + pj-s12-fix-double-interaction — SSE praying-now route deleted (no references found, polling already in use); double-interaction already fixed in current code (handlePrayed is local-only, action called once)
[2026-04-15] Reviewer → PM: Sprint 12 complete — all 5 tasks done. pj-s12-fix-sse-polling, pj-s12-fix-double-interaction, pj-s12-claim-link approved. pj-s12-prayer-deletion and pj-s12-fire-forget-side-effects confirmed already implemented.

[2026-04-17] Sales → Reviewer: pj-s17-enterprise-demo-flow — docs/sales/enterprise-demo-flow.md complete. Qualification threshold (500+ members OR multi-site OR denomination OR SSO/DPA need), 10-field lead form, 4-touch automated email sequence, rep brief template, disqualification path to Growing Church, Calendly inline embed spec with CALENDLY_URL env var. Price anchor: "Starting at $199/mo".
[2026-04-17] PM → Architect: pj-s17-hotfix-ai-claim — decide path a (kill claim) vs b (build flagging) for AI-Flagged Care marketing claim
[2026-04-17] PM → Security: pj-s17-hotfix-enterprise-claims — produce real-vs-advertised matrix for SSO/SAML/SLA/subdomain, hand copy changes to Copywriter
[2026-04-17] PM → Backend: pj-s17-hotfix-pastoral-consistency — reconcile Pastoral Dashboard tier across plans.ts + FAQ + gating code
[2026-04-17] Security → Reviewer: pj-s17-hotfix-enterprise-claims — decision doc committed; plans.ts + /for-churches + /docs/paid edited. SSO/SAML + subdomain → coming-soon, SLA + dedicated-support → removed, Custom Branding card reworded. ⚠ Legal agent pass still required for acceptance criterion #7 before close.
[2026-04-17] Backend → QA: pj-s17-hotfix-pastoral-consistency — plans.ts now owns PASTORAL_DASHBOARD_TIER + hasPastoralDashboard() predicate. /for-churches FAQ, /help FAQ (was /help, not /faq — no /faq route exists), and dashboard server gate all derive from plans.ts. Added src/lib/plans.test.ts — 11/11 pass. ⚠ Legal sign-off still required for AC #6. Adjacent docs/paid + docs/churches noted for follow-up (not in 3-file scope).
[2026-04-17] Reviewer → done: pj-s17-hotfix-ai-claim — all 8 acceptance criteria met. Path (a) applied across 6 public surfaces; grep of src/ for AI-Flagged claim returns zero hits. Legal APPROVED WITH CONDITIONS (A1/A2/A3 Sprint 18+). BLOCK on pj-s17-for-churches-rewrite verified.
[2026-04-17] Reviewer → done: pj-s17-hotfix-enterprise-claims — all 8 acceptance criteria met. Real-vs-advertised matrix in decision doc; SSO/SAML/subdomain → coming soon, SLA + dedicated support removed; plans.ts/for-churches/docs/paid updated. Legal APPROVED WITH CONDITIONS (E1-E5 Sprint 18+). BLOCK verified.
[2026-04-17] Reviewer → done: pj-s17-hotfix-pastoral-consistency — all 7 acceptance criteria met. plans.ts is source of truth via PASTORAL_DASHBOARD_TIER_NAME / hasPastoralDashboard(); for-churches + /help + dashboard gate all derive from the constant. Re-ran `npx vitest run src/lib/plans.test.ts` → 11/11 pass. Legal APPROVED WITH CONDITIONS (P1/P2 Sprint 18+). Sprint 17 marketing rewrite track is now UNBLOCKED.

[2026-04-17] PM → Brand: pj-s17-brand-guide-v1 — write docs/brand/brand-guide.md v1 (voice, tier names, motif, do/don't)
[2026-04-17] PM → Finance: pj-s17-mrr-dashboard — ship MRR/churn/attribution spec + internal dashboard before repricing
[2026-04-17] PM → Legal: pj-s17-dpa-subprocessor — DPA template + public sub-processor list + 501(c)(3) flow
[2026-04-17] Integrations → Reviewer: pj-s17-chms-integration-survey — docs/integrations/chms-landscape.md complete. Planning Center #1 (OAuth 2.0, person webhooks, free sandbox, 73k churches, 100 req/min), Breeze #2 (API key, polling only, 11k small churches, 20 req/min), ChurchTrac skip (no API), Elvanto deprioritize (partial webhooks, no sandbox). Unblocks pj-s17-chms-architecture.
[2026-04-17] Finance → Reviewer (rework): pj-s17-mrr-dashboard — Both flagged gaps resolved. (1) docs/finance/mrr-dashboard-spec.md written with explicit formulas for all 10 metrics including NRR, refresh cadence decision (live query), permissions (requireAdmin/ADMIN_EMAILS), and access path. (2) UTM capture wired in createChurch() in church-platform.service.ts; route reads UTMs from body + URL query params; acquisitionSource = utmSource ?? 'direct'. 3 new tests in route.test.ts verify UTM args reach createChurch(). 20 MRR tests + 48 route tests all pass.
[2026-04-17] Strategist → Reviewer: pj-s17-tier-redesign — docs/strategy/pricing-prayerjar-2026-04.md committed. Definitive pricing decision: Free (50/3 free cap) / Small Church $19/mo / Growing Church $49/mo / Network $199+/mo; 15% annual discount; Pastoral Dashboard + Care Inbox move to Starter; Assignments + Testimony Queue stay at Pro; no 30-day trial; Enterprise demo triggers at >500 members or SSO/multi-site/DPA need. Full Backend and Copywriter delta specified. PM sign-off required before downstream tasks start.
[2026-04-17] Reviewer → done: pj-s17-tier-redesign — APPROVED. All 8 AC met. Tier table verified (Free/$0, Small Church/$19 [15% annual = $193.80/yr], Growing Church/$49 [15% annual = $499.80/yr], Network/$199+). All 5 contested features mapped to single entry tier. AI-Flagged Care absent from all tiers. SSO/SAML/SLA correctly coming-soon or removed. Pastoral Dashboard → Small Church with rationale. 13-item Backend delta + 10-item Copywriter delta both fully actionable. Finance annual billing sequencing open question noted for PM (not a reject trigger). PM sign-off in task notes still required before downstream tasks start.

[2026-04-18T02:18:08.088Z] Dashboard sync — 0 fix(es): 

[2026-04-17] PM → Backend: pj-s17-plans-gating-fix — update plans.ts per approved tier decision doc
[2026-04-18] Backend → Reviewer: pj-s17-plans-gating-fix — plans.ts fully updated per Sprint 17 tier map; 4 new gate constants + predicates; 3 dashboard routes (care/team/testimony) plan-gated for first time; 44/44 tests pass
[2026-04-17] PM → Copywriter: pj-s17-for-churches-rewrite — rewrite /for-churches copy per approved tier map + brand guide
[2026-04-17] PM → Legal: pj-s17-dpa-subprocessor — finish DPA public page + 501(c)(3) flow (partial work already committed)

[2026-04-18T02:34:35.165Z] Dashboard sync — 0 fix(es): 

[2026-04-18T02:47:12.936Z] Dashboard sync — 0 fix(es): 

[2026-04-18T02:52:13.069Z] Dashboard sync — 0 fix(es): 
[2026-04-18] Reviewer → done: pj-s17-enterprise-demo-ui — APPROVED after targeted re-review (commit 4180ad8). Sole failing AC (duplicate client-side track('demo_requested',...)) confirmed removed. Zero track( hits in demo-form.tsx, zero @vercel/analytics import, trackDemoRequested() in actions.ts intact. All TS errors pre-existing in test files — none introduced by fix. All 6 AC met.
[2026-04-18] Reviewer → done: pj-s17-audit-log — APPROVED after rework. AC4: searchParams as Promise<{...}> (Next.js 16), DB-level WHERE for action/from/to/retention cutoff, .limit(50).offset() pagination, prev/next links, <form method=GET> with 6-option action select + date inputs + submit + clear. AC6: /api/cron/audit-cleanup with Bearer CRON_SECRET auth, per-church deletion bucketed by auditRetentionDays(tier), vercel.json at 0 3 * * *, 6/6 tests pass. All 8 AC met. Sprint 17: 20/20 done — SPRINT COMPLETE.

[2026-04-18T03:21:24.105Z] Dashboard sync — 0 fix(es): 
[2026-04-18] PM → Legal: pj-s18-01-legal-pco-subprocessor — Sprint 18 gate task. Planning Center as new subprocessor + DPA update. Integrations blocked until sign-off memo at docs/legal/sprint18-chms-signoff.md.
[2026-04-18] Legal → PM: pj-s18-01-legal-pco-subprocessor ready for review — GO decision with 6 conditions on Integrations. Memo at docs/legal/sprint18-chms-signoff.md. Subprocessor list v1.1-2026-04-18 (added PCO). DPA v1.1-2026-04-18 (ChMS bullet in Section 3). Re-consent required for existing Churches before PCO toggle enabled. Integrations unblocked for pj-s18-05/06 subject to pj-s18-04 (Security/encryption) also signing off.

[2026-04-18T19:38:43.340Z] Dashboard sync — 0 fix(es): 
[2026-04-18] Copywriter → PM: pj-s20-01 Sprint 20 copy briefs — 8 briefs ready at docs/sprint20/copy-briefs/. Banned-phrase audit complete. Ready for Frontend handoff.

[2026-04-18] Frontend → Designer: pj-s20-03 /give refresh — visual + content complete, ready for design spot-check.

[2026-04-19T02:48:13.382Z] Dashboard sync — 0 fix(es): 

[2026-04-18] Frontend → Reviewer: pj-s20-10 /sign-in light pass — ready for review.
[2026-04-18] Frontend → Reviewer: pj-s20-11 /docs light pass — ready for review.

[2026-04-18] QA → Reviewer: pj-s20-12 Sprint 20 QA — FAIL. 8 of 10 pages PASS and ready for final. pj-s20-09 (/help) and pj-s20-11 (/docs) returned to Frontend as needs-rework: 3 banned-phrase hits total. pj-s20-11 also carries a scope-escalation to PM (light-pass vs spec §4 conflict). Report: docs/sprint20/qa-report.md.

[2026-04-18] Reviewer → PM: pj-s20-01 Copywriter briefs APPROVED. All 8 briefs at docs/sprint20/copy-briefs/ delivered and consumed by Frontend.
[2026-04-18] Reviewer → PM: pj-s20-02 /know-jesus refresh APPROVED. Commit 7e065dd; Designer + QA both PASS; no jar + no verse strip both deliberate per brief and brand §4.2.
[2026-04-18] Reviewer → PM: pj-s20-03 /give refresh APPROVED. Commit dacf006; Designer + QA both PASS; Ps 24:1 verse + amber palette + no jar (donation surface).
[2026-04-18] Reviewer → PM: pj-s20-04 /about refresh APPROVED. Commit 4d8e6c6; jar hero-only, one verse strip, all prior banned phrases cleared.
[2026-04-18] Reviewer → PM: pj-s20-05 /browse refresh APPROVED. Commit 3cb217b; emoji → Lucide swap on category tiles + collections, ScrollReveal stagger correct.
[2026-04-18] Reviewer → PM: pj-s20-06 /find-a-church refresh APPROVED. Commit 5397355; warm zero-result empty state, ChurchCard emoji swapped to Lucide.
[2026-04-18] Reviewer → PM: pj-s20-07 /world-prayer refresh APPROVED. Commit de09d85; hero + 8 region emoji all on Lucide, "join the movement" copy gone, 1 Tim 2:1–2 verse strip.
[2026-04-18] Reviewer → PM: pj-s20-08 /contact refresh APPROVED. Commit b04979f; Mail icon, plain form labels, backend enum preserved via display-only label map.
[2026-04-18] Reviewer → PM: pj-s20-09 /help refresh APPROVED. Commits c91b6f5 + 3be08c0; accordion + jump-nav anchors land cleanly, §7 #2 phrase cleared in rework.
[2026-04-18] Reviewer → PM: pj-s20-10 /sign-in light pass APPROVED. Commit 5cd12ee; PrayerJar size=sm + Lucide Mail, OAuth copy untouched.
[2026-04-18] Reviewer → PM: pj-s20-11 /docs light pass APPROVED. Commits 5cd12ee + 3be08c0; 26-emoji Lucide swap clean; PM-authorized two-line copy fix cleared §7 #2 and §7 #5.
[2026-04-18] Reviewer → PM: pj-s20-12 QA sign-off APPROVED. Thorough 5-pass report + rework addendum at docs/sprint20/qa-report.md.
[2026-04-18] Reviewer → PM: pj-s20-13 Reviewer final approval DONE. Sign-off doc at docs/sprint20/reviewer-signoff.md. Sprint 20 ready to close — handing to PM for pj-s20-14.
[2026-04-19] PM → Team: Church-page review kicked off — 5 tasks assigned (pj-s21r-01 through pj-s21r-05). Team: Research, Architect, CustomerSuccess, Strategist, PM. Sprint ID: 21-review (audit, not build). Tasks 01-03 parallel; Strategist gated on all three; PM consolidation gated on Strategist. Q3 scoped as delta-refresh vs 2026-04-17 baseline, not fresh rerun. Kickoff brief: docs/church-review/kickoff.md. Deliverable: consolidated findings doc for user at docs/church-review/recommendations.md.
[2026-04-19] Architect → Strategist: pj-s21r-02 AUDIT DONE — verdict YES-WITH-CONDITIONS. /for-churches overstates on 3 Pro-tier claims (PDF reports, PCO group sync, weekly PCO summary push) + 1 billing FAQ claim. Sprint 17 hotfixes hold except hero phrase regressed. 3 ship-stoppers all Pro-tier. See docs/church-review/architect-findings.md.
[2026-04-19] Ron → PM: Sprint 22 re-scoped — park SSO/SCIM/BYO-domain, keep subdomains without shared sessions, ship with "enterprise login coming soon" label.

[2026-04-19] Ron → PM: PDF chain deferred to Sprint 23 — Sprint 22 now 13 tasks, ships with "custom analytics reports coming soon" as additional honest-gap label.

[2026-04-19T23:36:32.351Z] Dashboard sync — 0 fix(es): 

[2026-04-20T02:43:47.000Z] Frontend Engineer -> (self): pj-s22-24-frontend-jar-swap -- starting clay vessel implementation

[2026-04-20T02:54:00.000Z] Frontend Engineer -> QA: pj-s22-24-frontend-jar-swap -- clay vessel shipped, ready for visual regression at sm/md/lg x light/dark. Preview route src/app/preview/jar-slips/ still exists -- Ron to decide.

[2026-04-20T05:10:30.674Z] Dashboard sync — 0 fix(es): 

[2026-04-20T05:11:26.624Z] Dashboard sync — 0 fix(es): 

[2026-04-20T05:12:22.396Z] Dashboard sync — 0 fix(es): 

[2026-04-20T05:20:26.571Z] Dashboard sync — 0 fix(es): 

[2026-04-21] Backend → Reviewer: pj-s23-church-admin-welcome-drip — 7-task implementation complete, final review approved. Migration 0032 pending prod apply.
[2026-04-27] Ron → done: pj-s22-23 clay vessel visual sign-off — LGTM in light+dark.
[2026-07-19] Claude → Ron: prod DB reconciliation — 0031 (chms_groups) was NEVER applied to prod (journal timestamp typo'd to 2025 caused drizzle to sort it before applied migrations and skip it). Applied via scripts/apply-0031-runner.mjs, verified. 0032 table already existed in prod despite journal showing it pending (runner-vs-journal drift, expected). Journal timestamp fixed.
[2026-07-19] Claude → Ron: pj-ops-resend-dns-outage FIXED — Resend DKIM/SPF records re-added to Vercel DNS, domain re-verified, magic-link sign-in restored on apex + subdomains (was 500 Configuration since ~Apr 20). Welcome drip unblocked.
[2026-07-19] Claude → Ron: pj-s23-subdomain-auth-flow — server-side flow verified (subdomain sign-in renders church-scoped, magic link email sends). Awaiting Ron's browser click-test of testchurch magic link for cookie-domain acceptance criteria.
[2026-07-19] Claude → PM: board hygiene — 9 stale proposed tasks (SSO cluster x5, PDF cluster x4) set to abandoned-as-parked per Ron's 2026-04-19 decisions, with revival notes. Sprint 22/23 board now reflects reality.

[2026-07-20T01:31:39.897Z] Dashboard sync — 0 fix(es): 
[2026-07-19] Claude (Frontend) → Ron (visual QA): pj-s23-clay-token-alpha-tune — per-theme alpha tokens implemented per spec §2, deployed to prod. Check vessel washes/shadow on homepage + /my-prayers in light AND dark (light-mode shadow should soften noticeably: 0.40 → 0.18).
[2026-07-19] Ron → done: Sprint 23 CLOSED — subdomain auth click-test PASSED (cookie scoped to subdomain, apex isolated), clay alpha tune visual sign-off light+dark. testchurch subdomain row cleared.
[2026-07-19] PM → Team: Sprint 24 kicked off — production readiness + signed-in UI/UX polish. 11 tasks created (pj-s24-01..11). Roster: PM, Architect, Designer, Frontend, Backend, Performance, DevOps, QA, Reviewer. Brief: docs/sprint24/kickoff.md. Ron pre-approved sprint start.

[2026-07-20T01:42:25.284Z] Dashboard sync — 0 fix(es): 
[2026-07-19] Backend → QA: pj-s24-02-verify-url-fix — verify banner moved to clean /sign-in/verify route, proxy passes /sign-in/* through on subdomains. 11/11 proxy tests. Live check after deploy.
[2026-07-19] Backend → QA: pj-s24-01-test-suite-green — 5 stale-test failures fixed (Sprint 21-23 service drift: churchId in billing, tier limits in addChurchMember/createEvent, drizzle sql import, checkout route db lookup). Suite green: 60 files / 455 tests / 0 fail. Test files only, no production changes.
[2026-07-19] QA → PM: pj-s24-03-drip-health-check PASS — zero pending/stale drip rows in prod, no backfill needed. Flag for PM: 0 user signups during the 3-month email outage.
[2026-07-19] Reviewer → PM: pj-s24-01 APPROVED (suite 455/455 green, stale mocks updated, no prod regression) + pj-s24-02 APPROVED (live-verified clean verify URL). Both done.
[2026-07-19] Performance → Frontend: pj-s24-06 perf audit refresh DONE — all Sprint-14 findings still live, prioritized P1-P3 at docs/sprint24/perf-audit.md. pj-s24-07 unblocked.
[2026-07-19] Designer → Frontend: pj-s24-08 design audit DONE — 29 deltas / 9 pages at docs/sprint24/design-audit.md. pj-s24-09 implementation started.
[2026-07-19] DevOps → Ron: pj-s24-04 re-scoped (drains Pro-gated on Hobby) — /api/health endpoint shipped; Ron to point free Better Stack Uptime monitor at it.
[2026-07-19] Reviewer → PM: pj-s24-04 DONE — /api/health live + Better Stack Uptime monitor active (Ron-confirmed).
[2026-07-20] Frontend → QA/Ron: pj-s24-09 signed-in polish landed (commit 50bfa5c) — 29 audit deltas + app-wide arrow chrome sweep. Suite 459/459, no new type/lint errors. Awaiting Ron visual pass on prod.
[2026-07-20] Frontend → QA: pj-s24-07 perf fixes — P2 (lazy dialogs) + P3 (next/image) landed; P1 declined with documented reasoning (no static content to hoist; SEO metadata enriched instead). See docs/sprint24/perf-audit.md.
[2026-07-20] DevOps → PM: pj-s24-05 DONE — local dev+build restored (3 stacked causes: stale .next validators, missing ADMIN_EMAILS, missing CHMS_CONFIG_ENCRYPTION_KEY). No prod code changed. docs/ops/local-dev-setup.md.
