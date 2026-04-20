/**
 * PCO Weekly Summary Scheduler — pj-s22-09
 *
 * Enqueues one `push_summary` job per PCO-linked church member for every
 * church that:
 *   1. Uses Planning Center as its ChMS provider
 *   2. Is on Pro or Enterprise plan (currentPlan)
 *   3. Has not been disabled by the global kill-switch feature flag
 *      `pco_summary_scheduler` (opt-out: missing flag = enabled)
 *
 * Per-church cap: 500 members max per run to avoid queue saturation.
 * Dedup: a job is skipped if a pending or running push_summary job for
 * that (church, member) was already created in the last 7 days.
 *
 * Cron schedule: `0 5 * * 0` — every Sunday at 05:00 UTC.
 *   (Distinct from partner-matching at 02:00 UTC and full-sync-scheduler
 *   at 03:00 UTC to prevent Vercel concurrency stacking.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { churches, churchMembers, chmsSyncJobs, featureFlags } from '@/db/schema';
import { eq, and, isNotNull, inArray, gte, sql } from 'drizzle-orm';

const PCO_PROVIDER = 'planning-center';
const PRO_TIERS = ['pro', 'enterprise'] as const;

/** Max members enqueued per church per run. Prevents queue saturation for
 *  very large churches. Members are fetched ordered by chmsSyncedAt ASC so
 *  the oldest-synced members are prioritised, ensuring full coverage over
 *  multiple weekly runs for churches > 500 PCO-linked members. */
const MAX_MEMBERS_PER_CHURCH = 500;

/** Feature flag key. If the row is missing we treat the flag as enabled
 *  (opt-out model). If the row exists and isEnabled = false we skip all
 *  churches. This is intentionally a global kill-switch — there is no
 *  per-church scoping in the feature_flags table. */
const FLAG_KEY = 'pco_summary_scheduler';

export async function GET(req: NextRequest) {
  // --- Auth ---
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Global feature flag kill-switch (opt-out: missing = enabled) ---
  const [flagRow] = await db
    .select({ isEnabled: featureFlags.isEnabled })
    .from(featureFlags)
    .where(eq(featureFlags.key, FLAG_KEY))
    .limit(1);

  // If the flag row exists and is explicitly disabled, abort.
  if (flagRow && flagRow.isEnabled === false) {
    return NextResponse.json({ scheduled: 0, skipped: 0, flagDisabled: true });
  }

  // --- Eligible churches: PCO + Pro/Enterprise ---
  const eligibleChurches = await db
    .select({ id: churches.id, chmsProvider: churches.chmsProvider })
    .from(churches)
    .where(
      and(
        eq(churches.chmsProvider, PCO_PROVIDER),
        inArray(churches.currentPlan, [...PRO_TIERS]),
      )
    );

  // Cutoff for dedup: no push_summary job in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let totalScheduled = 0;
  let totalSkipped = 0;

  for (const church of eligibleChurches) {
    if (!church.chmsProvider) continue;

    // Fetch existing pending/running push_summary jobs for this church in
    // the past 7 days so we can dedup efficiently with a Set.
    const existingJobs = await db
      .select({ payload: chmsSyncJobs.payload })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.churchId, church.id),
          eq(chmsSyncJobs.jobType, 'push_summary'),
          sql`${chmsSyncJobs.status} IN ('pending', 'running')`,
          gte(chmsSyncJobs.createdAt, sevenDaysAgo),
        )
      );

    // Build a Set of already-queued externalMemberIds for O(1) lookup
    const alreadyQueued = new Set<string>(
      existingJobs
        .map((j) => {
          const p = j.payload as { externalMemberId?: string } | null;
          return p?.externalMemberId ?? null;
        })
        .filter((id): id is string => id !== null)
    );

    // Fetch PCO-linked members for this church, oldest-synced first,
    // capped at MAX_MEMBERS_PER_CHURCH.
    const members = await db
      .select({
        externalChmsId: churchMembers.externalChmsId,
        chmsSyncedAt: churchMembers.chmsSyncedAt,
      })
      .from(churchMembers)
      .where(
        and(
          eq(churchMembers.churchId, church.id),
          eq(churchMembers.chmsProvider, PCO_PROVIDER),
          isNotNull(churchMembers.externalChmsId),
          eq(churchMembers.chmsStatus, 'active'),
        )
      )
      .orderBy(churchMembers.chmsSyncedAt)
      .limit(MAX_MEMBERS_PER_CHURCH);

    for (const member of members) {
      if (!member.externalChmsId) continue;

      if (alreadyQueued.has(member.externalChmsId)) {
        totalSkipped++;
        continue;
      }

      await db.insert(chmsSyncJobs).values({
        churchId: church.id,
        provider: church.chmsProvider,
        jobType: 'push_summary',
        status: 'pending',
        payload: { externalMemberId: member.externalChmsId, summary: 'weekly' },
        attempt: 0,
        maxAttempts: 3,
        nextAttemptAt: new Date(),
      });

      totalScheduled++;
    }
  }

  return NextResponse.json({ scheduled: totalScheduled, skipped: totalSkipped });
}
