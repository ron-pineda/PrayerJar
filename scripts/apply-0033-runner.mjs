#!/usr/bin/env node
// One-shot runner: applies migration 0033 (user signup attribution) to prod.
// Reads DATABASE_URL from .env.production.tmp. Deletes env file on exit.
//
// NOT RUN BY THE ANALYTICS AGENT. Prod Neon has drifted from the SQL
// migrations before, so this is left staged for Ron to execute deliberately.
//
//   1. Put the prod DATABASE_URL in .env.production.tmp at the repo root
//   2. node scripts/apply-0033-runner.mjs
//
// The script deletes .env.production.tmp on exit, pass or fail.
//
// Every statement is IF NOT EXISTS, so re-running is a no-op.

import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const ENV_FILE = '.env.production.tmp';

const EXPECTED_COLUMNS = [
  'acquisition_source',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'signup_referrer',
  'signup_landing_path',
];

const EXPECTED_INDEX = 'users_acquisition_source_idx';

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
  ...EXPECTED_COLUMNS.map((col) => ({
    label: `users.${col}`,
    sql: `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "${col}" text`,
  })),
  {
    label: EXPECTED_INDEX,
    sql: `CREATE INDEX IF NOT EXISTS "${EXPECTED_INDEX}"
          ON "users" ("acquisition_source", "created_at")
          WHERE "acquisition_source" IS NOT NULL`,
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

  const columnsOf = async () =>
    (
      await rows(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = ANY(ARRAY[${EXPECTED_COLUMNS.map(
           (c) => `'${c}'`,
         ).join(', ')}])`,
      )
    ).map((r) => r.column_name);

  const pre = await columnsOf();
  console.log(
    `\nPre-apply: ${pre.length}/${EXPECTED_COLUMNS.length} attribution columns present` +
      (pre.length ? ` (${pre.join(', ')})` : ''),
  );

  // Safety: this migration is additive only. Confirm we are pointed at a real
  // users table before touching it.
  const usersTable = await rows(`SELECT to_regclass('"users"') AS tbl`);
  if (!usersTable[0]?.tbl) throw new Error('users table not found — wrong database?');

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

  const post = await columnsOf();
  const idxCheck = await rows(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = '${EXPECTED_INDEX}'`,
  );
  const rowCount = await rows(`SELECT count(*)::int AS n FROM "users"`);

  console.log(`\nPost-apply:`);
  console.log(`  columns: ${post.sort().join(', ')}`);
  console.log(`  index:   ${idxCheck[0]?.indexname ?? 'MISSING'}`);
  console.log(`  users rows (unchanged by this migration): ${rowCount[0]?.n}`);

  const missing = EXPECTED_COLUMNS.filter((c) => !post.includes(c));
  if (missing.length) {
    throw new Error(`Post-apply verification failed. Missing columns: ${missing.join(', ')}`);
  }
  if (!idxCheck[0]?.indexname) {
    throw new Error(`Post-apply verification failed. Missing index: ${EXPECTED_INDEX}`);
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
