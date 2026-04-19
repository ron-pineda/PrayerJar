# Deploy-time DB migrations

**Owner:** DevOps
**Last updated:** 2026-04-19 (Sprint 22, task `pj-s22-01-drizzle-pipeline`)

## What runs on every production deploy

`.github/workflows/deploy.yml` has a step "Apply DB migrations (production)"
between `vercel build --prod` and `vercel deploy --prebuilt --prod`. That step:

1. Sources `DATABASE_URL` from `.vercel/.env.production.local` (already pulled by
   the `Pull Vercel environment` step).
2. Runs `npm run db:migrate:deploy` → `node scripts/migrate-deploy.mjs`.
3. If the script exits non-zero, the workflow aborts and the
   `Deploy to production` step never runs. Production keeps serving the old
   code + old schema until a human fixes the migration and re-pushes.

The runner is gated on `VERCEL_ENV === 'production'`. Any other environment
(including local `node scripts/migrate-deploy.mjs`) exits early unless
`MIGRATE_FORCE=1`.

## What the runner does

`scripts/migrate-deploy.mjs`:

1. Ensures `CREATE SCHEMA IF NOT EXISTS drizzle` and
   `CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL, hash text, created_at bigint)`.
   These match drizzle's own DDL exactly; the migrator's internal
   CREATE-IF-NOT-EXISTS becomes a no-op.
2. If the table is empty: seeds one row per entry in
   `src/db/migrations/meta/_journal.json` with `hash = sha256(SQL file bytes)`
   and `created_at = entry.when`. This is the first-run strategy (see below).
3. Runs drizzle's programmatic migrator
   (`drizzle-orm/neon-http/migrator.migrate`). Drizzle reads the journal and
   applies any entry whose `when` > `max(created_at)` in the table. After a
   fresh seed this is a no-op; future sprints' new migrations land through
   this step automatically.

## First-run strategy: journal-seeding

Prod Neon already contains the full contents of every journaled migration
(hand-applied 2026-04-19 during the /groups outage hotfix — see
`scripts/apply-0026-to-0029-runner.mjs` and `scripts/apply-0030-runner.mjs`)
but has no `drizzle.__drizzle_migrations` table. Running drizzle-kit migrate
as-is would try to re-run every SQL file, and most would fail on
`CREATE TABLE` / `ADD COLUMN` without `IF NOT EXISTS`.

We chose seeding (not idempotency rewrites) because:

- Seeding matches reality: the migrations are applied, we just didn't record
  them.
- Rewriting ~31 historical SQL files to be idempotent is a much larger diff
  with more risk of changing behavior on a fresh DB.
- The seed logic is self-guarded (only inserts when the table is empty), so
  re-running the deploy pipeline is safe.

## Journal repair (also landed in this task)

Before this task, `meta/_journal.json` was missing three entries whose SQL
files existed on disk:

| File                         | Issue                                  |
|------------------------------|----------------------------------------|
| `0012_trigram_search.sql`    | Orphaned — shared index 12 with `0012_ordinary_deathbird`. |
| `0029_audit_events.sql`      | Sprint 17 migration never journaled.   |
| `0030_chms_integration.sql`  | Sprint 18 migration never journaled.   |

We added all three to the journal. Without these entries, drizzle's migrator
can never see the files and a fresh DB (CI integration, preview branch,
disaster recovery) would ship incomplete.

## Known gotchas

1. **`0012_trigram_search.sql` contains `CREATE INDEX CONCURRENTLY`.**
   Postgres rejects `CREATE INDEX CONCURRENTLY` inside a transaction, and
   drizzle's migrator wraps every statement in a single transaction
   (`session.transaction(...)` — see
   `node_modules/drizzle-orm/pg-core/dialect.js`). On prod this is fine
   because the seed marks it as already-applied. **But any fresh DB
   (staging reset, preview branch seeding, disaster recovery) would fail on
   this migration.** Fix in a future sprint: either replace `CONCURRENTLY`
   with a non-concurrent index create, or move it to a separate
   out-of-transaction runner. Filed as a follow-up; not fixed in this task
   because it would rewrite history.

