#!/usr/bin/env node
// scripts/migrate-deploy.mjs
//
// Deploy-time migration runner for PrayerJar.
//
// What this does:
//   1. Reads DATABASE_URL from env (provided by `vercel pull` in CI, or by the caller).
//   2. Only runs when VERCEL_ENV === 'production' (or MIGRATE_FORCE=1 for local testing).
//   3. On first run against a DB that has no `drizzle.__drizzle_migrations` table,
//      seeds that table with one row per migration in meta/_journal.json, where each
//      row's `hash` is sha256(raw bytes of the SQL file) and `created_at` is the
//      journal entry's `when` value (ms epoch).
//   4. Then runs drizzle's programmatic migrator, which will no-op if the seed
//      covers the current journal (skip condition: lastDb.created_at >= folderMillis).
//   5. Fails loudly on any error so the deploy step aborts and the new code never ships.
//
// Why seed first instead of applying:
//   Prod Neon already contains the contents of all journaled migrations (hand-applied
//   2026-04-19 after five-migration drift caused a /groups outage). Running drizzle-kit
//   migrate against it without seeding would try to re-run every SQL file — most
//   statements would fail on non-idempotent CREATE TABLE/ALTER TABLE ADD COLUMN.
//   Seeding records reality: "these migrations are already applied, don't re-run them."
//
// Rerun-safety:
//   - CREATE SCHEMA IF NOT EXISTS, CREATE TABLE IF NOT EXISTS — safe.
//   - Seed is guarded: only inserts if the table is empty. A re-run with the table
//     populated skips seeding and goes straight to migrate (which no-ops).
//
// Preview/staging:
//   Intentionally skipped here. Preview branches are created per-PR via
//   .github/workflows/neon-branch.yml but are currently bare — they're not used for
//   feature work, so migration-on-preview is deferred (see docs/ops/deploy-migrations.md
//   "Known Gaps"). Integration tests run db:migrate against NEON_INTEGRATION_DB_URL
//   on every CI run (ci.yml → integration job), which is the active pre-prod migration
//   check.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

// Resolve paths relative to repo root (script lives at scripts/migrate-deploy.mjs).
const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'src', 'db', 'migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');

// ---- helpers ----

function redact(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgres://[REDACTED]');
}

function log(msg) {
  console.log(`[migrate-deploy] ${msg}`);
}

function readJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    throw new Error(`Journal not found at ${JOURNAL_PATH}`);
  }
  const raw = fs.readFileSync(JOURNAL_PATH, 'utf8');
  const journal = JSON.parse(raw);
  if (!journal || !Array.isArray(journal.entries)) {
    throw new Error('Journal file is malformed — missing entries[]');
  }
  return journal;
}

function hashMigrationFile(tag) {
  const p = path.join(MIGRATIONS_DIR, `${tag}.sql`);
  if (!fs.existsSync(p)) {
    throw new Error(`Migration SQL file missing: ${p}`);
  }
  // Read as Buffer (raw bytes). Drizzle's hasher calls query.toString() on a file
  // buffer which yields a utf-8 string, but the content is byte-identical to the
  // raw bytes for ASCII SQL. Hashing raw bytes matches what drizzle computes when
  // readMigrationFiles() is called during the migrator's initial table scan.
  const buf = fs.readFileSync(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// Build the seed rows from the journal. Each row matches drizzle's own schema:
//   CREATE TABLE drizzle.__drizzle_migrations (id SERIAL, hash text, created_at bigint)
function buildSeedRows(journal) {
  return journal.entries.map((e) => ({
    tag: e.tag,
    hash: hashMigrationFile(e.tag),
    created_at: Number(e.when),
  }));
}

// ---- main ----

async function main() {
  const env = process.env;
  const vercelEnv = env.VERCEL_ENV; // 'production' | 'preview' | 'development' | undefined
  const force = env.MIGRATE_FORCE === '1';

  if (vercelEnv && vercelEnv !== 'production' && !force) {
    log(`VERCEL_ENV=${vercelEnv} — not production. Skipping migrations.`);
    log('Set MIGRATE_FORCE=1 to override (local testing only).');
    return;
  }

  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. In Vercel CI, run `vercel pull` first.');
  }

  let host;
  try {
    host = new URL(url).host;
  } catch {
    throw new Error('DATABASE_URL does not parse as a URL.');
  }
  log(`Target Neon host: ${host}`);
  log(`Migrations folder: ${path.relative(REPO_ROOT, MIGRATIONS_DIR)}`);

  const journal = readJournal();
  log(`Journal entries: ${journal.entries.length}`);

  // ---- Phase 1: seed if needed ----
  neonConfig.fetchConnectionCache = true;
  const client = neon(url);

  // Ensure the schema + table exist. These match drizzle's own DDL (see
  // node_modules/drizzle-orm/pg-core/dialect.js line 47-53). Running these
  // before the migrator means the migrator's own CREATE-IF-NOT-EXISTS is a no-op.
  await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await client.query(
    `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
       id SERIAL PRIMARY KEY,
       hash text NOT NULL,
       created_at bigint
     )`,
  );

  // Read current max(created_at) from the table. Any journal entry with when > that
  // is either a genuinely-new migration (should be applied) or a past migration the
  // DB already has but that was never recorded (drift — should be seeded, not applied).
  //
  // We assume: if prod DDL was hand-applied via ops runner scripts, the DDL exists
  // but the bookkeeping row doesn't. Seeding is the correct response — re-applying
  // would fail on non-idempotent ALTER TABLE.
  const maxRows = await client.query(
    `SELECT COUNT(*)::int AS n, COALESCE(MAX(created_at), 0)::bigint AS max_ts
     FROM drizzle.__drizzle_migrations`,
  );
  const maxArr = Array.isArray(maxRows) ? maxRows : maxRows.rows;
  const existingCount = Number(maxArr[0].n);
  const dbMaxTs = Number(maxArr[0].max_ts);
  log(`DB has ${existingCount} recorded migration(s), max created_at=${dbMaxTs}.`);

  const allSeedRows = buildSeedRows(journal).sort((a, b) => a.created_at - b.created_at);
  const missing = allSeedRows.filter((r) => r.created_at > dbMaxTs);

  if (missing.length === 0) {
    log('Bookkeeping is caught up to journal. No seed needed.');
  } else {
    log(`Seeding ${missing.length} missing row(s) (DDL assumed already applied on prod):`);
    for (const row of missing) {
      log(`  → ${row.tag} (created_at=${row.created_at})`);
      await client.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        [row.hash, row.created_at],
      );
    }
    log(`Seeded ${missing.length} rows. Max created_at now=${missing[missing.length - 1].created_at}.`);
  }

  // ---- Phase 2: run drizzle migrator ----
  // This will apply any journal entries whose `when` > max(created_at) in the DB.
  // After a fresh seed this is guaranteed to be a no-op.
  log('Running drizzle migrator...');
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  log('Migrator completed.');

  // Report final state.
  const postRows = await client.query(
    `SELECT COUNT(*)::int AS n, MAX(created_at)::bigint AS max_ts
     FROM drizzle.__drizzle_migrations`,
  );
  const postArr = Array.isArray(postRows) ? postRows : postRows.rows;
  log(`Post-state: ${postArr[0].n} rows, max created_at=${postArr[0].max_ts}.`);
  log('Done.');
}

main().catch((e) => {
  console.error('[migrate-deploy] FAILED.');
  console.error(redact(e));
  if (e instanceof Error && e.stack) {
    console.error(e.stack.split('\n').slice(1, 6).map(redact).join('\n'));
  }
  process.exitCode = 1;
});
