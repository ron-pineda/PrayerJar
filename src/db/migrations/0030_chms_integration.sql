-- Migration: 0030_chms_integration
-- Sprint 18: ChMS Integration Layer — schema additions per architecture spec §7
-- Covers: churches, church_members, groups column additions + chms_sync_jobs table

-- ============================================================
-- A. churches table — 2 new columns
-- ============================================================

ALTER TABLE churches
  ADD COLUMN chms_provider text,   -- 'planning-center' | 'breeze' | null
  ADD COLUMN chms_config   text;   -- AES-256-GCM encrypted JSON blob (text, not jsonb)

-- ============================================================
-- B. church_members table — 4 new columns + 1 partial unique index
-- ============================================================

ALTER TABLE church_members
  ADD COLUMN external_chms_id text,
  ADD COLUMN chms_provider    text,
  ADD COLUMN chms_status      text,       -- 'active' | 'inactive'
  ADD COLUMN chms_synced_at   timestamptz;

CREATE UNIQUE INDEX church_members_chms_idx
  ON church_members (church_id, chms_provider, external_chms_id)
  WHERE external_chms_id IS NOT NULL;

-- ============================================================
-- C. groups table — 2 new columns + 1 partial unique index
-- ============================================================

ALTER TABLE groups
  ADD COLUMN external_chms_id text,
  ADD COLUMN chms_provider    text;

CREATE UNIQUE INDEX groups_chms_idx
  ON groups (church_id, chms_provider, external_chms_id)
  WHERE external_chms_id IS NOT NULL;

-- ============================================================
-- D. New chms_sync_jobs table
-- ============================================================

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

-- ============================================================
-- ROLLBACK
-- ============================================================
-- To undo this migration, run:
--
-- DROP TABLE IF EXISTS chms_sync_jobs;
--
-- DROP INDEX IF EXISTS groups_chms_idx;
-- ALTER TABLE groups
--   DROP COLUMN IF EXISTS external_chms_id,
--   DROP COLUMN IF EXISTS chms_provider;
--
-- DROP INDEX IF EXISTS church_members_chms_idx;
-- ALTER TABLE church_members
--   DROP COLUMN IF EXISTS external_chms_id,
--   DROP COLUMN IF EXISTS chms_provider,
--   DROP COLUMN IF EXISTS chms_status,
--   DROP COLUMN IF EXISTS chms_synced_at;
--
-- ALTER TABLE churches
--   DROP COLUMN IF EXISTS chms_provider,
--   DROP COLUMN IF EXISTS chms_config;
-- ============================================================
