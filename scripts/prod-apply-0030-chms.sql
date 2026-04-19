-- Apply migration 0030 (CHMS integration) to production — idempotent version
-- Safe to run multiple times; each statement is guarded with IF NOT EXISTS.
-- Paste this into the Neon SQL Editor (https://console.neon.tech) against the prayerjar production DB.

BEGIN;

-- ============================================================
-- A. churches table — 2 new columns
-- ============================================================
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS chms_provider text,
  ADD COLUMN IF NOT EXISTS chms_config   text;

-- ============================================================
-- B. church_members table — 4 new columns + 1 partial unique index
-- ============================================================
ALTER TABLE church_members
  ADD COLUMN IF NOT EXISTS external_chms_id text,
  ADD COLUMN IF NOT EXISTS chms_provider    text,
  ADD COLUMN IF NOT EXISTS chms_status      text,
  ADD COLUMN IF NOT EXISTS chms_synced_at   timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS church_members_chms_idx
  ON church_members (church_id, chms_provider, external_chms_id)
  WHERE external_chms_id IS NOT NULL;

-- ============================================================
-- C. groups table — 2 new columns + 1 partial unique index
-- ============================================================
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS external_chms_id text,
  ADD COLUMN IF NOT EXISTS chms_provider    text;

CREATE UNIQUE INDEX IF NOT EXISTS groups_chms_idx
  ON groups (church_id, chms_provider, external_chms_id)
  WHERE external_chms_id IS NOT NULL;

-- ============================================================
-- D. New chms_sync_jobs table
-- ============================================================
CREATE TABLE IF NOT EXISTS chms_sync_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  job_type        text NOT NULL,
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

CREATE INDEX IF NOT EXISTS chms_sync_jobs_pending_idx
  ON chms_sync_jobs (next_attempt_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS chms_sync_jobs_church_idx
  ON chms_sync_jobs (church_id, created_at DESC);

-- ============================================================
-- Verification — run these SELECTs after COMMIT to confirm
-- ============================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'groups' AND column_name IN ('external_chms_id', 'chms_provider');
-- Expected: 2 rows.
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'church_members'
--     AND column_name IN ('external_chms_id', 'chms_provider', 'chms_status', 'chms_synced_at');
-- Expected: 4 rows.
--
-- SELECT to_regclass('chms_sync_jobs');
-- Expected: 'chms_sync_jobs' (not NULL).

COMMIT;
