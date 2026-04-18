# ChMS Integration Layer — Architecture Spec

**Task:** pj-s17-chms-architecture  
**Author:** Architect  
**Date:** 2026-04-17  
**Status:** Handoff to Backend + Integrations (Sprint 18)  
**Reference implementation:** Planning Center (Sprint 18) · Breeze (Sprint 19)

---

## Purpose

This document defines the pluggable adapter layer for Church Management Software (ChMS) integrations. It is a **spec only** — no application code lives here. Backend and Integrations implement against this contract in Sprint 18.

The design goal: add new ChMS providers (Breeze, Elvanto, etc.) without touching core sync logic. Each provider is an adapter behind a shared interface.

---

## 1. Adapter Interface

Every ChMS provider implements `ChmsAdapter`. No adapter may bypass the interface — sync jobs always call the interface, never provider code directly.

```typescript
// src/lib/chms/ChmsAdapter.ts  (Sprint 18 — create this file)

export interface ChmsMember {
  externalId: string;         // Provider's stable ID for this person
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'unknown';
  raw: Record<string, unknown>; // Full provider payload, stored for debugging
}

export interface ChmsGroup {
  externalId: string;         // Provider's stable ID for the group
  name: string;
  description: string | null;
  memberExternalIds: string[]; // Provider IDs — resolved to PrayerJar users post-import
  raw: Record<string, unknown>;
}

export interface ChmsWebhookResult {
  event: string;              // e.g. 'person.created'
  externalId: string;
  action: 'upsert' | 'delete' | 'ignore';
  member?: ChmsMember;
}

export interface ChmsAdapter {
  /** Verify credentials and obtain/refresh access tokens. Called at connect
   *  and before any operation that returns 401. */
  connect(config: ChmsConfig): Promise<void>;

  /** Revoke tokens and clear church's chmsConfig in the DB. Called on
   *  user-initiated disconnect. */
  disconnect(churchId: string): Promise<void>;

  /** Fetch the full member roster from the ChMS. Used for initial import
   *  and scheduled full-sync fallback. Implementations must handle pagination. */
  listMembers(churchId: string): Promise<ChmsMember[]>;

  /** Fetch all groups (small groups, teams, tags) from the ChMS. */
  listGroups(churchId: string): Promise<ChmsGroup[]>;

  /** Upsert a single member in PrayerJar from a ChMS payload. Called per
   *  webhook event and during delta sync. */
  syncMember(churchId: string, member: ChmsMember): Promise<void>;

  /** Write a weekly prayer summary back to the ChMS for a specific person.
   *  PCO: POST /people/v2/people/{id}/notes.
   *  Breeze: assign a "Prayed For" tag via /api/tags/assign. */
  pushPrayerSummary(churchId: string, externalMemberId: string, summary: string): Promise<void>;

  /** Verify webhook signature, parse payload, and return a structured result.
   *  Returns null if signature verification fails — caller must respond 401. */
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<ChmsWebhookResult | null>;
}
```

### `ChmsConfig` — per-church credential envelope

```typescript
// Stored encrypted in churches.chmsConfig (JSONB) — never in env vars.
export interface ChmsConfig {
  provider: ChmsProviderSlug;
  // OAuth providers (Planning Center)
  accessToken?: string;         // AES-256-GCM encrypted
  refreshToken?: string;        // AES-256-GCM encrypted
  tokenExpiresAt?: string;      // ISO timestamp
  // API key providers (Breeze)
  apiKey?: string;              // AES-256-GCM encrypted
  subdomain?: string;           // e.g. "mychurch" for mychurch.breezechms.com
  // Webhook verification
  webhookSecret?: string;       // AES-256-GCM encrypted
  // Timestamps
  connectedAt: string;
  lastSyncedAt?: string;
}
```

---

## 2. Provider Registration

### Provider slug type

```typescript
// src/lib/chms/providers.ts  (Sprint 18 — create this file)

export type ChmsProviderSlug = 'planning-center' | 'breeze';

export const CHMS_ADAPTERS: Record<ChmsProviderSlug, () => Promise<ChmsAdapter>> = {
  'planning-center': () =>
    import('./adapters/PlanningCenterAdapter').then(m => new m.PlanningCenterAdapter()),
  'breeze': () =>
    import('./adapters/BreezeAdapter').then(m => new m.BreezeAdapter()),
};

export async function getAdapterForChurch(churchId: string): Promise<ChmsAdapter> {
  const church = await db.query.churches.findFirst({ where: eq(churches.id, churchId) });
  if (!church?.chmsProvider) throw new Error(`Church ${churchId} has no ChMS connected`);
  const factory = CHMS_ADAPTERS[church.chmsProvider];
  if (!factory) throw new Error(`No adapter registered for provider: ${church.chmsProvider}`);
  const adapter = await factory();
  const config = decryptChmsConfig(church.chmsConfig);
  await adapter.connect(config);
  return adapter;
}
```

