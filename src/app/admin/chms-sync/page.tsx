/**
 * /admin/chms-sync — ChMS Sync Jobs Dashboard
 *
 * Shows status for both the full-sync scheduler and the weekly PCO summary
 * scheduler (pj-s22-09). Referenced by the dead-job notification emails that
 * the chms-sync-runner sends when a job hits its max retry count.
 */

import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { chmsSyncJobs } from '@/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'ChMS Sync Jobs | Admin | The Prayer Jar' };

// How far back to look for "last run" stats
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

async function getSyncStats() {
  const [
    fullSyncPending,
    fullSyncDone7d,
    fullSyncDead7d,
    summaryPending,
    summaryDone7d,
    summaryDead7d,
    recentDeadJobs,
  ] = await Promise.all([
    // full_sync pending
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.jobType, 'full_sync'),
          sql`${chmsSyncJobs.status} IN ('pending', 'running')`,
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // full_sync done in last 7d
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.jobType, 'full_sync'),
          eq(chmsSyncJobs.status, 'done'),
          gte(chmsSyncJobs.completedAt, SEVEN_DAYS_AGO),
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // full_sync dead in last 7d
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.jobType, 'full_sync'),
          eq(chmsSyncJobs.status, 'dead'),
          gte(chmsSyncJobs.createdAt, SEVEN_DAYS_AGO),
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // push_summary pending
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.jobType, 'push_summary'),
          sql`${chmsSyncJobs.status} IN ('pending', 'running')`,
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // push_summary done in last 7d
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.jobType, 'push_summary'),
          eq(chmsSyncJobs.status, 'done'),
          gte(chmsSyncJobs.completedAt, SEVEN_DAYS_AGO),
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // push_summary dead in last 7d
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.jobType, 'push_summary'),
          eq(chmsSyncJobs.status, 'dead'),
          gte(chmsSyncJobs.createdAt, SEVEN_DAYS_AGO),
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // Most recent dead jobs (any type) for troubleshooting
    db
      .select({
        id: chmsSyncJobs.id,
        churchId: chmsSyncJobs.churchId,
        jobType: chmsSyncJobs.jobType,
        provider: chmsSyncJobs.provider,
        attempt: chmsSyncJobs.attempt,
        maxAttempts: chmsSyncJobs.maxAttempts,
        error: chmsSyncJobs.error,
        completedAt: chmsSyncJobs.completedAt,
      })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.status, 'dead'),
          gte(chmsSyncJobs.createdAt, SEVEN_DAYS_AGO),
        )
      )
      .orderBy(desc(chmsSyncJobs.completedAt))
      .limit(20),
  ]);

  return {
    fullSyncPending,
    fullSyncDone7d,
    fullSyncDead7d,
    summaryPending,
    summaryDone7d,
    summaryDead7d,
    recentDeadJobs,
  };
}

export default async function ChmsJobsAdminPage() {
  await requireAdmin();

  const stats = await getSyncStats();

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ChMS Sync Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Last 7 days. Cron: full-sync daily at 03:00 UTC, summary scheduler weekly Sun 05:00 UTC, runner daily at 04:00 UTC.
        </p>
      </div>

      {/* Full Sync row */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Full Sync</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Pending / Running" value={stats.fullSyncPending} />
          <StatCard title="Completed (7d)" value={stats.fullSyncDone7d} />
          <StatCard title="Dead (7d)" value={stats.fullSyncDead7d} warn={stats.fullSyncDead7d > 0} />
        </div>
      </section>

      {/* Weekly Summary row */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">PCO Weekly Summary (push_summary)</h2>
        <p className="text-xs text-muted-foreground">
          Pro + Enterprise PCO churches only. Flag key: <code>pco_summary_scheduler</code> (opt-out — missing = enabled).
          Cap: 500 members per church per run, oldest-synced first.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Pending / Running" value={stats.summaryPending} />
          <StatCard title="Completed (7d)" value={stats.summaryDone7d} />
          <StatCard title="Dead (7d)" value={stats.summaryDead7d} warn={stats.summaryDead7d > 0} />
        </div>
      </section>

      {/* Dead jobs table */}
      {stats.recentDeadJobs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-destructive">
            Dead Jobs (last 7d, newest first)
          </h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Church ID</th>
                  <th className="px-3 py-2 text-left font-medium">Job Type</th>
                  <th className="px-3 py-2 text-left font-medium">Provider</th>
                  <th className="px-3 py-2 text-left font-medium">Attempts</th>
                  <th className="px-3 py-2 text-left font-medium">Error</th>
                  <th className="px-3 py-2 text-left font-medium">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentDeadJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{job.churchId.slice(0, 8)}&hellip;</td>
                    <td className="px-3 py-2">{job.jobType}</td>
                    <td className="px-3 py-2">{job.provider}</td>
                    <td className="px-3 py-2">{job.attempt}/{job.maxAttempts}</td>
                    <td className="px-3 py-2 text-destructive max-w-xs truncate" title={job.error ?? ''}>
                      {job.error ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {job.completedAt ? job.completedAt.toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats.recentDeadJobs.length === 0 && (
        <p className="text-muted-foreground text-sm">No dead jobs in the last 7 days.</p>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  warn = false,
}: {
  title: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className={`text-3xl font-bold tracking-tight ${warn ? 'text-destructive' : ''}`}>
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
