#!/usr/bin/env node
// One-shot runner: applies migration 0032 (church_admin_drip_status) to prod.
// Reads DATABASE_URL from .env.production.tmp. Deletes env file on exit.

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
    label: 'churchAdminDripStatus table',
    sql: `CREATE TABLE IF NOT EXISTS "churchAdminDripStatus" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "church_id" uuid NOT NULL REFERENCES "churches"("id") ON DELETE CASCADE,
      "admin_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "email1_sent_at" timestamptz,
      "email2_sent_at" timestamptz,
      "email3_sent_at" timestamptz,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "churchAdminDripStatus_church_id_unique" UNIQUE("church_id")
    )`,
  },
  {
    label: 'churchAdminDripStatus_created_at_idx',
    sql: `CREATE INDEX IF NOT EXISTS "churchAdminDripStatus_created_at_idx"
          ON "churchAdminDripStatus" ("created_at")`,
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

  const preCheck = await rows(`SELECT to_regclass('"churchAdminDripStatus"') AS tbl`);
  console.log(`\nPre-apply: churchAdminDripStatus = ${preCheck[0]?.tbl ?? 'MISSING'}`);

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

  const postCheck = await rows(`SELECT to_regclass('"churchAdminDripStatus"') AS tbl`);
  const colCheck = await rows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'churchAdminDripStatus'
     ORDER BY ordinal_position`
  );
  const idxCheck = await rows(
    `SELECT indexname FROM pg_indexes
     WHERE tablename = 'churchAdminDripStatus'`
  );

  console.log(`\nPost-apply:`);
  console.log(`  table: ${postCheck[0]?.tbl ?? 'MISSING'}`);
  console.log(`  columns: ${colCheck.map((r) => r.column_name).join(', ')}`);
  console.log(`  indexes: ${idxCheck.map((r) => r.indexname).join(', ')}`);

  if (!postCheck[0]?.tbl || colCheck.length !== 7) {
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