2. **Drizzle's skip logic is `max(created_at)` based, not hash-based.**
   A new migration added with a `when` value earlier than any existing
   `created_at` in the DB will be silently skipped. Always add new
   migrations with a `when` greater than all current entries. The
   `drizzle-kit generate` command does this correctly; be careful if you
   ever hand-edit the journal (as this task did to repair it).

3. **SQL file line endings matter for the hash.** We added
   `*.sql text eol=lf` to `.gitattributes` so Windows checkouts don't
   produce CRLF files with different hashes. The skip logic doesn't
   currently use hashes, but seed audits compare them — keeping them stable
   avoids noise.

4. **`npm run db:migrate` (the raw `drizzle-kit migrate` command) is what
   `.github/workflows/ci.yml` runs against `NEON_INTEGRATION_DB_URL`.** That
   DB is long-lived and already seeded, so this keeps working. If the
   integration DB is ever reset, seed it using `scripts/migrate-deploy.mjs`
   first (`MIGRATE_FORCE=1 DATABASE_URL=... node scripts/migrate-deploy.mjs`).

## Manual override / rollback

If the migrate step wedges a deploy:

- **Re-run the deploy workflow.** The runner is rerun-safe. If it's already
  applied a migration that's now causing the failure, the retry will see the
  applied state and move on.
- **Skip migrations for a single deploy:** set the workflow step to
  `continue-on-error: true` OR comment out the "Apply DB migrations" step.
  **Only do this with PM sign-off** — you're explicitly accepting the risk
  that the new code assumes schema the DB doesn't have.
- **Run the runner locally against prod:** write prod `DATABASE_URL` into
  `.env.production.tmp`, run
  `MIGRATE_FORCE=1 DATABASE_URL=$(grep '^DATABASE_URL' .env.production.tmp | cut -d= -f2-) node scripts/migrate-deploy.mjs`.
  This is the same pattern `scripts/apply-0030-runner.mjs` established.
- **To roll back a schema change:** drizzle does not generate automatic
  down-migrations. Write a new forward-migration (`drizzle-kit generate`
  after reverting `src/db/schema.ts`) and ship it through the same pipeline.
  For emergencies, hand-apply the DDL against prod and then insert a matching
  row into `drizzle.__drizzle_migrations` so future `migrate` runs skip it.

## Verification: dry-run

`scripts/migrate-dry-run.mjs` does everything the deploy runner does,
read-only. It reports:

- Whether `drizzle` schema + table exist on the target DB.
- How many rows exist and what max `created_at` is.
- How many rows the seed would insert.
- Which (if any) migrations are pending.
- Whether any SQL files are orphans (in directory, not in journal).
- Whether any journal entries point at missing files.

Usage:
```bash
# Write prod DATABASE_URL into a temp file:
echo 'DATABASE_URL=postgres://...' > .env.production.tmp
node scripts/migrate-dry-run.mjs
# The script deletes .env.production.tmp on exit.
```

2026-04-19 dry-run against prod (before pipeline ships) confirmed:
- `drizzle` schema: missing
- `drizzle.__drizzle_migrations` table: missing
- Would seed 31 rows from journal, then `drizzle-kit migrate` would no-op.

## Preview / staging

Currently out of scope for auto-migrate. `.github/workflows/neon-branch.yml`
creates a bare Neon branch per PR but does not migrate it or wire the URL
into app env. The active pre-prod migration check is
`.github/workflows/ci.yml` → `integration` job, which runs
`npm run db:migrate` against the long-lived `NEON_INTEGRATION_DB_URL` on
every push.

Wiring migrate into the PR preview flow is a follow-up if/when preview
branches are used for end-to-end testing. Open question: whether each
preview branch should seed from prod's state or start empty and apply all
migrations (which would currently fail on `0012_trigram_search`).
