# Sprint 22 Close — 2026-04-20

## Shipped
- pj-s22-01: Drizzle migration pipeline wired into deploy — automatic schema migrations on prod deploy
- pj-s22-02: Vercel deploy webhook hardened — checkout@v5, alert-on-failure GH issue, runbook at docs/ops/vercel-deploy.md
- pj-s22-03: Free tier member cap raised 50 → 75
- pj-s22-04: Banned hero phrase removed; PCO nightly sync qualifier added
- pj-s22-05: Subdomain architecture doc revised — SSO deferred, per-subdomain auth model documented
- pj-s22-08: PCO group persistence — chms_groups + chms_group_members tables, syncGroup on adapter, groups UI
- pj-s22-09: PCO weekly summary scheduler — Sunday 05:00 UTC cron, tier-gated, feature-flagged, admin visibility
- pj-s22-16: Subdomain routing — proxy.ts tenant resolution, tier gating, reserved words, launch checklist
- pj-s22-21: Network tier copy — custom subdomain live, enterprise login + custom analytics reports coming soon
- pj-s22-24: Clay vessel jar (shipped prior session)

## QA Evidence
- pj-s22-08: 5/5 unit tests PASS (docs/sprint22/qa/pco-group-test-plan.md)
- pj-s22-09: 15/15 unit tests PASS (docs/sprint22/qa/pco-summary-test-plan.md)
- pj-s22-16: 27/27 unit tests PASS; 3 DNS cases pending (docs/sprint22/qa/subdomain-test-plan.md)

## Claims-Implementation Parity
- Network tier: "Custom subdomain" = shipped, "Enterprise login coming soon" = not live, "Custom analytics reports coming soon" = not live
- Growing Church tier: "Advanced analytics & PDF reports" still claims PDF (pre-existing) → Sprint 23 fix (pj-s23-pro-tier-pdf-copy-fix)
- Hero: banned phrase removed, PCO qualifier honest

## Deferred to Sprint 23
- SSO chain: pj-s22-06/07/11/12/13 (zero enterprise demand, revisit when real church asks)
- PDF chain: pj-s22-10/14/15/20 (on-screen analytics live; downloadable PDF deferred)
- pj-s23-clay-token-alpha-tune (light-mode shadow renders ~2.2x spec intent)
- pj-s23-jar-mark-png-script-sync (public/email-assets/ is hand-synced)
- pj-s23-chms-group-membership-reconcile (stale member removal not implemented)
- pj-s23-pro-tier-pdf-copy-fix (Growing Church tier copy claim)
- pj-s23-subdomain-dns-smoke-test (DNS-dependent QA cases)

## Ron Actions Pending (see INBOX.md)
1. Clay vessel visual check at prayerjar.org (light + dark mode, 3 breakpoints)
2. Stale `src/app/preview/jar-slips/` route — delete or keep?
3. Subdomain DNS: complete docs/ops/subdomain-launch-checklist.md
4. Prod dry-run: `node scripts/migrate-dry-run.mjs` with prod DATABASE_URL
