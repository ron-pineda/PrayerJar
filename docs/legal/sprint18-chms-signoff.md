# Sprint 18 — ChMS Integration Legal Sign-Off

**Task:** pj-s18-01-legal-pco-subprocessor
**Author:** Legal (agent)
**Date:** 2026-04-18
**Decision:** **GO** — Integrations agent may proceed with Planning Center implementation, subject to the conditions in §6 below.

---

## 1. Scope of review

Sprint 18 introduces a new data flow: PrayerJar will act as an OAuth client to Planning Center Online's REST API on behalf of a Church admin who explicitly connects the integration. This memo documents the legal posture for that flow.

In-scope:

- Adding Planning Center (PCO) as a sub-processor.
- Updating PrayerJar's DPA to describe ChMS data flow.
- Reviewing PCO's own public commitments for conflicts with PrayerJar's existing DPA.
- Confirming the data-minimization and consent posture are defensible.

Out-of-scope (explicitly):

- Breeze, Elvanto, and other ChMS platforms — each will require a separate sign-off when added to the roadmap. This memo covers PCO only.
- Write-back of prayer content into PCO beyond the narrow weekly-summary Note described below.

## 2. Data flow summary

**Inbound (PCO → PrayerJar), opt-in per Church:**

- Member rosters: first name, last name, primary email, phone (where stored by the Church), membership status.
- Small-group rosters: group name, description, and member list.

**Outbound (PrayerJar → PCO), per-Church feature flag:**

- Weekly prayer-activity summary written as a Note on the PCO person record. The Note contains aggregate statistics (e.g., "prayed for 3 requests this week") — not prayer-content text.

**Scopes requested from PCO OAuth:**

- `people` — read members.
- `groups` — read small groups (only when the Church has the Groups module).

Per the architecture spec at `docs/architecture/chms-integration-layer.md`, PrayerJar will store the PCO access + refresh tokens inside an AES-256-GCM-encrypted `chmsConfig` envelope on the `churches` row. Secret review is a separate gate (pj-s18-04) that must sign off before any OAuth token is persisted.

## 3. Sub-processor entry — added

Planning Center Online, Inc. has been added to `src/app/(public)/legal/subprocessors/data.ts` as the ninth sub-processor. The `SUBPROCESSOR_LIST_VERSION` has been bumped to `v1.1-2026-04-18`. This is a material change — Enterprise Churches get the 30-day advance notice required by §5 of the DPA, starting from the date this list is published.

Practical effect on release plan: Sprint 18 engineering can proceed today. The **customer-facing availability** of the PCO integration (i.e., when a Church admin can actually click "Connect Planning Center" in the dashboard) must not precede the 30-day notice window for existing Enterprise Churches. Sales / CustomerSuccess should confirm the notice went out before the in-app toggle is flipped. If the 30-day window is shorter than the engineering timeline, this constraint is self-resolving.

## 4. DPA update — done

`src/app/(public)/legal/dpa/constants.ts` has been updated to DPA version `v1.1-2026-04-18`. Section 3 ("Data categories processed") now includes an explicit bullet for ChMS-integrated data, covering the inbound + outbound flows described above, and making clear that:

- Connection is **opt-in per Church** (no automatic or inherited ChMS import).
- The Church can revoke the connection at any time.
- The Sub-processor List is the authoritative source for the current ChMS integration partner(s).

No changes were made to Sections 4 (processing terms), 5 (sub-processor obligations), 7 (breach notification), or 8 (data location) — PCO operates under the same processor model and US data location as the existing sub-processor set, so the existing obligations carry.

**Re-consent behavior:** The DPA version bump from v1.0 → v1.1 is material. Any Church that previously clicked-through v1.0 should be re-prompted to accept v1.1 before the PCO integration is enabled for that Church. The existing `dpa_acceptances` table keyed by `documentVersion` already handles this correctly — no code change is needed, only an operational note for the Integrations and CustomerSuccess agents when the in-app "Connect PCO" flow is built (tasks pj-s18-08 and later).

## 5. Review of PCO's own commitments

Legal reviewed PCO's public legal documents at [planningcenter.com/legal/dpa](https://www.planningcenter.com/legal/dpa) and [planningcenter.com/legal/privacy](https://www.planningcenter.com/legal/privacy) as of this memo's date. Relevant observations:

