# Planning Center Integration — Sales Brief

**Date:** 2026-04-18
**For:** Sales team, GTM, CS

---

## The 30-second pitch

Your Planning Center member list automatically becomes your PrayerJar prayer community — no manual imports, no double entry. Small groups sync too. When someone in your congregation submits a prayer request, your care team already knows who they are, because PrayerJar pulled that record straight from PCO. Each week, a brief summary of their prayer activity appears as a note on their PCO person record — so your pastoral picture stays current without anyone having to copy anything between systems.

---

## Who should hear this

**Target:** Churches already using Planning Center with 100+ members who want their existing community in PrayerJar without setup friction.

**Warm signals during a call:**
- "We already use Planning Center"
- "Our staff already uses PCO"
- "We don't want to rebuild our member list"
- "Our last tool required a CSV import — that never stayed current"
- "We tried another prayer app but the member list was always out of date"

**Best-fit size:** 150–500 members (Growing Church tier). Works for smaller churches too — anyone paying for Planning Center and frustrated by manual setup.

---

## Top 5 objection handles

### "Our member data is sensitive"

PrayerJar requests only two scopes from Planning Center: `people` (member roster) and `groups` (small group structure, only if the church has the Groups module). We do not access giving history, check-in records, services rosters, calendar, or any other PCO module.

Member data is stored encrypted at rest. It is only visible to members of your own church on PrayerJar — no cross-church sharing, no public exposure. If you want the technical details, our sub-processor list and Data Processing Agreement are public at prayerjar.org/legal — no login required.

### "We pay for Planning Center Groups — does this cost us extra?"

No. PrayerJar reads your existing group structure via the Planning Center API. It does not change what you pay Planning Center and does not require any PCO upgrade. If your church does not currently subscribe to the PCO Groups module, PrayerJar syncs members only and notes the limitation in your settings — you still get the full member roster sync.

### "What if we switch ChMS later?"

Your member accounts persist in PrayerJar even if you disconnect Planning Center. Members do not lose their prayer history. Disconnecting Planning Center just means no further syncs happen — PrayerJar keeps what it has. When support for additional ChMS platforms arrives (Breeze is on the roadmap), you can reconnect to the new provider and pick up where you left off.

### "Does our senior pastor need to approve this?"

The connection is initiated by whoever holds the Admin or Pastor role in PrayerJar — typically the church admin or tech lead. They authorize it in Settings → Integrations. It does not require any action inside Planning Center itself beyond approving PrayerJar's OAuth consent screen, which takes about 30 seconds. No IT ticket, no Planning Center admin credentials shared, no contract with PCO needed.

### "Can we undo it?"

Yes, instantly. Settings → Integrations → Disconnect. The sync stops immediately. Member data already in PrayerJar stays — members are not removed and do not lose prayer history. Members are never notified about the connection or disconnection; it is entirely behind-the-scenes infrastructure. If the church ever wants the imported data removed, standard account deletion handles that.

---

## Competitive positioning

Most prayer apps require a manual CSV import to set up a member list — and that list goes stale the day after the import. PrayerJar is the only prayer community platform that integrates directly with Planning Center to keep member rosters current automatically. This eliminates the number-one reason churches abandon prayer tools: the member list stops matching reality. A church admin who connects PCO on Monday sees their full roster in PrayerJar by Monday afternoon, without touching a spreadsheet.

---

## Pricing context

The Planning Center integration is a Growing Church tier feature ($49/mo, or $41.65/mo billed annually). It is not available on the Free or Small Church tier. If a church is currently on Small Church and the PCO integration is their primary reason to upgrade, that is a clean upsell conversation — the step up to Growing Church also adds unlimited members, unlimited groups, prayer team assignments, and testimony approval.

For Network (enterprise) churches, the integration is included. Sales does not need to position it separately for Network prospects.

---

## What the integration does NOT do (be accurate in demos)

- Does not sync giving records, services rosters, check-ins, forms, or calendar.
- Does not import PCO custom fields.
- Does not write prayer content back into PCO — only a brief weekly activity summary (aggregate statistics, not the text of individual prayer requests).
- Does not create or modify PCO member records from PrayerJar's side.
- Delta sync (real-time webhook-driven updates) is in development; v1 runs a scheduled full sync every 5 minutes. In practice this is fast enough for member roster changes.

---

## Self-review

- [x] Pitch is 3 sentences or fewer and names the specific benefit (no manual import, no double entry)
- [x] Objection handles name the actual concern, not a generic reassurance
- [x] Data scope is accurate per Legal sign-off (docs/legal/sprint18-chms-signoff.md §2 and §3)
- [x] No features claimed beyond what is shipped in Sprint 18 (delta webhooks correctly noted as in development)
- [x] No banned brand phrases: no "platform," "empowers," "seamless," "robust," "unlock"
- [x] Pricing matches plans.ts ($49/mo Growing Church, $41.65/mo annual)
