# Data Processing Addendum (DPA) — PrayerJar

**Document version:** v1.0-2026-04-17
**Last updated:** April 17, 2026

> **IMPORTANT — DRAFT NOTICE.** This document is an AI-drafted starting point.
> PrayerJar is not a law firm and this document is not legal advice. Both
> parties should have qualified legal counsel review and negotiate this
> Addendum before it is signed or relied upon.

---

## 1. Parties

This Data Processing Addendum ("**DPA**") is entered into between:

- **Customer / Controller:** the church, ministry, or nonprofit organization
  ("**Church**") that has an active subscription or contract with PrayerJar.
- **Processor:** The Prayer Jar ("**PrayerJar**"), operated by its
  owner/operator of record.

This DPA supplements and forms part of the PrayerJar Terms of Service.

## 2. Purpose

PrayerJar processes personal data on behalf of the Church in order to provide
the PrayerJar platform — a web and mobile prayer-community service including
(but not limited to) prayer request collection, pastoral-care workflows,
member care notes, church prayer walls, and related notification features.

This DPA is intended to be compatible with:

- EU General Data Protection Regulation (GDPR)
- UK GDPR and Data Protection Act 2018
- California Consumer Privacy Act / CPRA (to the extent applicable)
- Other comparable data-protection regimes

PrayerJar acts as a **data processor** with respect to Church personal data.
The Church remains the **data controller** and determines the purposes and
means of processing.

## 3. Data categories processed

Personal data processed under this DPA may include:

- Identifying data: name, email address, church role/membership
- Authentication data: magic-link tokens, session cookies
- User-generated content: prayer requests, testimonies, comments, pastoral
  notes, attached images or audio
- Contact metadata: prayer interactions ("I prayed"), partnership requests
- Device and usage data: IP address (limited retention), approximate country,
  browser/device type (via hosting provider and error-monitoring sub-processors)

**Special-category / sensitive data.** Prayer content frequently contains
health, religious, familial, or other sensitive information. PrayerJar treats
all prayer content and pastoral-care content as sensitive pastoral data and
does not use it for model training, advertising, or any secondary purpose.

## 4. Processing terms

PrayerJar will:

1. Process personal data **only on documented instructions** from the Church,
   including with regard to international transfers, unless required by law.
2. Ensure personnel authorized to process personal data are bound by
   confidentiality.
3. Implement appropriate **technical and organizational security measures**
   including encryption in transit (TLS), encryption at rest at the database
   layer, access controls, environment-variable secrets handling, and
   audit logs for admin actions.
4. Assist the Church in responding to **data-subject requests** (access,
   rectification, erasure, portability, restriction, objection) within a
   reasonable time after request.
5. Notify the Church of any **personal-data breach** without undue delay and
   in any event within **72 hours** of becoming aware, where feasible.
6. Make available information necessary to demonstrate compliance with this
   DPA and allow for audits as described in Section 10.
7. On termination, delete or return Church personal data as described in
   Section 9.

## 5. Sub-processors

The Church hereby authorizes PrayerJar to engage the sub-processors listed at
[/legal/subprocessors](/legal/subprocessors) ("**Sub-processor List**").

PrayerJar will:

- Maintain an up-to-date, public Sub-processor List.
- Impose data-protection obligations on each sub-processor no less protective
  than those in this DPA.
- Remain liable for its sub-processors' acts and omissions.
- Provide the Church with at least **30 days' notice** before adding a new
  sub-processor that processes Church personal data, during which the Church
  may object on reasonable data-protection grounds.

## 6. Data subject rights (DSAR)

PrayerJar will reasonably assist the Church in fulfilling its obligations to
respond to data-subject requests, including:

- Access and export of personal data via the Church's admin tooling and the
  `/api/v1/export` endpoint where applicable.
- Deletion of user accounts and associated prayer content upon verified
  request by the Church or end user.
- Rectification of inaccurate personal data on request.

Standard response target: **within 30 days** of a verified request.

## 7. Breach notification

On becoming aware of a personal-data breach affecting Church data, PrayerJar
will notify the Church's designated contact(s) within **72 hours**, providing:

- Nature of the breach and categories/volume of data and data subjects
  affected (to the extent known).
- Likely consequences.
- Measures taken or proposed to address the breach and mitigate its effects.

## 8. Data location

PrayerJar currently hosts production workloads with **Vercel** (primary
regions: United States) and stores primary data with **Neon** (United States).
International transfers from the EEA, UK, or Switzerland are governed by the
applicable Standard Contractual Clauses (SCCs) incorporated by reference.

The current list of data-handling sub-processors and their processing regions
is maintained at [/legal/subprocessors](/legal/subprocessors).

## 9. Term and termination

This DPA takes effect upon Church acceptance (click-through or signature) and
remains in effect for the duration of the Church's use of PrayerJar.

On termination or expiry of the underlying subscription:

1. PrayerJar will cease processing Church personal data except as required
   to complete in-flight operations.
2. Within **30 days**, PrayerJar will, at the Church's option, return or
   delete all Church personal data in its possession, except where retention
   is required by applicable law.
3. Backups containing Church personal data will be overwritten in the
   ordinary course of backup-retention cycles.

## 10. Audit rights

No more than **once per 12 months**, and on at least 30 days' prior written
notice, the Church may request reasonable information demonstrating
compliance with this DPA, including:

- A copy of the current Sub-processor List.
- A summary of PrayerJar's security measures.
- Applicable third-party audit reports (e.g., sub-processor SOC 2 summaries)
  where PrayerJar has rights to share them.

On-premises audits are not provided at the current plan tiers; they may be
negotiated as part of an Enterprise order form.

## 11. Liability

Liability under this DPA is subject to the limitations of liability set out
in the PrayerJar Terms of Service, except where applicable data-protection
law prohibits such limitation.

## 12. Governing law

This DPA is governed by the governing-law and venue provisions of the
PrayerJar Terms of Service, except to the extent applicable data-protection
law of the Church's home jurisdiction requires otherwise.

## 13. Nonprofit compatibility

This DPA is drafted to be compatible with the operational realities of
501(c)(3) nonprofit organizations and other ministries. Nothing in this DPA
requires the Church to accept terms that assume a for-profit commercial
relationship (for example, advertising identifiers, third-party marketing
cookies, or data-resale arrangements). PrayerJar does not use Church data
for advertising, resale, or AI-model training.

## 14. Order of precedence

If there is a conflict between this DPA and the PrayerJar Terms of Service or
Privacy Policy, this DPA controls with respect to the processing of personal
data.

---

## Acceptance

A Church representative with authority to bind the Church may accept this
DPA by clicking "**I accept**" on the public DPA page at
[/legal/dpa](/legal/dpa). The acceptance record includes:

- Church identifier
- Accepting user identifier
- Document type: `dpa`
- Document version: `v1.0-2026-04-17`
- Accepted-at timestamp
- Originating IP address

An Enterprise Church may alternatively request a counter-signed version of
this DPA as part of the Enterprise order-form process.

---

### Reminder

This document is a draft. PrayerJar is not a law firm. Consult qualified
counsel before relying on this document.