- **Controller/processor posture is compatible.** PCO acts as the processor for the Church's member data. When PrayerJar integrates via OAuth initiated by the Church, PrayerJar becomes a sub-processor *from the Church's perspective*, consistent with the existing PrayerJar DPA Section 2 framing.
- **No conflicting data-residency commitments.** PCO hosts in the United States, matching PrayerJar's existing US data-location posture (DPA §8). No additional SCC work is triggered beyond what PrayerJar already has in place for EEA/UK Churches.
- **No blocking IP / reuse clause.** PCO's ToS do not forbid PrayerJar from reading data on behalf of a connected organization, nor from writing a Note on a person's record, provided the action is authorized by the connected Church.
- **Rate limits are a PrayerJar engineering concern, not a legal one.** 100 req/min per organization is enforced by PCO; exceeding it is an operational/integration concern, not a legal one.
- **Webhook PII exposure.** PCO webhooks include PII (name, email) in the payload. PrayerJar must verify HMAC signatures on every webhook (pj-s18-07 acceptance criteria #3) and must not log webhook bodies to any non-encrypted sink. This is already covered by the task specs.

**No conflicts found.** PrayerJar's existing DPA commitments can be upheld alongside PCO's own terms.

## 6. Conditions on the GO decision

The Integrations agent may proceed with pj-s18-05 (OAuth) and pj-s18-06 (adapter sync) **immediately**, subject to these non-negotiable conditions:

1. **Encryption of OAuth tokens at rest.** Access + refresh tokens for PCO must only ever be written to the database through the AES-256-GCM envelope implemented in pj-s18-03 and reviewed in pj-s18-04. No plaintext PCO tokens in any log, Sentry breadcrumb, error payload, or cache. This is a hard gate — if the encryption work slips, OAuth work must wait on it.
2. **Webhook signature verification is mandatory.** Every incoming PCO webhook must pass HMAC signature verification before any side effect. Log-only mode is not an acceptable fallback.
3. **Scope minimalism.** PrayerJar must request only the `people` and (conditionally) `groups` scopes. Any future expansion to Giving, Services, or Check-Ins requires a separate Legal sign-off — do not silently widen the scope.
4. **In-app copy must explain the data flow.** The "Connect Planning Center" UI must name the data categories being imported, name PCO as the source, and link to the sub-processor list. CustomerSuccess / Frontend are jointly on the hook for this — task pj-s18-12 already calls out this requirement.
5. **Revocation must actually revoke.** When a Church disconnects PCO, PrayerJar must (a) invalidate its copy of the access + refresh tokens, (b) stop all background sync jobs for that Church, and (c) leave the previously-imported member records in the `church_members` table unless the Church also deletes their church. Passive disconnection that still pulls data is unacceptable. Task pj-s18-11 acceptance criteria must explicitly cover this.
6. **Enterprise notice window.** Per §3 above, the customer-facing "Connect Planning Center" toggle cannot be enabled for existing Enterprise Churches until at least 30 days after the v1.1 sub-processor list is published. Sales and CustomerSuccess own the notice; this memo is not a substitute for it.

Failure on any of these conditions during implementation should be routed back to Legal for re-review before the feature ships to Enterprise tenants.

## 7. Matters explicitly NOT covered

This memo does not replace counsel on any of the following. If any of these situations arise, escalate to the founder before proceeding:

- A Church customer in the EU requests to designate their own SCCs with different terms.
- A Church subject to HIPAA (e.g., a church-hospital partnership) wants to import protected health information via PCO custom fields. PrayerJar's current DPA does not contemplate PHI, and health-grade safeguards are not in place.
- PCO changes its own DPA or privacy posture in a way that materially narrows what sub-processors can do.
- A data-subject erasure request that specifically targets ChMS-sourced data (the delete path must reach the imported `church_members` rows — confirm during QA).

**This requires real legal counsel.** I have drafted a working legal posture for an MVP integration; any enterprise customer pushing back on any term, or any novel regulatory situation, should not be answered by this memo alone.

## 8. Files touched in this sign-off

- `src/app/(public)/legal/subprocessors/data.ts` — added PCO entry, bumped version + date.
- `src/app/(public)/legal/dpa/constants.ts` — bumped DPA_VERSION to v1.1-2026-04-18.
- `src/app/(public)/legal/dpa/page.tsx` — added ChMS-integrated data bullet to Section 3.
- `docs/legal/sprint18-chms-signoff.md` — this memo.

## 9. Handoff

- **Integrations agent:** unblocked for pj-s18-05 and pj-s18-06, subject to the six conditions in §6.
- **Security agent:** pj-s18-04 (encryption review) remains on the critical path — Integrations cannot write a PCO token until Security signs off.
- **CustomerSuccess + Sales:** own the 30-day Enterprise notice window. Please confirm notice dispatch date back to PM and update the relevant task note.
- **PM:** please review + approve this memo, or flag objections. After approval, I'll mark pj-s18-01 status `review` and hand back up.