### Active provider determination

The active provider is resolved per church via two new columns on the `churches` table (see §7):

- `churches.chmsProvider` (`text`, nullable) — the `ChmsProviderSlug`
- `churches.chmsConfig` (`jsonb`, nullable) — encrypted `ChmsConfig` object

No global "one active provider" concept — each church independently connects to whichever ChMS it uses.

---

## 3. Job / Webhook Model

### Sync job types

| Trigger | Mechanism | Frequency |
|---|---|---|
| Initial import | Manual (pastor clicks "Connect") | Once on connect |
| Scheduled full sync | Vercel Cron (`0 3 * * *`) | Nightly 3 AM UTC |
| Delta sync (webhook) | Planning Center webhook → enqueue | Real-time (PCO only) |
| Breeze polling | Vercel Cron (`0 */4 * * *`) | Every 4 hours (no webhook) |

### `chms_sync_jobs` table

All sync operations are written to this table before execution. The Cron function polls for `pending` jobs; webhook handlers enqueue immediately.

```sql
-- See §7 for the full column list
CREATE TABLE chms_sync_jobs (
  id          uuid PRIMARY KEY,
  church_id   uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  provider    text NOT NULL,          -- ChmsProviderSlug
  job_type    text NOT NULL,          -- 'full_sync' | 'delta_sync' | 'push_summary'
  status      text NOT NULL,          -- 'pending' | 'running' | 'done' | 'failed' | 'dead'
  payload     jsonb,                  -- webhook payload or sync params
  attempt     integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  next_attempt_at timestamptz,
  started_at  timestamptz,
  completed_at timestamptz,
  error       text,                   -- last error message
  created_at  timestamptz DEFAULT now()
);
```

### Webhook endpoint

Webhooks from any ChMS provider land at a single parameterized route:

```
POST /api/webhooks/chms/[provider]
```

**Handler responsibilities (in order):**

1. Read `provider` from the URL segment; look up `CHMS_ADAPTERS[provider]`.
2. Call `adapter.handleWebhook(payload, headers)` — adapter verifies HMAC/signature.
3. If verification fails → respond `401 Unauthorized`, log to Sentry, stop.
4. If `result.action === 'ignore'` → respond `200 OK`, stop.
5. Insert a `chms_sync_jobs` row: `job_type = 'delta_sync'`, `status = 'pending'`, `payload = result`.
6. Respond `202 Accepted`. Processing is async — never block the webhook response on DB writes.

**Planning Center webhook signature:** HMAC-SHA256 of the raw request body using the webhook secret. Verified against `X-PCO-Webhooks-Authenticity` header.

---

## 4. Error Handling + Retry Strategy

### Failure classification

| Class | Examples | Action |
|---|---|---|
| **Transient** | 429 rate limit, 500/503 from ChMS, network timeout | Retry with backoff |
| **Auth** | 401 Unauthorized | Attempt token refresh once; if still 401, mark job `dead`, notify church admin |
| **Permanent** | 404 not found, malformed payload, invalid config | Mark job `dead` immediately, log to Sentry, do not retry |

### Backoff schedule

```
attempt 1 — immediate
attempt 2 — 60 seconds
attempt 3 — 5 minutes
attempt 4 (dead-letter) — mark status = 'dead', send Sentry alert
```

Implementation: the Cron runner checks `next_attempt_at <= now()` for `pending` jobs with `attempt < max_attempts`. On each failure:

```typescript
const delays = [0, 60_000, 300_000]; // ms
job.attempt += 1;
job.next_attempt_at = new Date(Date.now() + delays[job.attempt] ?? 0);
job.status = job.attempt >= job.max_attempts ? 'dead' : 'pending';
```

### Rate limit handling

- **Planning Center (100 req/min):** adapter tracks request timestamps; backs off 1 second before hitting the window.
- **Breeze (20 req/min):** adapter enforces minimum 3.5-second gap between requests. Full 500-member sync is scheduled, not inline.

### Dead-letter logging

When `status = 'dead'`, the runner calls `Sentry.captureException` with:
- `churchId`, `provider`, `jobType`
- Last `error` text from the job row
- `attempt` count

