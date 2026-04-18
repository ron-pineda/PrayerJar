# Planning Center Integration — CS Rollout Playbook

**Date:** 2026-04-18
**Owner:** CustomerSuccess
**Related:** docs/legal/sprint18-chms-signoff.md, docs/sales/pco-integration-brief.md

---

## Rollout cohort (Phase 1)

**Target:** Existing paid churches on Growing Church ($49/mo) or Network ($199+/mo) with 150+ members who already use Planning Center as their ChMS.

**How to identify the cohort:**
- Check `churches.plan_tier` for `'pro'` or `'enterprise'`
- Cross-reference with the ChMS field on their enterprise demo form submission (field 7: "Planning Center" selected) — or reach out directly to confirm
- Member count: check `church_members` row count or ask during outreach

**Start date:** After QA sandbox sign-off (task pj-s18-13-qa-pco-integration-tests). Blocked on human action: obtain PCO sandbox organization + credentials so QA can run the 8 integration scenarios. Do not enable the in-app toggle until QA passes.

**Channel:**
1. Personal outreach from CS to each church admin in the cohort (email from hello@prayerjar.org, personalized)
2. In-app banner visible only to church admins on Growing Church or Network tier who have not yet connected Planning Center — display after QA sign-off

**Enterprise notice window (legal requirement):** Existing Enterprise (Network) churches must receive 30 days' advance notice before the PCO integration toggle is enabled for them. This window starts from the date the v1.1 sub-processor list was published (2026-04-18). Sales and CS jointly own this notice. Template is in the 30-day notice section below.

**Practical sequencing:**
- Non-Enterprise Growing Church churches: CS can enable the toggle and begin outreach immediately after QA sign-off
- Enterprise/Network churches: notice goes out 2026-04-18; earliest in-app toggle enabled 2026-05-18

---

## Post-launch monitoring checklist

Check these within 48 hours of the first church connecting Planning Center:

- [ ] **Vercel logs:** `/api/cron/chms-sync-runner` running on schedule (every 5 minutes). First run for a newly connected church should show `job_type: full_sync` and `processed > 0`.
- [ ] **Sentry:** No `chms_sync_failed` events for the first 3 churches. If they appear, check `error_class` — auth errors require immediate CS follow-up (see escalation path below).
- [ ] **Database:** `church_members.chms_synced_at` is populated for all members imported in the initial sync. A NULL value for a member means they were not yet processed by the sync runner.
- [ ] **Analytics:** `chms_connection_completed` events appearing in Vercel Analytics. Verify the event count matches the number of churches that have connected.
- [ ] **Manual spot check:** Ask one church admin in the cohort to confirm their member list matches what they see in Planning Center. This takes 5 minutes and catches any field-mapping issues the automated checks miss.
- [ ] **Weekly prayer summary notes:** After 7 days, check that PCO person records for at least one connected church show the weekly summary note. This confirms the write-back path (pushPrayerSummary) is operating.

---

## Common support questions + canned responses

**Q: My members aren't showing up after connecting**

A: The initial sync can take 2–5 minutes for churches with large rosters. To trigger a manual full sync right away, go to Settings → Integrations → Sync Now. If members still do not appear after 10 minutes, contact us with your church name and we will check the sync job logs directly.

---

**Q: I got an error saying "Planning Center authorization failed"**

A: This usually means the connection timed out or was revoked on the Planning Center side. Go to Settings → Integrations → Disconnect, then reconnect by clicking Connect Planning Center again and completing the authorization. If the error appears again after reconnecting, reply to this message and we will investigate.

---

**Q: Some members are missing**

A: PrayerJar syncs all members with active status in Planning Center. Members marked as inactive in PCO are not imported. Check your PCO member list and update any statuses if needed. Also confirm you are looking at the right list in PrayerJar — newly synced members appear in your Members section, not the prayer wall, until they accept their invitation.

---

**Q: Can we control which members get invited?**

A: Not in the current version. All active PCO members receive a PrayerJar invitation when the sync runs. A member who does not want to participate can ignore the invitation or later deactivate their PrayerJar account — this does not affect their Planning Center record. Selective invite filtering is on the roadmap for a future update.

---

**Q: Our small groups didn't sync**

