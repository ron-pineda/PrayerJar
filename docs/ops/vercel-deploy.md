# Vercel deploy pipeline — runbook

## How production deploys work today

Production deploys are driven by **GitHub Actions**, not by Vercel's native Git integration.

- Workflow: `.github/workflows/deploy.yml`
- Trigger: any push to `feature/prayer-jar` (our unusual-but-intentional production branch)
- Steps: checkout → install Vercel CLI → `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod` → Sentry release → (on failure) open a GitHub issue labeled `deploy-failure`
- Secrets used: `VERCEL_TOKEN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- Vercel project linkage: `.vercel/project.json` (`projectId: prj_U98a9VT7zLcs0FLVPo43w9o3d8tj`, `orgId: team_kODw1brfKEbnSYNuRCExLcb3`, `projectName: prayer-jar`)

Vercel's own GitHub App / native Git integration is **not** the source of truth. This was an explicit choice in `pj-001` (2026-04-10) because the native integration kept breaking on the non-default branch name (`feature/prayer-jar`) and on the local-worktree deploy path. Do not re-enable native auto-deploy without first retiring `deploy.yml` — having both running will cause duplicate prod deploys per push.

## How to verify the pipeline is working

```bash
# last 10 Deploy to Vercel runs
gh run list --repo ron-pineda/PrayerJar --workflow deploy.yml --limit 10

# inspect a specific run
gh run view <run-id> --repo ron-pineda/PrayerJar --log

# only the failed steps of a run
gh run view <run-id> --repo ron-pineda/PrayerJar --log-failed
```

A healthy run completes in roughly 2–4 minutes and ends with a green "Deploy to production" step.

## How to manually deploy in an emergency

**Only when the pipeline is broken AND production is down.** Manual deploys mask CI failures and were the reason we thought the webhook was broken (see `pj-s22-02-vercel-webhook`, 2026-04-19).

```bash
# from the repo root, on the correct branch
vercel --prod
```

Immediately after any manual deploy, open an ops task to root-cause the pipeline failure that forced the manual step. A manual deploy is a warning signal, not a workflow.

## pj-001 and its "recurrence" (pj-s22-02), 2026-04-19

### pj-001 (2026-04-10, done)
Native Vercel Git integration was not triggering on pushes to `feature/prayer-jar`. Root cause: local worktree deploy path had confused the GitHub App, and the non-default branch name wasn't wired as production in Vercel. Fix: stopped relying on native integration, added `.github/workflows/deploy.yml` that runs the Vercel CLI from CI.

### pj-s22-02 (2026-04-19, false-alarm recurrence)
**The webhook was never broken.** The GitHub Actions workflow was firing normally on every push. The perception of breakage came from two adjacent causes:

1. **Silent build failures on 2026-04-19 03:52Z and 03:58Z** failed with `Error: CHMS_CONFIG_ENCRYPTION_KEY must be a 64-character hex string`. The workflow ran, but the Next.js build aborted during page-data collection because that production env var was missing in Vercel. With no alerting on failed runs, the failures looked like non-runs.
2. **Manual `vercel --prod` during the `/groups` outage hotfix** was a human workaround to bypass a red CI, not a compensation for a missing trigger. That in turn reinforced the (false) belief that the webhook was broken.

### Fixes applied in pj-s22-02
- Bumped `actions/checkout@v4` → `actions/checkout@v5` — clears the Node.js 20 deprecation warning (checkout v5 ships with Node.js 24 natively; the June 2026 deprecation deadline is no longer a ticking clock).
- Added an `if: failure()` step that opens a GitHub issue labeled `deploy-failure` / `ops` whenever any prior step in the job fails. This is the observable alert that was missing — failures will no longer be silent.

### Adjacent finding (not fixed here — out of scope)
The CHMS_CONFIG_ENCRYPTION_KEY env var appears to be missing or misformatted in Vercel production. The task that triggered this investigation was explicitly scoped to forbid mutating Vercel env vars. Surfaced to PM for a follow-up task to audit Vercel env vars against a checked-in manifest in `docs/env-vars.md`.

## Recurrence-prevention plan

1. **Alerting on every failed deploy run** — done via the `Alert on deploy failure` step in `deploy.yml`. Issues are filed under the `deploy-failure` label. Subscribe the ops/PM account to label notifications.
2. **No silent manual deploys** — when you hit `vercel --prod` by hand, open a task to investigate why the pipeline was bypassed. Manual deploys are a signal, not a habit.
3. **Before filing the next "auto-deploy is broken" ticket**, run `gh run list --repo ron-pineda/PrayerJar --workflow deploy.yml --limit 10`. If the last run succeeded, the trigger is fine and the real issue is somewhere else (build error, env var, branch protection, etc.).
4. **Do not add a second deploy path.** If native Vercel Git integration is ever re-enabled, either retire this workflow or guard the workflow with `if: github.event.head_commit.author.email != 'vercel-bot@...'` so you don't double-deploy.

## Repository facts (verify before editing)

- GitHub remote: `https://github.com/ron-pineda/PrayerJar.git` (verified 2026-04-19 from `.git/config`)
- Main branch: `feature/prayer-jar` (verified via `git branch`)
- Vercel project slug: `prayer-jar`
- Vercel team: `team_kODw1brfKEbnSYNuRCExLcb3`
