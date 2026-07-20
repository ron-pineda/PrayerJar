#!/usr/bin/env node
// One-shot runner: applies migration 0031 (chms_groups + chms_group_members) to prod.
// Reads DATABASE_URL from .env.production.tmp. Deletes env file on exit.
// Context: 0031 was silently skipped by drizzle migrate — its _journal.json timestamp
// was typo'd to 2025 (1745136000000), sorting it before already-applied migrations.

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
  return msg.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgres://[REDACTED]');
}

const STATEMENTS = [
  {
    label: 'chms_groups table',
    sql: `CREATE TABLE IF NOT EXISTS "chms_groups" (
      "id"          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      "church_id"   uuid        NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      "provider"    text        NOT NULL,
      "external_id" text        NOT NULL,
      "name"        text        NOT NULL,
      "description" text,
      "is_active"   boolean     NOT NULL DEFAULT true,
      "raw"         jsonb,
      "synced_at"   timestamptz NOT NULL DEFAULT now(),
      "created_at"  timestamptz NOT NULL DEFAULT now(),
      UNIQUE("church_id", "provider", "external_id")
    )`,
  },
  {
    label: 'chms_groups_church_id_idx',
    sql: `CREATE INDEX IF NOT EXISTS "chms_groups_church_id_idx"
          ON "chms_groups" ("church_id")`,
  },
  {
    label: 'chms_group_members table',
    sql: `CREATE TABLE IF NOT EXISTS "chms_group_members" (
      "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "group_id"           uuid NOT NULL REFERENCES chms_groups(id) ON DELETE CASCADE,
      "church_member_id"   uuid REFERENCES church_members(id) ON DELETE SET NULL,
      "external_member_id" text NOT NULL,
      "created_at"         timestamptz NOT NULL DEFAULT now(),
      UNIQUE("group_id", "external_member_id")
    )`,
  },
  {
    label: 'chms_group_members_group_id_idx',
    sql: `CREATE INDEX IF NOT EXISTS "chms_group_members_group_id_idx"
          ON "chms_group_members" ("group_id")`,
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

  const preCheck = await rows(
    `SELECT to_regclass('"chms_groups"') AS groups, to_regclass('"chms_group_members"') AS members`
  );
  console.log(
    `\nPre-apply: chms_groups = ${preCheck[0]?.groups ?? 'MISSING'}, chms_group_members = ${preCheck[0]?.members ?? 'MISSING'}`
  );

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

  const postCheck = await rows(
    `SELECT to_regclass('"chms_groups"') AS groups, to_regclass('"chms_group_members"') AS members`
  );
  const groupCols = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'chms_groups' ORDER BY ordinal_position`
  );
  const memberCols = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'chms_group_members' ORDER BY ordinal_position`
  );
  const idxCheck = await rows(
    `SELECT indexname FROM pg_indexes
     WHERE tablename IN ('chms_groups', 'chms_group_members')`
  );

  console.log(`\nPost-apply:`);
  console.log(`  chms_groups: ${postCheck[0]?.groups ?? 'MISSING'} (${groupCols.length} cols)`);
  console.log(`  chms_group_members: ${postCheck[0]?.members ?? 'MISSING'} (${memberCols.length} cols)`);
  console.log(`  indexes: ${idxCheck.map((r) => r.indexname).join(', ')}`);

  if (!postCheck[0]?.groups || !postCheck[0]?.members || groupCols.length !== 10 || memberCols.length !== 5) {
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