Church admin is notified via the existing admin-notify pathway (`src/lib/admin-notify.ts`).

---

## 5. Data-Mapping Contract

### Planning Center `Person` → PrayerJar `users` + `churchMembers`

| Planning Center field | PrayerJar column | Notes |
|---|---|---|
| `id` | `church_members.externalChmsId` | New column — see §7 |
| `attributes.first_name` | `users.name` (first part) | Concatenate with last_name |
| `attributes.last_name` | `users.name` (last part) | |
| `attributes.primary_email.address` | `users.email` | Null if no email on record |
| `attributes.primary_phone_number.number` | — | Not currently stored in PrayerJar; ignore for Sprint 18 |
| `attributes.status` | `church_members.chmsStatus` | New column — `'active' \| 'inactive'`; controls whether the member appears in prayer rosters |
| `attributes.membership` | Informational only | Not mapped to a column |
| (provider slug) | `church_members.chmsProvider` | New column — ties this row to the PCO adapter |
| (sync timestamp) | `church_members.chmsSyncedAt` | New column |

**Upsert rule:** match on `church_members.externalChmsId + churchId`. If the PrayerJar `users` row does not exist (email not registered), create a **stub user** (`emailVerified = null`, `onboardingCompleted = false`). The stub user receives an invite email via the existing notification system.

### ChMS group → PrayerJar `groups`

| ChMS field | PrayerJar column | Notes |
|---|---|---|
| Group `id` | `groups.externalChmsId` | New column — see §7 |
| Group `name` | `groups.name` | |
| Group `description` | `groups.description` | |
| (provider slug) | `groups.chmsProvider` | New column |
| Member list | `group_members` rows | Resolved via `church_members.externalChmsId` |

**Breeze note:** Breeze has no first-class group object. Tags model groups. Map: tag folder → ignored; tag → `groups` row; tag membership → `group_members` row.

---

## 6. Secret Storage Conventions

### Split between env vars and DB

| Credential | Where stored | Why |
|---|---|---|
| OAuth app `client_id` | Vercel env var: `CHMS_PLANNING_CENTER_CLIENT_ID` | Shared across all churches; one registration per PrayerJar app |
| OAuth app `client_secret` | Vercel env var: `CHMS_PLANNING_CENTER_CLIENT_SECRET` | Same — global secret, not per-church |
| Per-church `access_token` | `churches.chmsConfig` JSONB, encrypted | Each church has its own OAuth grant |
| Per-church `refresh_token` | `churches.chmsConfig` JSONB, encrypted | Same |
| Per-church Breeze `api_key` | `churches.chmsConfig` JSONB, encrypted | Long-lived per-church credential |
| Webhook signing secret | `churches.chmsConfig` JSONB, encrypted | Per-church in PCO's model |
| Encryption key for chmsConfig | Vercel env var: `CHMS_CONFIG_ENCRYPTION_KEY` | 32-byte random key, rotated quarterly |

### Naming convention for env vars

```
CHMS_{PROVIDER_SLUG}_{KEY}
```

Examples:
```
CHMS_PLANNING_CENTER_CLIENT_ID
CHMS_PLANNING_CENTER_CLIENT_SECRET
CHMS_CONFIG_ENCRYPTION_KEY
```

### Encryption implementation

No existing encrypt utility exists in `src/lib/`. Sprint 18 **must create `src/lib/encrypt.ts`** before implementing the adapter. Required:

```typescript
// AES-256-GCM using Node.js built-in crypto
// Key source: process.env.CHMS_CONFIG_ENCRYPTION_KEY (32-byte hex string)
export function encrypt(plaintext: string): string; // returns "iv:ciphertext" base64
export function decrypt(ciphertext: string): string;
```

The `chmsConfig` JSONB column stores the entire `ChmsConfig` object as a single encrypted string (encrypt the `JSON.stringify` output; decrypt + `JSON.parse` on read). Do not encrypt field-by-field — encrypt the envelope.

---

## 7. Schema Additions — Sprint 18 Prerequisites

Backend + Database must land these before adapter implementation begins.

### A. `churches` table — new columns

```sql
ALTER TABLE churches
  ADD COLUMN chms_provider        text,          -- 'planning-center' | 'breeze' | null
  ADD COLUMN chms_config          text;          -- AES-256-GCM encrypted JSON blob
```

Note: `chmsConfig` is `text` (not `jsonb`) because the entire value is encrypted before storage. The JSONB structure is only visible inside the application after decryption.

