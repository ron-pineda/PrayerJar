/**
 * Restore expired prayers to the wall (Ron, 2026-07-25).
 *
 * Context: every prayer in production had reached `status: 'expired'` — the
 * 30-day auto-expiry kept running through the three-month email outage that
 * stopped all new signups. The result was a live product whose /browse page
 * told every visitor "Be the first to share a prayer" while eleven real
 * prayers, written by real people, sat hidden.
 *
 * This restores that real content. It fabricates nothing: every row it touches
 * already exists and was written by a person. Authors keep full control —
 * they can still renew, mark answered, or delete their own prayers.
 *
 * Pairs with the expiry suspension in src/app/api/cron/expire-prayers/route.ts.
 * Restored prayers get `expiresAt` a year out so that re-enabling expiry later
 * cannot silently wipe them in a single pass.
 *
 * Only touches rows with status='expired'. Answered prayers are never altered.
 *
 * Usage:
 *   node --env-file=.env.local scripts/restore-expired-prayers.mjs          # dry run
 *   node --env-file=.env.local scripts/restore-expired-prayers.mjs --commit # execute
 */
import { neon } from '@neondatabase/serverless';

const COMMIT = process.argv.includes('--commit');
const sql = neon(process.env.DATABASE_URL);

const EXTEND_DAYS = 365;

async function main() {
  const before = await sql`select status, count(*)::int c from prayers group by status order by status`;
  console.log('prayer status before:');
  for (const r of before) console.log(`  ${r.status}: ${r.c}`);

  const expired = await sql`
    select id, left(content, 60) as preview, created_at
    from prayers where status = 'expired' order by created_at`;

  if (expired.length === 0) {
    console.log('\nNothing to restore — no prayers are expired.');
    return;
  }

  console.log(`\n${expired.length} prayer(s) would be restored to active:`);
  for (const p of expired) {
    console.log(`  ${p.created_at.toISOString().slice(0, 10)}  ${p.preview.replace(/\s+/g, ' ')}…`);
  }

  const answeredBefore = before.find((r) => r.status === 'answered')?.c ?? 0;

  if (!COMMIT) {
    console.log(`\nDRY RUN — nothing changed. Re-run with --commit to restore.`);
    console.log(`Restored prayers would get expiresAt = now + ${EXTEND_DAYS} days.`);
    return;
  }

  const updated = await sql`
    update prayers
       set status = 'active',
           expires_at = NOW() + (${EXTEND_DAYS} || ' days')::interval
     where status = 'expired'
    returning id`;

  console.log(`\nrestored ${updated.length} prayer(s)`);

  const after = await sql`select status, count(*)::int c from prayers group by status order by status`;
  console.log('prayer status after:');
  for (const r of after) console.log(`  ${r.status}: ${r.c}`);

  const answeredAfter = after.find((r) => r.status === 'answered')?.c ?? 0;
  if (answeredAfter !== answeredBefore) {
    console.error('\nWARNING: answered count changed. Investigate immediately.');
    process.exit(1);
  }

  const stillExpired = after.find((r) => r.status === 'expired')?.c ?? 0;
  console.log(
    stillExpired === 0
      ? '\nOK — wall restored, no answered prayers touched.'
      : `\nNOTE: ${stillExpired} prayer(s) still expired.`
  );
}

main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
