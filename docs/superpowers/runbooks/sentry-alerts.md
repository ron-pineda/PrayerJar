# Sentry Alert Rules — Runbook

**Audience:** Developer / DevOps  
**Last updated:** 2026-04-16  
**Status:** Human action required (create alert rule in Sentry dashboard)

---

## Alert: Auth Error Rate Spike

### Purpose

Detect a sudden spike in authentication errors (OAuth failures, email magic link failures, session errors) so they can be investigated before users report them en masse.

### Rule Configuration

| Field | Value |
|---|---|
| **Rule name** | Auth error rate spike |
| **Project** | prayerjar (select your Sentry project) |
| **Environment** | production |
| **Filter** | `transaction:GET /api/auth/* OR transaction:POST /api/auth/*` |
| **Condition** | `event.count() > 10` in a **5-minute sliding window** |
| **Action** | Send email notification to `ronnel.pineda@gmail.com` |
| **Frequency** | Once per 30 minutes (to avoid alert fatigue) |

---

## Step 1 — Create the Alert Rule

1. Log in to **[sentry.io](https://sentry.io)** and open the **PrayerJar** project.
2. Go to **Alerts** in the left sidebar → click **Create Alert**.
3. Select **Issues** as the alert type → click **Set Conditions**.
4. Configure as follows:
   - **Name:** `Auth error rate spike`
   - **Environment:** `production`
   - Under **Filters**, add: `transaction` `matches` `GET /api/auth/*`
   - Add a second filter (OR): `transaction` `matches` `POST /api/auth/*`
   - Under **Conditions**, set: `Number of events` `is more than` `10` in `5 minutes`
   - Under **Actions**, add: `Send an email` → `ronnel.pineda@gmail.com`
   - Under **Alert frequency**, set: `30 minutes`
5. Click **Save Rule**.

> **Tip:** Sentry's issue alert UI uses "IF / WHEN / THEN" phrasing. The transaction filter goes in the "IF" section (filters), and the event count goes in the "WHEN" section (conditions).

---

## Step 2 — Test the Alert

Use the synthetic error endpoint to trigger errors:

```bash
# Replace <token> with the value of SENTRY_DEBUG_TOKEN in Vercel env vars
for i in $(seq 1 11); do
  curl -s "https://prayerjar.org/api/debug/sentry?token=<token>" || true
  sleep 5
done
```

This fires 11 requests in ~55 seconds, which should exceed the `event.count() > 10 / 5 min` threshold.

**Expected result:** An email arrives at `ronnel.pineda@gmail.com` within a few minutes with subject line similar to:  
`[Sentry] Auth error rate spike — 11 events in prayerjar/production`

> **Note:** The debug endpoint throws a generic `Error`, not one scoped to `/api/auth/*`. To test the exact filter, you would need to fire errors from an actual auth route. The debug endpoint is sufficient for confirming Sentry capture and email delivery; the transaction filter can be confirmed via Sentry's alert preview feature.

---

## Step 3 — Silence / Resolve

- To **temporarily mute** the alert: Alerts → Auth error rate spike → Mute (choose duration).
- To **resolve a triggered alert**: Alerts → Incidents → mark as Resolved once the root cause is fixed.
- To **adjust threshold** if alerts are too noisy: edit the rule and raise the event count or widen the window.

---

## Adding Team Members

When the team grows, add additional recipients to the alert action:

1. Sentry → Alerts → Auth error rate spike → Edit.
2. Under **Actions**, click **Add action** → add each team member's email or Slack channel.
3. Alternatively, create a **Sentry Team** (Settings → Teams) and assign the alert to the team — all team members receive notifications automatically.

---

## Related Alert Ideas (Future Sprints)

| Alert | Condition | Priority |
|---|---|---|
| DB query timeout | `error.type:QueryTimeout` > 5 / 5 min | High |
| Unhandled promise rejection spike | `error.handled:false` > 20 / 5 min | Medium |
| Stripe webhook failure | `transaction:/api/stripe/webhook` error > 3 / 10 min | High |
| Email send failure | `message:*Resend*` OR `message:*nodemailer*` error > 5 / 10 min | Medium |

---

## Related

- Better Stack log drain runbook: `docs/superpowers/runbooks/better-stack-setup.md`
- Sentry debug endpoint: `GET /api/debug/sentry?token=<SENTRY_DEBUG_TOKEN>`
- Sentry project settings: [sentry.io/settings/](https://sentry.io/settings/) → select org → PrayerJar project
