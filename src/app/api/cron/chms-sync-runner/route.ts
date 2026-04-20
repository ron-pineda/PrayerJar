import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chmsSyncJobs, churchMembers } from '@/db/schema';
import { eq, and, lte, lt, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import { getAdapterForChurch } from '@/lib/chms/providers';
import { notifyAdmins } from '@/lib/admin-notify';
import type { ChmsWebhookResult } from '@/lib/chms/ChmsAdapter';
import { trackChmsSyncFailed } from '@/lib/analytics.server';

const BATCH_SIZE = 10;

/** Millisecond delays for attempt index 0, 1, 2. attempt >= maxAttempts → dead. */
const RETRY_DELAYS = [0, 60_000, 300_000];

function classifyError(err: unknown): 'auth' | 'transient' | 'permanent' {
  const msg = err instanceof Error ? err.message : String(err);
  const status =
    err instanceof Error && 'status' in err ? (err as { status?: number }).status : undefined;

  if (msg.includes('PCO_AUTH_EXPIRED') || msg.includes('PCO_REFRESH_FAILED')) return 'auth';
  if (
    msg.includes('PCO_RATE_LIMITED') ||
    status === 429 ||
    (typeof status === 'number' && status >= 500)
  )
    return 'transient';
  return 'permanent';
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch up to BATCH_SIZE pending jobs whose next_attempt_at is <= now
  const jobs = await db
    .select()
    .from(chmsSyncJobs)
    .where(
      and(
        eq(chmsSyncJobs.status, 'pending'),
        lte(chmsSyncJobs.nextAttemptAt, new Date()),
        lt(chmsSyncJobs.attempt, chmsSyncJobs.maxAttempts),
      )
    )
    .orderBy(chmsSyncJobs.nextAttemptAt)
    .limit(BATCH_SIZE);

  let processed = 0;
  let errors = 0;

  for (const job of jobs) {
    // Mark running
    const newAttempt = job.attempt + 1;
    await db
      .update(chmsSyncJobs)
      .set({ status: 'running', startedAt: new Date(), attempt: newAttempt })
      .where(eq(chmsSyncJobs.id, job.id));

    try {
      const adapter = await getAdapterForChurch(job.churchId);

      if (job.jobType === 'full_sync') {
        const [members, groups] = await Promise.all([
          adapter.listMembers(job.churchId),
          adapter.listGroups(job.churchId),
        ]);
        for (const member of members) {
          await adapter.syncMember(job.churchId, member);
        }
        for (const group of groups) {
          await adapter.syncGroup(job.churchId, group);
        }
      } else if (job.jobType === 'delta_sync') {
        const result = job.payload as ChmsWebhookResult;
        if (result.action === 'upsert' && result.member) {
          await adapter.syncMember(job.churchId, result.member);
        } else if (result.action === 'delete') {
          // Find the church member by externalChmsId and mark inactive
          await db
            .update(churchMembers)
            .set({ chmsStatus: 'inactive' })
            .where(
              and(
                eq(churchMembers.churchId, job.churchId),
                eq(churchMembers.externalChmsId, result.externalId),
              )
            );
        }
      } else if (job.jobType === 'push_summary') {
        const payload = job.payload as { externalMemberId: string; summary: string };
        await adapter.pushPrayerSummary(job.churchId, payload.externalMemberId, payload.summary);
      }

      // Success
      await db
        .update(chmsSyncJobs)
        .set({ status: 'done', completedAt: new Date(), error: null })
        .where(eq(chmsSyncJobs.id, job.id));

      processed++;
    } catch (err) {
      errors++;
      const errMsg = err instanceof Error ? err.message : String(err);
      const kind = classifyError(err);
      const isDead = kind === 'auth' || kind === 'permanent' || newAttempt >= job.maxAttempts;

      if (isDead) {
        await db
          .update(chmsSyncJobs)
          .set({ status: 'dead', error: errMsg, completedAt: new Date() })
          .where(eq(chmsSyncJobs.id, job.id));

        // Fire analytics: sync job marked dead
        await trackChmsSyncFailed({
          church_id: job.churchId,
          provider: job.provider,
          job_type: job.jobType,
          error_class: kind,
          attempt: newAttempt,
        });

        Sentry.captureException(err, {
          extra: {
            jobId: job.id,
            churchId: job.churchId,
            jobType: job.jobType,
            attempt: newAttempt,
            errorKind: kind,
          },
        });

        notifyAdmins({
          subject: `[PrayerJar] ChMS sync job dead — ${job.jobType}`,
          body: [
            `Job ID: ${job.id}`,
            `Church ID: ${job.churchId}`,
            `Job type: ${job.jobType}`,
            `Attempt: ${newAttempt} / ${job.maxAttempts}`,
            `Error kind: ${kind}`,
            `Error: ${errMsg}`,
          ].join('\n'),
          link: `${process.env.NEXTAUTH_URL ?? ''}/admin/chms-sync`,
        }).catch(() => {});
      } else {
        // Transient — schedule retry with backoff
        const delayMs = RETRY_DELAYS[newAttempt] ?? 300_000;
        const nextAttemptAt = new Date(Date.now() + delayMs);
        await db
          .update(chmsSyncJobs)
          .set({ status: 'pending', error: errMsg, nextAttemptAt })
          .where(eq(chmsSyncJobs.id, job.id));
      }
    }
  }

  return NextResponse.json({ processed, errors });
}
