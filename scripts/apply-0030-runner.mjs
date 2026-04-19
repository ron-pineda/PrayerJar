#!/usr/bin/env node
// One-shot runner: applies Sprint 18 migration 0030 (CHMS integration) to prod.
// Reads DATABASE_URL from .env.production.tmp. Deletes env file on exit.
// Each DDL statement runs individually — neon HTTP proxy treats each client.query() as a single statement.

import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const ENV_FILE = '.env.production.tmp';

function parseEnvFile(path) {
  const raw = readFileSync(path, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function redact(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/postgres:\/\/[^\s]+/gi, 'postgres://[REDACTED]');
}

// Individual DDL statements. Each is idempotent (IF NOT EXISTS).
const STATEMENTS = [
  // A. churches — 2 columns
  { label: 'churches.chms_provider', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS chms_provider text` },
  { label: 'churches.chms_config', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS chms_config text` },

  // B. church_members — 4 columns + partial unique index
  { label: 'church_members.external_chms_id', sql: `ALTER TABLE church_members ADD COLUMN IF NOT EXISTS external_chms_id text` },
  { label: 'church_members.chms_provider', sql: `ALTER TABLE church_members ADD COLUMN IF NOT EXISTS chms_provider text` },
  { label: 'church_members.chms_status', sql: `ALTER TABLE church_members ADD COLUMN IF NOT EXISTS chms_status text` },
  { label: 'church_members.chms_synced_at', sql: `ALTER TABLE church_members ADD COLUMN IF NOT EXISTS chms_synced_at timestamptz` },
  {
    label: 'church_members_chms_idx',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS church_members_chms_idx
          ON church_members (church_id, chms_provider, external_chms_id)
          WHERE external_chms_id IS NOT NULL`,
  },

  // C. groups — 2 columns + partial unique index
  { label: 'groups.external_chms_id', sql: `ALTER TABLE groups ADD COLUMN IF NOT EXISTS external_chms_id text` },
  { label: 'groups.chms_provider', sql: `ALTER TABLE groups ADD COLUMN IF NOT EXISTS chms_provider text` },
  {
    label: 'groups_chms_idx',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS groups_chms_idx
          ON groups (church_id, chms_provider, external_chms_id)
          WHERE external_chms_id IS NOT NULL`,
  },

  // D. chms_sync_jobs table + 2 indexes
  {
    label: 'chms_sync_jobs table',
    sql: `CREATE TABLE IF NOT EXISTS chms_sync_jobs (
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
    )`,
  },
  {
    label: 'chms_sync_jobs_pending_idx',
    sql: `CREATE INDEX IF NOT EXISTS chms_sync_jobs_pending_idx
          ON chms_sync_jobs (next_attempt_at)
          WHERE status = 'pending'`,
  },
  {
    label: 'chms_sync_jobs_church_idx',
    sql: `CREATE INDEX IF NOT EXISTS chms_sync_jobs_church_idx
          ON chms_sync_jobs (church_id, created_at DESC)`,
  },
];

async function main() {
  const env = parseEnvFile(ENV_FILE);
  const url = env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing from env file');

  const host = new URL(url).host;
  console.log(`Connecting to Neon host: ${host}`);

  const client = neon(url);
  const q = (text) => client.query(text);

  const rows = async (text) => {
    const res = await q(text);
    return Array.isArray(res) ? res : res.rows;
  };

  const preGroups = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'groups' AND column_name IN ('external_chms_id','chms_provider')`
  );
  const preChurchMembers = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'church_members'
       AND column_name IN ('external_chms_id','chms_provider','chms_status','chms_synced_at')`
  );
  const preChurches = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'churches' AND column_name IN ('chms_provider','chms_config')`
  );
  const preJobs = await rows(`SELECT to_regclass('chms_sync_jobs') AS tbl`);

  console.log('\nPre-apply state:');
  console.log(`  groups CHMS columns: ${preGroups.length}/2`);
  console.log(`  church_members CHMS columns: ${preChurchMembers.length}/4`);
  console.log(`  churches CHMS columns: ${preChurches.length}/2`);
  console.log(`  chms_sync_jobs table: ${preJobs[0]?.tbl ?? 'MISSING'}`);

  console.log(`\nApplying ${STATEMENTS.length} statements...`);
  let applied = 0;
  for (const { label, sql } of STATEMENTS) {
    try {
      await q(sql);
      applied++;
      console.log(`  OK: ${label}`);
    } catch (e) {
      console.error(`  FAIL: ${label} — ${redact(e)}`);
      throw e;
    }
  }
  console.log(`\nApplied ${applied}/${STATEMENTS.length} statements.`);

  const postGroups = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'groups' AND column_name IN ('external_chms_id','chms_provider')
     ORDER BY column_name`
  );
  const postChurchMembers = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'church_members'
       AND column_name IN ('external_chms_id','chms_provider','chms_status','chms_synced_at')
     ORDER BY column_name`
  );
  const postChurches = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'churches' AND column_name IN ('chms_provider','chms_config')
     ORDER BY column_name`
  );
  const postJobs = await rows(`SELECT to_regclass('chms_sync_jobs') AS tbl`);

  console.log('\nPost-apply state:');
  console.log(`  groups: ${postGroups.map((r) => r.column_name).join(', ') || '(none)'}`);
  console.log(`  church_members: ${postChurchMembers.map((r) => r.column_name).join(', ') || '(none)'}`);
  console.log(`  churches: ${postChurches.map((r) => r.column_name).join(', ') || '(none)'}`);
  console.log(`  chms_sync_jobs table: ${postJobs[0]?.tbl ?? 'MISSING'}`);

  const allGood =
    postGroups.length === 2 &&
    postChurchMembers.length === 4 &&
    postChurches.length === 2 &&
    postJobs[0]?.tbl === 'chms_sync_jobs';

  if (!allGood) {
    throw new Error('Post-apply verification failed.');
  }
  console.log('\n✓ All verification checks passed.');
}

main()
  .catch((e) => {
    console.error('\nMigration runner failed.');
    console.error(redact(e));
    process.exitCode = 1;
  })
  .finally(() => {
    if (existsSync(ENV_FILE)) {
      unlinkSync(ENV_FILE);
      console.log(`\nDeleted ${ENV_FILE}.`);
    }
  });
