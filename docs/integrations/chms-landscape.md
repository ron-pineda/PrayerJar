# ChMS Integration Landscape Survey

**Task:** pj-s17-chms-integration-survey  
**Author:** Integrations Agent  
**Date:** 2026-04-17  
**Status:** Complete — feeds pj-s17-chms-architecture

---

## Purpose

This document surveys four Church Management Software (ChMS) platforms — Planning Center, Elvanto, ChurchTrac, and Breeze — across the dimensions that determine integration feasibility for PrayerJar: auth model, member-sync endpoints, rate limits, webhook support, sandbox availability, and the minimum viable scope for our three use cases (import members, sync small groups, push prayer summary back).

It closes with a ranked recommendation on which 1–2 platforms to build first.

---

## 1. Planning Center

**Vendor:** Planning Center Online, Inc.  
**Market position:** Largest ChMS by active-organization count (~73,000 churches). Strong in mid-size US congregations (200–2,000 attenders). Modular subscription (People, Groups, Giving, Services, etc.).  
**Source docs:** [developer.planning.center/docs](https://developer.planning.center/docs) · [Getting Started](https://api.planningcenteronline.com/docs/overview/getting-started) · [Introducing Webhooks](https://www.planningcenter.com/blog/2017/09/webhooks)

### Auth Model

**OAuth 2.0** (mandatory for third-party apps). Also supports Personal Access Tokens (PAT) for single-org developer tools.

- Register app at `https://api.planningcenteronline.com/oauth/applications`
- Receive `client_id` + `client_secret`
- Standard authorization code flow; tokens scoped per Planning Center app (People, Groups, etc.)
- **OpenID Connect (OIDC)** added in 2024 for privacy-focused sign-in flows — existing OAuth 2.0 integrations are unaffected
- PATs are single-org only; PrayerJar must use OAuth for multi-church support

### Member-Sync Endpoints

Base URL: `https://api.planningcenteronline.com`

| Purpose | Method | Endpoint | Notes |
|---|---|---|---|
| List all people | GET | `/people/v2/people` | Paginated; returns id, name, email, phone, status |
| Get single person | GET | `/people/v2/people/{id}` | Full profile including custom fields |
| List all groups | GET | `/groups/v2/groups` | Requires Groups module subscription |
| Get group members | GET | `/groups/v2/groups/{id}/memberships` | Returns person_id + role |
| Get group details | GET | `/groups/v2/groups/{id}` | Name, description, schedule |

The People module covers first name, last name, email, phone, address, membership status, and any custom fields the church defines. The Groups module is a separate paid add-on, but it is the relevant object for small-group sync.

**Rate Limit:** 100 requests per minute per organization.  
Source: [Rollout API Essential Guide](https://rollout.com/integration-guides/planning-center/api-essentials)

Pagination is cursor-based via `links.next` in the JSON response body.

### Webhook Support

**Yes — full webhook system.**

- Events available for People application: `person.created`, `person.updated`, `person.deleted`, `profile_picture.uploaded`, `email.created`, `email.updated`, `address.created`, `address.updated`
- Webhooks configured via developer dashboard or via `POST /webhooks` API endpoint
- Payload is JSON; signature verification available via HMAC
- Webhooks launched 2017 and have expanded to cover other apps (Giving, Services, etc.)

Source: [Introducing Webhooks blog post](https://www.planningcenter.com/blog/2017/09/webhooks) · [GitHub smadeira/planning-center-webhooks](https://github.com/smadeira/planning-center-webhooks)

### Sandbox / Test Environment

**Yes.** Planning Center provides a free tier with full API access. Developers can:
1. Create a free Planning Center organization account
2. Load sample data via the developer portal
3. Register OAuth apps and test end-to-end without a paid subscription

Sign-up: [planningcenter.com](https://www.planningcenter.com/) (free tier available)  
Developer registration: [api.planningcenteronline.com/oauth/applications](https://api.planningcenteronline.com/oauth/applications)

Note: Groups is a paid module — testing Group endpoints requires the $14/month Groups add-on or borrowing credentials from a church customer willing to test.

### Minimum Viable Integration Scope for PrayerJar

| PrayerJar Capability | Approach | Endpoints Used |
|---|---|---|
| Import members | Poll `GET /people/v2/people` on first connect; use `person.created`/`person.updated` webhooks for delta sync | `/people/v2/people` |
| Sync small groups | Poll `GET /groups/v2/groups` + `/groups/{id}/memberships` on connect; no group webhooks currently available | `/groups/v2/groups`, `/groups/{id}/memberships` |
| Push prayer summary back | No native PCO endpoint accepts inbound prayer data. Workaround: create a Note (`POST /people/v2/people/{id}/notes`) on the person record with a weekly prayer summary | `/people/v2/people/{id}/notes` |

MVP implementation sequence: OAuth connect flow → initial member import → webhook subscription for delta → group polling (scheduled, e.g., nightly) → weekly summary push via person notes.

### Estimated Integration Effort

**6–8 days** (solo engineer, including OAuth flow, initial sync, webhook handler, group polling, summary push, and integration tests against sandbox).

---

## 2. Elvanto (by Tithely)

**Vendor:** Elvanto, acquired by Tithely in November 2018. Continues as a separate product.  
**Market position:** Mid-tier ChMS with a following in Australia, New Zealand, UK, and expanding US presence. Used by churches in 45+ countries. Tithely's acquisition makes it part of a larger suite (Tithely Giving + ChMS).  
**Source docs:** [elvanto.com/api](https://www.elvanto.com/api/) · [Getting Started](https://www.elvanto.com/api/getting-started/) · [Webhooks](https://help.elvanto.com/hc/en-us/articles/7625995285143-How-to-Set-up-Webhooks)

### Auth Model

**Both OAuth 2.0 and API Key** are supported.

- OAuth 2.0 is the recommended path for third-party integrations
- Bearer token in `Authorization` header: `Authorization: Bearer {access_token}`
- Access tokens have a configurable expiry; apps must implement token refresh
- API key is available as a simpler alternative for single-organization deployments, but OAuth is preferred for PrayerJar's multi-church model

Source: [Getting Started guide](https://www.elvanto.com/api/getting-started/)

### Member-Sync Endpoints

Base URL: `https://api.elvanto.com/v1`

| Purpose | Method | Endpoint | Notes |
|---|---|---|---|
| List all people | POST | `/people/getAll.json` | Paginated; fields parameter controls which data is returned |
| Get single person | POST | `/people/getInfo.json` | Full profile |
| List all groups | POST | `/groups/getAll.json` | Returns id, name, description |
| Get group members | POST | `/groups/getInfo.json` | Includes member list |

Note: Elvanto's API uses **POST for read operations** (non-standard), with JSON request bodies. This is a consistent pattern across the entire API — not a bug.

Fields available for people: first name, last name, email, phone, gender, birthday, address, marital status, membership date, custom fields.

**Rate Limit:** Not publicly documented. Elvanto's API documentation does not specify a rate limit number. Recommend implementing conservative rate limiting (60 req/min) and monitoring for 429 responses.

Source: [people/getAll docs](https://www.elvanto.com/api/people/getAll/) · [groups/getAll docs](https://www.elvanto.com/api/groups/getAll/)

### Webhook Support

**Partial — very limited.**

Two webhook event types documented as of 2024–2026:
- `peopleflow:member:add` — fires when a person is added to a people flow step
- `form:submission:create` — fires when a form submission is created

**No webhook events for person creation, person update, or group membership changes.** This means member sync must be fully polling-based — no real-time delta capability.

Source: [How to Set up Webhooks – Elvanto](https://help.elvanto.com/hc/en-us/articles/7625995285143-How-to-Set-up-Webhooks)

### Sandbox / Test Environment

**No dedicated sandbox.** Elvanto does not publish a sandbox environment or a free developer tier. Developers must have an active Elvanto account (paid) to test against the live API. Elvanto's pricing starts around $75/month.

This is a significant friction point for development and CI integration testing.

### Minimum Viable Integration Scope for PrayerJar

| PrayerJar Capability | Approach | Endpoints Used |
|---|---|---|
| Import members | Poll `POST /people/getAll.json` on connect and on a recurring schedule (no webhooks) | `/people/getAll.json` |
| Sync small groups | Poll `POST /groups/getAll.json` + `/groups/getInfo.json` on schedule | `/groups/getAll.json`, `/groups/getInfo.json` |
| Push prayer summary back | No inbound write endpoint documented for prayer data. Would require Elvanto support confirmation; closest option is a custom field update via `POST /people/update.json` if writable custom fields are supported | TBD — requires API experimentation |

MVP is purely polling-based. Higher polling frequency is required to stay current, which amplifies the undocumented rate-limit concern.

### Estimated Integration Effort

**8–10 days** (OAuth flow, polling sync, group sync, prayer summary push research + implementation, integration tests — harder without a sandbox; adds testing friction and iteration cycles).

---

## 3. ChurchTrac

**Vendor:** ChurchTrac Software  
**Market position:** Budget-focused ChMS targeting small US churches. Plans start at $9/month. Emphasizes ease of use. User base is estimated in the thousands (smaller than PCO or Breeze).  
**Source docs:** [churchtrac.com](https://www.churchtrac.com/) · [FAQs](https://www.churchtrac.com/support/getting_started/churchtrac-faqs)

### Auth Model

**No public API.** ChurchTrac does not expose an open REST API for third-party integrations.

- No OAuth 2.0 flow available
- No API key mechanism available to external developers
- The only integrations supported are pre-built connectors: MinistrySafe (background checks), Stripe, PayPal, QuickBooks, SongSelect, and Zapier (for simple trigger/action workflows)

Source: [ChurchTrac website](https://www.churchtrac.com/) · [SoftwareWorld review 2026](https://www.softwareworld.co/software/churchtrac-reviews/)

### Member-Sync Endpoints

**None available.** No documented REST endpoints for member data access.

### Webhook Support

**No.** No webhook infrastructure documented or available to external developers.

### Sandbox / Test Environment

**Not applicable** — no API to test against.

### Minimum Viable Integration Scope for PrayerJar

**Not feasible via API.** The only possible ChurchTrac → PrayerJar data flow would be through:
- Manual CSV export from ChurchTrac + CSV import into PrayerJar (a one-time, non-automated path)
- A Zapier intermediary, which would require a PrayerJar Zapier app to be built and published

Neither path satisfies PrayerJar's need for automated member sync, small group sync, or prayer summary push-back. This integration cannot be built to the specified acceptance criteria without ChurchTrac opening an API.

### Estimated Integration Effort

**Not feasible.** No actionable API exists. Building a Zapier app is a separate product/growth track, not an integration sprint deliverable.

---

## 4. Breeze ChMS

**Vendor:** Breeze ChMS (now part of Tithely following a 2025 acquisition/partnership — note: Planning Center also announced a data-sync partnership with Breeze in March 2025)  
**Market position:** ~11,000+ churches, primarily small US congregations (under 200 attenders). Positioned as "the world's easiest ChMS." Direct competitor to ChurchTrac on price and simplicity.  
**Source docs:** [app.breezechms.com/api](https://app.breezechms.com/api) · [API Fundamentals](https://docs.breeze.com/docs/api-fundamentals) · [support article](https://support.breezechms.com/hc/en-us/articles/360001324153-API-Advanced-Custom-Development)

### Auth Model

**API Key only.** No OAuth 2.0 available.

- API key is scoped per Breeze account (per church)
- Account Owner retrieves key from: `Manage Account > API Key`
- Key is passed as HTTP Basic Auth username with an empty password: `Authorization: Basic base64(api_key:)`
- No refresh token or expiry; key is static until manually rotated
- This means PrayerJar must store one API key per connected church in the database, which has security implications (keys are long-lived credentials, not short-lived tokens)

Source: [API Fundamentals](https://docs.breeze.com/docs/api-fundamentals) · [breeze-chms npm package](https://www.npmjs.com/package/breeze-chms)

### Member-Sync Endpoints

Base URL: `https://{subdomain}.breezechms.com/api`

Each church has its own subdomain (e.g., `mychurch.breezechms.com`), which means PrayerJar must store the subdomain per church alongside the API key.

| Purpose | Method | Endpoint | Notes |
|---|---|---|---|
| List all people | GET | `/api/people` | Optional `details=1` for full profile; `limit` and `offset` for pagination |
| Get single person | GET | `/api/people/{id}` | Full profile |
| List tag folders (groups) | GET | `/api/tags/list_folders` | Returns folder id, name, parent_id |
| List tags in folder | GET | `/api/tags/list_tags` | `folder_id` param; returns tag id, name |
| Get people by tag | GET | `/api/people?filter_json=...` | JSON filter `{"tag_contains": "y_{tag_id}"}` URL-encoded; results may be cached up to 15 minutes |
| Assign tag to person | GET | `/api/tags/assign?person_id=&tag_id=` | Adds person to a group/tag |
| Unassign tag | GET | `/api/tags/unassign?person_id=&tag_id=` | Removes person from group |

Note: Breeze uses **Tags** to represent groups (small groups, teams, classes). There is no first-class "group" object — groups are modeled as tag folders containing tags, and people are assigned to tags.

People fields available: id, first name, last name, email, phone, address, birthdate, custom profile fields.

**Rate Limit:** 20 requests per minute. Exceeding this results in a temporary IP block.  
Recommended: wait ~3.5 seconds between calls.  
Source: [API documentation](https://support.breezechms.com/hc/en-us/articles/360001324153-API-Advanced-Custom-Development)

**Important:** Breeze's support team has explicitly stated they cannot assist with API usage (policy since February 2020). Developers are on their own.

### Webhook Support

**No documented webhook support.** Breeze's API is purely pull-based. There is no mechanism for Breeze to push events to PrayerJar — all sync must be polling-based.

Source: No webhook documentation found at app.breezechms.com/api or in the GitHub wrapper library.

### Sandbox / Test Environment

**No dedicated sandbox.** No free developer tier or test environment. Development requires an active paid Breeze account.

However, the npm package `breeze-chms` and `BreezeChMS/breeze-api-v1` GitHub repo provide wrappers that can be mocked for unit tests. Integration tests require a live account.

Source: [GitHub BreezeChMS/breeze-api-v1](https://github.com/BreezeChMS/breeze-api-v1) · [Notebird breeze-chms npm](https://www.npmjs.com/package/breeze-chms)

### Minimum Viable Integration Scope for PrayerJar

| PrayerJar Capability | Approach | Endpoints Used |
|---|---|---|
| Import members | Poll `GET /api/people?details=1` paginated; no webhook, so schedule a recurring sync | `/api/people` |
| Sync small groups | Poll `GET /api/tags/list_folders` + `/api/tags/list_tags`; map tags to PrayerJar groups; 15-min cache lag | `/api/tags/list_folders`, `/api/tags/list_tags`, `/api/people?filter_json=...` |
| Push prayer summary back | No native inbound write for prayer summaries. Workaround: assign a "Prayed For" tag to people who received prayer that week via `/api/tags/assign`. Richer summary would require a custom field update if Breeze exposes profile field writes. | `/api/tags/assign` |

Note: The 20 req/min rate limit is the binding constraint. For a church with 500 members, a full detail sync requires 50 paginated requests (10 people/page default) — that's 2.5 minutes of API time at the minimum safe pace.

### Estimated Integration Effort

**5–7 days** (no OAuth complexity since it's API key; simpler auth flow to build; polling sync, tag-based group mapping, tag-assign summary push, integration tests). Rate limit management and subdomain-per-church storage add modest complexity.

---

## Ranked Recommendation

### Tier 1 (Build in Sprint 18): Planning Center

**Rationale:** Planning Center is the right first integration for three compounding reasons.

First, **market coverage is decisive**: PCO serves ~73,000 churches including the mid-size congregations (200–2,000 attenders) that are PrayerJar's primary enterprise and growing-church targets. Any church administrator who has heard of ChMS has heard of Planning Center; "We integrate with Planning Center" is a trust signal that Breeze or Elvanto cannot match in those segments.

Second, **API quality is substantially higher**: OAuth 2.0 means PrayerJar can support many churches without storing long-lived credential secrets per church. Webhooks for person events (`person.created`, `person.updated`) eliminate the polling burden for member sync and allow near-real-time data freshness. A free-tier sandbox with sample data means integration tests can run in CI without requiring a paid church account.

Third, **the Architect's reference implementation** (pj-s17-chms-architecture) benefits from a well-documented, webhook-capable, OAuth-first API as the template. The adapter interface being designed will be cleaner when the reference is PCO rather than a polling-only, API-key-only system.

Blockers to resolve before Sprint 18: confirm Groups module access strategy (need to document what behavior degrades when a church has People but not Groups subscription); acquire a free PCO organization for CI sandbox.

### Tier 2 (Build in Sprint 19 or when customer pull justifies): Breeze

**Rationale:** Breeze's 11,000+ church customer base is the second-largest single-vendor opportunity among platforms with a workable API, and those churches are almost entirely in PrayerJar's small-church segment (under 200 attenders). The integration is simpler to build than PCO (no OAuth complexity, no token refresh), but the tradeoffs are real: API key storage per church, no webhooks (polling only at a strict 20 req/min), no sandbox. The 15-minute cache lag on tag-filtered people queries also complicates group sync accuracy.

Build Breeze second once the adapter interface is proven with PCO. The polling-only model will slot cleanly into the retry/backoff infrastructure the Backend team builds for PCO. The primary customer signal to watch: if inbound church leads are citing Breeze as their ChMS in the demo-request form (pj-s17-enterprise-demo-flow), accelerate Breeze to Sprint 18 in parallel.

### Do Not Build (in any sprint without a product decision): ChurchTrac

ChurchTrac has no public API and no OAuth/webhook surface. Building an integration is not possible without a Zapier app (a separate product track) or ChurchTrac opening their API. Remove from the integration roadmap until ChurchTrac publishes a REST API.

### Elvanto: Deprioritize

Elvanto's limited webhook support (two event types, neither covering member changes), lack of sandbox, and small US market footprint relative to PCO and Breeze make it a low-priority integration. If a cluster of Elvanto churches expresses demand, revisit — the OAuth API is functional enough to build against. Estimated market fit for PrayerJar is modest; Elvanto skews toward service-planning-heavy churches rather than prayer-community-focused ones.

---

## Summary Table

| | Planning Center | Elvanto | ChurchTrac | Breeze |
|---|---|---|---|---|
| Auth model | OAuth 2.0 + OIDC | OAuth 2.0 or API key | None (no API) | API key only |
| Member list endpoint | `GET /people/v2/people` | `POST /people/getAll.json` | N/A | `GET /api/people` |
| Group sync endpoint | `GET /groups/v2/groups` | `POST /groups/getAll.json` | N/A | `GET /api/tags/list_tags` |
| Rate limit | 100 req/min | Undocumented | N/A | 20 req/min |
| Webhooks | Yes (person events) | Partial (2 non-member events) | No | No |
| Sandbox available | Yes (free tier) | No | N/A | No |
| Prayer summary push-back | Via person Notes API | Via custom field (unconfirmed) | N/A | Via tag assignment |
| Est. build effort | 6–8 days | 8–10 days | Not feasible | 5–7 days |
| **Build priority** | **#1 — Sprint 18** | Deprioritize | Skip | **#2 — Sprint 19** |

---

## Sources

- [Planning Center API Documentation](https://developer.planning.center/docs/)
- [Planning Center Getting Started](https://api.planningcenteronline.com/docs/overview/getting-started)
- [Planning Center Introducing Webhooks](https://www.planningcenter.com/blog/2017/09/webhooks)
- [Planning Center OpenID Connect announcement](https://www.planningcenter.com/changelog/integrations-api/new-openid-connect-for-privacy-conscious-authentication)
- [Planning Center API Essential Guide — Rollout](https://rollout.com/integration-guides/planning-center/api-essentials)
- [Elvanto API Documentation](https://www.elvanto.com/api/)
- [Elvanto Getting Started](https://www.elvanto.com/api/getting-started/)
- [Elvanto people/getAll](https://www.elvanto.com/api/people/getAll/)
- [Elvanto groups/getAll](https://www.elvanto.com/api/groups/getAll/)
- [Elvanto Webhooks setup](https://help.elvanto.com/hc/en-us/articles/7625995285143-How-to-Set-up-Webhooks)
- [Elvanto Review — acquired by Tithely](https://churchmemberpro.com/blog/elvanto-ucare-review/)
- [ChurchTrac website](https://www.churchtrac.com/)
- [ChurchTrac FAQs](https://www.churchtrac.com/support/getting_started/churchtrac-faqs)
- [ChurchTrac reviews — SoftwareWorld 2026](https://www.softwareworld.co/software/churchtrac-reviews/)
- [Breeze API Reference Guide](https://app.breezechms.com/api)
- [Breeze API Fundamentals](https://docs.breeze.com/docs/api-fundamentals)
- [Breeze API — Advanced Custom Development](https://support.breezechms.com/hc/en-us/articles/360001324153-API-Advanced-Custom-Development)
- [Breeze Filtering by Tags API](https://support.breezechms.com/hc/en-us/articles/32328535056663-Filtering-by-Tags-in-the-Breeze-API-using-filter-json)
- [GitHub BreezeChMS/breeze-api-v1](https://github.com/BreezeChMS/breeze-api-v1)
- [Datanyze — Planning Center market share](https://www.datanyze.com/market-share/church-management--458/planning-center-market-share)
- [Breeze ChMS website — 11,000+ churches](https://www.breezechms.com/)
