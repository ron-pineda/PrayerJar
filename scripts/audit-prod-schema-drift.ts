// Audit prod DB for schema drift vs src/db/schema.ts.
// Imports schema definitions, walks drizzle's table metadata, and queries
// information_schema on prod. Reports missing tables and missing columns.
// Read-only — no DDL is executed.

import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '../src/db/schema';

const ENV_FILE = '.env.production.tmp';

function parseEnvFile(path: string): Record<string, string> {
  const raw = readFileSync(path, 'utf8');
  const out: Record<string, string> = {};
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

function redact(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/postgres:\/\/[^\s]+/gi, 'postgres://[REDACTED]');
}

interface ExpectedTable {
  name: string;
  columns: string[];
}

function extractExpectedTables(): ExpectedTable[] {
  const tables: ExpectedTable[] = [];
  for (const exported of Object.values(schema)) {
    if (!exported || typeof exported !== 'object') continue;
    try {
      const cfg = getTableConfig(exported as Parameters<typeof getTableConfig>[0]);
      tables.push({
        name: cfg.name,
        columns: cfg.columns.map((c) => c.name),
      });
    } catch {
      // not a pgTable export; skip
    }
  }
  return tables;
}

async function main() {
  const env = parseEnvFile(ENV_FILE);
  const url = env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing from env file');

  const host = new URL(url).host;
  console.log(`Auditing Neon host: ${host}\n`);

  const expected = extractExpectedTables();
  console.log(`Expected schema (from src/db/schema.ts): ${expected.length} tables\n`);

  const client = neon(url);
  const q = (text: string) => client.query(text);
  const rows = async (text: string) => {
    const res = (await q(text)) as unknown;
    return Array.isArray(res) ? res : (res as { rows: unknown[] }).rows;
  };

  type ColRow = { table_name: string; column_name: string };
  const allCols = (await rows(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, column_name`
  )) as ColRow[];

  const actualByTable = new Map<string, Set<string>>();
  for (const row of allCols) {
    if (!actualByTable.has(row.table_name)) {
      actualByTable.set(row.table_name, new Set());
    }
    actualByTable.get(row.table_name)!.add(row.column_name);
  }

  const missingTables: string[] = [];
  const missingColumnsByTable: Record<string, string[]> = {};
  const extraColumnsByTable: Record<string, string[]> = {};
  let cleanTables = 0;

  for (const t of expected) {
    const actual = actualByTable.get(t.name);
    if (!actual) {
      missingTables.push(t.name);
      continue;
    }
    const missingCols = t.columns.filter((c) => !actual.has(c));
    if (missingCols.length > 0) {
      missingColumnsByTable[t.name] = missingCols;
    }
    const extraCols = [...actual].filter((c) => !t.columns.includes(c));
    if (extraCols.length > 0) {
      extraColumnsByTable[t.name] = extraCols;
    }
    if (missingCols.length === 0 && extraCols.length === 0) {
      cleanTables++;
    }
  }

  console.log('=== DRIFT REPORT ===\n');
  console.log(`Clean tables: ${cleanTables}/${expected.length}`);
  console.log(`Missing tables (in code, absent in prod): ${missingTables.length}`);
  console.log(`Tables with missing columns: ${Object.keys(missingColumnsByTable).length}`);
  console.log(`Tables with extra columns (in prod, absent in code): ${Object.keys(extraColumnsByTable).length}\n`);

  if (missingTables.length > 0) {
    console.log('--- Missing tables ---');
    for (const t of missingTables) console.log(`  ${t}`);
    console.log();
  }
  if (Object.keys(missingColumnsByTable).length > 0) {
    console.log('--- Missing columns (BLOCKERS — code expects, prod lacks) ---');
    for (const [t, cols] of Object.entries(missingColumnsByTable)) {
      console.log(`  ${t}: ${cols.join(', ')}`);
    }
    console.log();
  }
  if (Object.keys(extraColumnsByTable).length > 0) {
    console.log('--- Extra columns (informational — likely from earlier rolled-back migrations) ---');
    for (const [t, cols] of Object.entries(extraColumnsByTable)) {
      console.log(`  ${t}: ${cols.join(', ')}`);
    }
    console.log();
  }

  const extraTablesInProd = [...actualByTable.keys()].filter(
    (n) => !expected.some((t) => t.name === n) && !n.startsWith('__'),
  );
  if (extraTablesInProd.length > 0) {
    console.log('--- Extra tables in prod (not in schema) ---');
    for (const t of extraTablesInProd) console.log(`  ${t}`);
    console.log();
  }

  const drizzleMeta = actualByTable.get('__drizzle_migrations');
  if (drizzleMeta) {
    const applied = (await rows(
      `SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at`,
    )) as Array<{ id: number; hash: string; created_at: string }>;
    console.log(`--- __drizzle_migrations table found: ${applied.length} entries ---`);
  } else {
    console.log('--- No __drizzle_migrations table on prod ---');
    console.log('  (drizzle-kit migrate has never been run against prod;');
    console.log('   schema state is whatever push/manual SQL has accumulated)');
    console.log();
  }

  const blockerCount =
    missingTables.length + Object.keys(missingColumnsByTable).length;
  if (blockerCount === 0) {
    console.log('\n✓ No blocking drift. Prod schema satisfies all code expectations.');
  } else {
    console.log(`\n✗ ${blockerCount} drift item(s) need attention.`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error('\nAudit failed.');
    console.error(redact(e));
    process.exitCode = 1;
  })
  .finally(() => {
    if (existsSync(ENV_FILE)) {
      unlinkSync(ENV_FILE);
      console.log(`\nDeleted ${ENV_FILE}.`);
    }
  });
