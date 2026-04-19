#!/usr/bin/env node
// Apply migrations 0026 (finance attribution), 0027 (church legal), 0028 (enterprise leads),
// and 0029 (audit events) to production. All statements idempotent.
// Per-statement HTTP execution to avoid neon HTTP-proxy multi-statement issues.

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function redact(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/postgres:\/\/[^\s]+/gi, 'postgres://[REDACTED]');
}

// Wrap CREATE TYPE in a DO block — CREATE TYPE has no IF NOT EXISTS form.
const enumIfNotExists = (typname, values) => `DO $$ BEGIN
  CREATE TYPE ${typname} AS ENUM (${values.map((v) => `'${v}'`).join(', ')});
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`;

// FK + index helpers — wrap FK in DO block since ADD CONSTRAINT has no IF NOT EXISTS.
const fkIfNotExists = (constraintName, tableName, body) => `DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '${constraintName}'
  ) THEN
    ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} ${body};
  END IF;
END $$`;

const STATEMENTS = [
  // ===== 0026 — finance_attribution: 7 columns on churches =====
  { label: '0026 churches.acquisition_source', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS acquisition_source text` },
  { label: '0026 churches.utm_source', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS utm_source text` },
  { label: '0026 churches.utm_medium', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS utm_medium text` },
  { label: '0026 churches.utm_campaign', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS utm_campaign text` },
  { label: '0026 churches.first_paid_at', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS first_paid_at timestamp with time zone` },
  { label: '0026 churches.current_plan', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS current_plan plan_tier DEFAULT 'free' NOT NULL` },
  { label: '0026 churches.previous_plan', sql: `ALTER TABLE churches ADD COLUMN IF NOT EXISTS previous_plan plan_tier` },

  // ===== 0027 — church_legal: 2 enums + 2 tables + 4 FKs + 4 indexes =====
  { label: '0027 enum legal_document_type', sql: enumIfNotExists('legal_document_type', ['dpa', 'subprocessor_list', 'terms', 'privacy']) },
  { label: '0027 enum nonprofit_status', sql: enumIfNotExists('nonprofit_status', ['unverified', 'pending', 'verified', 'rejected']) },
  {
    label: '0027 table church_legal_acceptances',
    sql: `CREATE TABLE IF NOT EXISTS church_legal_acceptances (
      id uuid PRIMARY KEY NOT NULL,
      church_id uuid NOT NULL,
      user_id uuid NOT NULL,
      document_type legal_document_type NOT NULL,
      document_version text NOT NULL,
      accepted_at timestamp with time zone DEFAULT now() NOT NULL,
      ip_address text
    )`,
  },
  {
    label: '0027 table nonprofit_verifications',
    sql: `CREATE TABLE IF NOT EXISTS nonprofit_verifications (
      id uuid PRIMARY KEY NOT NULL,
      church_id uuid NOT NULL,
      submitted_by_user_id uuid,
      ein text,
      legal_name text,
      determination_letter_url text NOT NULL,
      status nonprofit_status DEFAULT 'pending' NOT NULL,
      submitted_at timestamp with time zone DEFAULT now() NOT NULL,
      reviewed_at timestamp with time zone,
      reviewed_by text,
      review_notes text
    )`,
  },
  {
    label: '0027 fk church_legal_acceptances.church_id',
    sql: fkIfNotExists(
      'church_legal_acceptances_church_id_churches_id_fk',
      'church_legal_acceptances',
      'FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE',
    ),
  },
  {
    label: '0027 fk church_legal_acceptances.user_id',
    sql: fkIfNotExists(
      'church_legal_acceptances_user_id_users_id_fk',
      'church_legal_acceptances',
      'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
    ),
  },
  {
    label: '0027 fk nonprofit_verifications.church_id',
    sql: fkIfNotExists(
      'nonprofit_verifications_church_id_churches_id_fk',
      'nonprofit_verifications',
      'FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE',
    ),
  },
  {
    label: '0027 fk nonprofit_verifications.submitted_by_user_id',
    sql: fkIfNotExists(
      'nonprofit_verifications_submitted_by_user_id_users_id_fk',
      'nonprofit_verifications',
      'FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL',
    ),
  },
  { label: '0027 idx church_legal_acceptances_church_idx', sql: `CREATE INDEX IF NOT EXISTS church_legal_acceptances_church_idx ON church_legal_acceptances (church_id)` },
  { label: '0027 idx church_legal_acceptances_church_doc_idx', sql: `CREATE INDEX IF NOT EXISTS church_legal_acceptances_church_doc_idx ON church_legal_acceptances (church_id, document_type)` },
  { label: '0027 idx nonprofit_verifications_church_idx', sql: `CREATE INDEX IF NOT EXISTS nonprofit_verifications_church_idx ON nonprofit_verifications (church_id)` },
  { label: '0027 idx nonprofit_verifications_status_idx', sql: `CREATE INDEX IF NOT EXISTS nonprofit_verifications_status_idx ON nonprofit_verifications (status)` },

  // ===== 0028 — enterprise_leads: 5 enums + 1 table + 2 indexes =====
  { label: '0028 enum church_enterprise_campus_count', sql: enumIfNotExists('church_enterprise_campus_count', ['1 (single site)', '2–4', '5–10', '11+']) },
  { label: '0028 enum church_enterprise_chms', sql: enumIfNotExists('church_enterprise_chms', ['Planning Center', 'Breeze', 'ChurchTrac', 'Elvanto', 'Other', 'None']) },
  { label: '0028 enum church_enterprise_member_bucket', sql: enumIfNotExists('church_enterprise_member_bucket', ['<50', '50–150', '150–500', '500–2,000', '2,000+']) },
  { label: '0028 enum church_enterprise_timeline', sql: enumIfNotExists('church_enterprise_timeline', ['Ready now', '1–3 months', '3–6 months', 'Just exploring']) },
  { label: '0028 enum church_enterprise_use_case', sql: enumIfNotExists('church_enterprise_use_case', ['Prayer ministry', 'Small groups', 'Pastoral care', 'All of the above']) },
  {
    label: '0028 table church_enterprise_leads',
    sql: `CREATE TABLE IF NOT EXISTS church_enterprise_leads (
      id uuid PRIMARY KEY NOT NULL,
      church_name text NOT NULL,
      denomination text,
      city_state text NOT NULL,
      website text NOT NULL,
      member_bucket church_enterprise_member_bucket NOT NULL,
      campus_count church_enterprise_campus_count NOT NULL,
      chms church_enterprise_chms NOT NULL,
      use_case church_enterprise_use_case NOT NULL,
      timeline church_enterprise_timeline NOT NULL,
      contact_name text NOT NULL,
      contact_email text NOT NULL,
      contact_phone text,
      calendly_booked boolean DEFAULT false NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )`,
  },
  { label: '0028 idx enterprise_leads_created_idx', sql: `CREATE INDEX IF NOT EXISTS enterprise_leads_created_idx ON church_enterprise_leads (created_at)` },
  { label: '0028 idx enterprise_leads_email_idx', sql: `CREATE INDEX IF NOT EXISTS enterprise_leads_email_idx ON church_enterprise_leads (contact_email)` },

  // ===== 0029 — audit_events: 1 table + 2 indexes =====
  {
    label: '0029 table audit_events',
    sql: `CREATE TABLE IF NOT EXISTS audit_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id uuid NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
      actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      action text NOT NULL,
      target_type text,
      target_id uuid,
      metadata jsonb DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  },
  { label: '0029 idx audit_events_church_id_idx', sql: `CREATE INDEX IF NOT EXISTS audit_events_church_id_idx ON audit_events (church_id)` },
  { label: '0029 idx audit_events_created_at_idx', sql: `CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON audit_events (created_at)` },
];

async function main() {
  const env = parseEnvFile(ENV_FILE);
  const url = env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const host = new URL(url).host;
  console.log(`Connecting to Neon host: ${host}`);

  const client = neon(url);
  const q = (text) => client.query(text);

  console.log(`\nApplying ${STATEMENTS.length} statements (migrations 0026–0029)...`);
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
