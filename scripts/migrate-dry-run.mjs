#!/usr/bin/env node
// scripts/migrate-dry-run.mjs
//
// Read-only verification of what scripts/migrate-deploy.mjs would do against a target DB.
// No DDL, no INSERT. Just SELECTs + local hash computation.
//
// Usage:
//   1. Write DATABASE_URL to .env.production.tmp (same pattern as other ops scripts).
//   2. node scripts/migrate-dry-run.mjs
//   3. Script deletes .env.production.tmp on exit.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'src', 'db', 'migrations');
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, 'meta', '_journal.json');
const ENV_FILE = path.join(REPO_ROOT, '.env.production.tmp');

function redact(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, 'postgres://[REDACTED]');
}

function parseEnvFile(p) {
  const raw = fs.readFileSync(p, 'utf8');
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

function hashMigrationFile(tag) {
  const p = path.join(MIGRATIONS_DIR, `${tag}.sql`);
  if (!fs.existsSync(p)) throw new Error(`Missing: ${p}`);
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

async function main() {
  // URL source: .env.production.tmp (preferred) OR env var.
  let url;
  if (fs.existsSync(ENV_FILE)) {
    url = parseEnvFile(ENV_FILE).DATABASE_URL;
  }
  if (!url) url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL not found. Write it to .env.production.tmp or set as env var.',
    );
  }

  const host = new URL(url).host;
  console.log(`Target host: ${host}\n`);

  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
  console.log(`Journal entries: ${journal.entries.length}`);

  // Check for missing SQL files referenced by journal (bad repair → would fail at runtime).
  const missing = [];
  for (const e of journal.entries) {
    const p = path.join(MIGRATIONS_DIR, `${e.tag}.sql`);
    if (!fs.existsSync(p)) missing.push(e.tag);
  }
  if (missing.length > 0) {
    console.log(`\n  BAD: journal references missing SQL files: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  // Check for orphan SQL files (file exists, not in journal → would NEVER run via migrate).
  const journalTags = new Set(journal.entries.map((e) => e.tag));
  const filesOnDisk = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => f.slice(0, -4));
  const orphans = filesOnDisk.filter((f) => !journalTags.has(f));
  if (orphans.length > 0) {
    console.log(`\n  WARN: SQL files not referenced in journal: ${orphans.join(', ')}`);
    console.log('         Drizzle migrate will never run them. Fix journal or delete file.');
  }

  // Build would-be seed rows.
  const rows = journal.entries.map((e) => ({
    tag: e.tag,
    hash: hashMigrationFile(e.tag),
    created_at: Number(e.when),
  }));
  rows.sort((a, b) => a.created_at - b.created_at);

  // Ordering sanity: journal should be monotonic in `when`. Drizzle's skip logic is
  // max-created_at-based, so out-of-order entries can cause silent skips.
  const ordered = [...rows].sort((a, b) => a.created_at - b.created_at);
  const originalOrder = journal.entries.map((e) => e.tag);
  const orderedByTime = ordered.map((r) => r.tag);
  const orderingOK =
    originalOrder.length === orderedByTime.length &&
    originalOrder.every((t, i) => t === orderedByTime[i]);
  if (!orderingOK) {
    console.log('\n  NOTE: journal entries are not sorted by `when`. Migrate will apply in');
    console.log('        journal-array order, but skip-logic uses max(created_at). This is OK');
    console.log('        for already-seeded tables but means a new migration with an earlier');
    console.log('        `when` than some existing migration will be silently skipped.');
  }

  console.log(`\nWould seed ${rows.length} rows (sorted):`);
  for (const r of rows) {
    console.log(`  created_at=${r.created_at}  hash=${r.hash.slice(0, 16)}...  ${r.tag}`);
  }
  console.log(`\nMax created_at after seed: ${rows[rows.length - 1].created_at} (${rows[rows.length - 1].tag})`);

  // Probe the target DB.
  const client = neon(url);
  const schemaCheck = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.schemata WHERE schema_name = 'drizzle'
     ) AS exists`,
  );
  const scExists = (Array.isArray(schemaCheck) ? schemaCheck : schemaCheck.rows)[0].exists;

  const tableCheck = await client.query(
    `SELECT to_regclass('drizzle.__drizzle_migrations') AS tbl`,
  );
  const tblName = (Array.isArray(tableCheck) ? tableCheck : tableCheck.rows)[0].tbl;

  console.log(`\n--- DB probe ---`);
  console.log(`  schema 'drizzle' exists: ${scExists}`);
  console.log(`  table drizzle.__drizzle_migrations: ${tblName ?? 'MISSING'}`);

  if (tblName) {
    const existing = await client.query(
      `SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`,
    );
    const existingArr = Array.isArray(existing) ? existing : existing.rows;
    console.log(`  existing rows: ${existingArr.length}`);
    if (existingArr.length > 0) {
      const maxTs = Math.max(...existingArr.map((r) => Number(r.created_at)));
      console.log(`  max created_at: ${maxTs}`);
      const pending = rows.filter((r) => r.created_at > maxTs);
      console.log(`  would migrate apply ${pending.length} pending migration(s)`);
      if (pending.length > 0) {
        for (const p of pending) console.log(`    → ${p.tag}`);
      }
    } else {
      console.log('  empty table → would seed all rows, then migrate would no-op.');
    }
  } else {
    console.log('  → would CREATE TABLE, seed all rows, then migrate would no-op.');
  }

  console.log('\nDry-run complete.');
}

main()
  .catch((e) => {
    console.error('\nDry-run failed.');
    console.error(redact(e));
    process.exitCode = 1;
  })
  .finally(() => {
    if (fs.existsSync(ENV_FILE)) {
      fs.unlinkSync(ENV_FILE);
      console.log(`\nDeleted ${path.basename(ENV_FILE)}.`);
    }
  });