A: Your Planning Center account may not include the Groups module, which is a paid add-on within PCO. PrayerJar notes this in Settings → Integrations if it cannot access group data. Member sync still works — only the group structure is missing. If you do have the PCO Groups module and groups still did not sync, contact us with your church name and we will review the sync logs.

---

**Q: Will disconnecting remove our members from PrayerJar?**

A: No. Disconnecting Planning Center stops future syncs, but all members already imported stay in PrayerJar. Their prayer history is not affected. If you later reconnect PCO (or connect a different ChMS), PrayerJar will reconcile the roster at the next sync.

---

**Q: What data does PrayerJar read from Planning Center?**

A: Only two things: (1) your member roster — first name, last name, email, phone, and membership status; and (2) your group structure (group name, description, and member list) if your PCO account includes the Groups module. PrayerJar does not access giving, check-ins, services, forms, calendar, or any other PCO module. Full details at prayerjar.org/legal/subprocessors.

---

## Escalation path for auth failures

When a church's sync jobs fail repeatedly with auth-class errors (Sentry shows `error_class: auth` or `error: PCO_AUTH_EXPIRED` / `error: PCO_REFRESH_FAILED` for the same church across multiple sync cycles):

1. **CS first check:** Look up the church in the admin dashboard (or ask Backend to run `SELECT * FROM chms_sync_jobs WHERE church_id = [id] ORDER BY created_at DESC LIMIT 10`). Confirm the error pattern — is it every job, or intermittent?

2. **If `error: PCO_AUTH_EXPIRED`:** The church's OAuth refresh token has expired and the auto-refresh failed. CS advises the church admin to reconnect: Settings → Integrations → Disconnect, then Connect Planning Center again. This refreshes the token pair.

3. **If `error: PCO_REFRESH_FAILED`:** Same remediation — reconnect. This usually means PCO revoked the token (the admin may have changed their PCO password or revoked connected apps in their PCO account settings).

4. **If the church reconnects and fails again within 24 hours:** Escalate to Backend for investigation. Do not tell the church to keep reconnecting. Possible causes: PCO API change, rate-limit issue for the church's org ID, or a bug in the token-refresh path. Backend should check the PCO rate-limit headers in the job logs and compare against the 100 req/min limit.

5. **Document the resolution:** Add a note to the church's admin dashboard record with the failure pattern, what was tried, and how it resolved. This helps CS pattern-match on the next occurrence.

---

## 30-day Enterprise notice window

Per Legal sign-off (docs/legal/sprint18-chms-signoff.md §3 and §6, condition 6): existing Enterprise/Network churches must receive 30 days' advance notice before the PCO integration toggle is enabled for them.

**Notice window opens:** 2026-04-18 (date v1.1 sub-processor list published)
**Earliest in-app toggle for Enterprise churches:** 2026-05-18

CS sends the notice. Sales is cc'd. Log the send date in the task notes for pj-s18-15.

**Template email:**

> **Subject:** New Feature: Connect Your Planning Center Organization to PrayerJar
>
> Hi [Admin Name],
>
> On May 18, 2026, PrayerJar will make Planning Center integration available to your church in Settings → Integrations.
>
> This integration lets PrayerJar read your Planning Center member roster and group structure so your congregation can join PrayerJar without a manual import. It adds Planning Center Online, Inc. as a sub-processor in how we handle your church's data. The full details are in our updated sub-processor list at prayerjar.org/legal/subprocessors and in our Data Processing Agreement at prayerjar.org/legal/dpa.
>
> No action is required before May 18. On or after that date, a church admin with Pastor or Admin role can connect Planning Center from Settings → Integrations.
>
> If you have questions or want to discuss the integration before it goes live, reply to this email or reach out to your CS contact directly.
>
> — The PrayerJar team

---

## CS outreach template (Growing Church, non-Enterprise)

For Growing Church churches eligible from day one (after QA sign-off, no 30-day wait):

> **Subject:** Your Planning Center org is now one click from PrayerJar
>
> Hi [Admin Name],
>
> PrayerJar now connects directly to Planning Center. If you go to Settings → Integrations and click Connect Planning Center, your member roster and small groups will sync automatically — no CSV, no manual entry.
>
> The connection requests read-only access to members and groups. It does not touch giving, check-ins, or any other PCO module. Full details at prayerjar.org/legal/subprocessors.
>
> If you run into anything, reply here or use the in-app contact form.
>
> — [Your name], PrayerJar CustomerSuccess
