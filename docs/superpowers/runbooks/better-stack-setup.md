# Better Stack Log Drain — Setup Runbook

**Audience:** Developer / DevOps  
**Last updated:** 2026-04-16  
**Status:** Human action required (Vercel Marketplace integration)

---

## Overview

Better Stack Logs (formerly Logtail) receives Vercel runtime logs via a native Vercel Marketplace integration. Once connected, every Vercel log line — including Next.js server logs, edge function output, and build logs — streams into Better Stack in real time.

---

## Step 1 — Install the Better Stack Vercel Integration

1. Go to **[vercel.com/dashboard](https://vercel.com/dashboard)** and select the **PrayerJar** project.
2. Navigate to **Integrations** in the left sidebar, then click **Browse Marketplace**.
3. Search for **"Better Stack"** (or **"Logtail"**).
4. Click **Add Integration** → select the **PrayerJar** project → click **Continue**.
5. You will be redirected to the Better Stack OAuth flow. Sign in (or create a free account at **[betterstack.com](https://betterstack.com)**).
6. Better Stack will prompt you to select or create a **Source**. Name it `prayerjar-vercel` and click **Connect**.
7. After authorization, Vercel stores the log drain endpoint automatically. No manual webhook URL entry is required.

> **Note:** The free Better Stack tier retains logs for 3 days. Upgrade to the Starter plan ($25/mo) for 7-day retention, which is sufficient for incident investigation.

---

## Step 2 — Verify Logs Are Streaming

1. Trigger a test log by visiting the app or hitting any authenticated endpoint.
2. In Better Stack, open the **Logs** tab and run the query:

   ```
   source:vercel
   ```

   You should see Vercel log lines appear within 30–60 seconds.

3. To filter for errors only:

   ```
   source:vercel level:error
   ```

4. To confirm auth-related logs:

   ```
   source:vercel "api/auth"
   ```

---

## Step 3 — Confirm the Drain Is Active

In **Vercel → Project → Settings → Log Drains**, you should see an active drain entry pointing to Better Stack. If it shows "inactive" or is missing:

1. Go to **Vercel → Integrations → Better Stack → Configure**.
2. Click **Remove** and repeat Step 1 to reinstall.

---

## Escalation: If Logs Stop Streaming

| Symptom | Action |
|---|---|
| No new logs in Better Stack for > 5 minutes | Check Vercel Log Drains (Settings → Log Drains) — drain may be paused |
| Drain shows "inactive" in Vercel | Remove and reinstall Better Stack integration |
| Log drain endpoint returns 4xx | Rotate the Better Stack source token: Better Stack → Sources → prayerjar-vercel → Regenerate token → update in Vercel |
| Build logs missing but runtime logs present | Build logs require a separate "Build log drain" — contact Better Stack support |
| Logs delayed > 2 minutes | Check Better Stack status page at [status.betterstack.com](https://status.betterstack.com) |

---

## Useful Better Stack Queries

```bash
# All errors in the last hour
source:vercel level:error

# Auth errors specifically
source:vercel level:error "api/auth"

# Sentry tunnel (confirms monitoring route is proxying)
source:vercel "/monitoring"

# Slow responses (if logging response time)
source:vercel "took" ms > 2000
```

---

## Related

- Sentry alerts runbook: `docs/superpowers/runbooks/sentry-alerts.md`
- Sentry debug endpoint: `GET /api/debug/sentry?token=<SENTRY_DEBUG_TOKEN>`