### B. `church_members` table — new columns

```sql
ALTER TABLE church_members
  ADD COLUMN external_chms_id     text,          -- Provider's stable person ID
  ADD COLUMN chms_provider        text,          -- matches churches.chms_provider
  ADD COLUMN chms_status          text,          -- 'active' | 'inactive'
  ADD COLUMN chms_synced_at       timestamptz;   -- Last time this row was updated from ChMS

CREATE UNIQUE INDEX church_members_chms_idx
  ON church_members (church_id, chms_provider, external_chms_id)
  WHERE external_chms_id IS NOT NULL;
```

### C. `groups` table — new columns

```sql
ALTER TABLE groups
  ADD COLUMN external_chms_id     text,          -- Provider's stable group ID
  ADD COLUMN chms_provider        text;          -- matches churches.chms_provider

CREATE UNIQUE INDEX groups_chms_idx
  ON groups (church_id, chms_provider, external_chms_id)
  WHERE external_chms_id IS NOT NULL;
```

### D. `chms_sync_jobs` table — new table

```sql
CREATE TABLE chms_sync_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  job_type        text NOT NULL,   -- 'full_sync' | 'delta_sync' | 'push_summary'
  status          text NOT NULL DEFAULT 'pending',
  payload         jsonb,
  attempt         integer NOT NULL DEFAULT 0,
  max_attempts    integer NOT NULL DEFAULT 3,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chms_sync_jobs_pending_idx
  ON chms_sync_jobs (next_attempt_at)
  WHERE status = 'pending';

CREATE INDEX chms_sync_jobs_church_idx
  ON chms_sync_jobs (church_id, created_at DESC);
```

### E. `src/lib/encrypt.ts` — new file (Backend prerequisite)

Sprint 18 Backend must create this before the adapter can store tokens. No existing encrypt utility in the codebase.

---

## 8. Sprint 18 Reference Implementation — Planning Center

Planning Center is the adapter target for Sprint 18. Breeze follows in Sprint 19 using the same interface.

### Sprint 18 tasks to create (Architect will write these to tasks.json at Sprint 18 kickoff)

| # | Task | Agent | Blocker |
|---|---|---|---|
| S18-1 | Write migrations for §7 schema additions | Database | None — first |
| S18-2 | Create `src/lib/encrypt.ts` (AES-256-GCM) | Backend | S18-1 |
| S18-3 | Implement `PlanningCenterAdapter` (OAuth flow + `connect`/`disconnect`) | Integrations | S18-2 |
| S18-4 | Implement `listMembers` + `listGroups` + `syncMember` (initial import) | Integrations | S18-3 |
| S18-5 | Implement `handleWebhook` + `/api/webhooks/chms/[provider]` route | Backend | S18-3 |
| S18-6 | Implement `pushPrayerSummary` (person notes endpoint) | Integrations | S18-4 |
| S18-7 | Create `chms_sync_jobs` runner (Vercel Cron + retry logic) | Backend | S18-4, S18-5 |
| S18-8 | Integration tests against PCO sandbox | QA | S18-6, S18-7 |

### Planning Center OAuth connect flow (sketch)

1. Pastor clicks "Connect Planning Center" → redirect to `https://api.planningcenteronline.com/oauth/authorize?client_id=...&scope=people groups&response_type=code&redirect_uri=/api/auth/chms/callback/planning-center`
2. PCO returns `code` to callback route
3. Callback exchanges code for `access_token` + `refresh_token` via `POST /oauth/token`
4. Tokens are encrypted and written to `churches.chmsConfig`
5. Immediately enqueue a `full_sync` job

### Groups module degradation

Not all PCO churches subscribe to the Groups module. Adapter must catch 403 responses on `/groups/v2/groups` and set `groupsAvailable = false` in `chmsConfig` rather than failing the entire sync.

---

## Decisions Logged

See `docs/decisions.md` — adding the following ADR:

**[2026-04-17] ChMS adapter pattern with encrypted per-church config**  
**Decision:** Pluggable `ChmsAdapter` interface; per-church credentials stored AES-256-GCM encrypted in `churches.chmsConfig` text column; global OAuth app credentials in Vercel env vars.  
**Reason:** Multi-church SaaS requires credential isolation; encrypt-envelope pattern avoids field-level complexity; interface enables provider swap without touching sync core.  
**Alternatives considered:** Dedicated `church_chms_tokens` table (rejected — unnecessary join; config belongs on the church row); storing plaintext in JSONB (rejected — credential exposure risk).
