/**
 * pj-s26-12 — remove the "Test Church" row from production.
 *
 * Context: prod held exactly one church row — name "Test Church",
 * slug test-church-7l78, description "This is a test church. It will
 * eventually be deleted", created 2026-04-14, subscription_id NULL,
 * first_paid_at NULL, current_plan 'pro' set by hand. It was being counted
 * as social proof by the /for-churches trust strip and its profile page was
 * publicly reachable.
 *
 * Verified 2026-07-25 across all 15 tables carrying a church_id: the cascade
 * touches exactly 2 dependent rows — one church_members, one
 * churchAdminDripStatus. Nothing else references it.
 *
 * This is destructive and irreversible. It refuses to run unless prod still
 * looks exactly as expected: exactly one church, named "Test Church".
 *
 * Usage:
 *   node --env-file=.env.local scripts/delete-test-church.mjs          # dry run
 *   node --env-file=.env.local scripts/delete-test-church.mjs --commit # execute
 */
import { neon } from '@neondatabase/serverless';

const COMMIT = process.argv.includes('--commit');
const sql = neon(process.env.DATABASE_URL);

const EXPECTED_NAME = 'Test Church';

async function main() {
  const churches = await sql`select id, name, slug, subscription_id, first_paid_at from churches`;

  if (churches.length !== 1) {
    console.error(`ABORT: expected exactly 1 church row, found ${churches.length}.`);
    console.error(JSON.stringify(churches, null, 2));
    process.exit(1);
  }

  const church = churches[0];

  if (church.name !== EXPECTED_NAME) {
    console.error(`ABORT: the single church is "${church.name}", not "${EXPECTED_NAME}".`);
    console.error('Refusing to delete a church this script was not written for.');
    process.exit(1);
  }

  if (church.subscription_id !== null || church.first_paid_at !== null) {
    console.error('ABORT: this church has billing history. Refusing to delete.');
    console.error(JSON.stringify(church, null, 2));
    process.exit(1);
  }

  console.log(`target: ${church.name} (${church.slug}) ${church.id}`);

  // Show the cascade before touching anything.
  const cols = await sql`
    select table_name from information_schema.columns
    where column_name = 'church_id' and table_schema = 'public'
    order by table_name`;

  console.log('\ncascade:');
  let dependents = 0;
  for (const { table_name: t } of cols) {
    const r = await sql.query(`select count(*)::int c from "${t}" where church_id = $1`, [church.id]);
    const c = (r.rows ?? r)[0].c;
    if (c > 0) {
      console.log(`  ${t}: ${c} row(s)`);
      dependents += c;
    }
  }
  console.log(`  (${dependents} dependent row(s) across ${cols.length} tables checked)`);

  const prayersBefore = (await sql`select count(*)::int c from prayers`)[0].c;
  const usersBefore = (await sql`select count(*)::int c from users`)[0].c;

  if (!COMMIT) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --commit to execute.');
    return;
  }

  const deleted = await sql`delete from churches where id = ${church.id} returning id`;
  console.log(`\ndeleted ${deleted.length} church row(s)`);

  const after = {
    churches: (await sql`select count(*)::int c from churches`)[0].c,
    members: (await sql`select count(*)::int c from church_members`)[0].c,
    prayers: (await sql`select count(*)::int c from prayers`)[0].c,
    users: (await sql`select count(*)::int c from users`)[0].c,
  };

  console.log(`churches: ${after.churches} (expect 0)`);
  console.log(`church_members: ${after.members} (expect 0)`);
  console.log(`prayers: ${after.prayers} (expect ${prayersBefore} — unchanged)`);
  console.log(`users: ${after.users} (expect ${usersBefore} — unchanged)`);

  if (after.prayers !== prayersBefore || after.users !== usersBefore) {
    console.error('\nWARNING: prayer or user counts changed. Investigate immediately.');
    process.exit(1);
  }
  console.log('\nOK — church removed, no user or prayer data touched.');
}

main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
