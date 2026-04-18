import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { auditEvents, churches } from '@/db/schema';
import { and, inArray, lt } from 'drizzle-orm';
import { auditRetentionDays } from '@/lib/plans';
import type { PlanTier } from '@/lib/plans';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all churches with their current plan tier
  const allChurches = await db
    .select({ id: churches.id, currentPlan: churches.currentPlan })
    .from(churches);

  // Bucket church IDs by retention window — only 3 possible windows exist
  const buckets = new Map<number, string[]>();
  for (const church of allChurches) {
    const days = auditRetentionDays(church.currentPlan as PlanTier);
    if (!buckets.has(days)) buckets.set(days, []);
    buckets.get(days)!.push(church.id);
  }

  let deleted = 0;

  for (const [days, ids] of buckets) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(auditEvents)
      .where(
        and(
          inArray(auditEvents.churchId, ids),
          lt(auditEvents.createdAt, cutoff),
        )
      )
      .returning({ id: auditEvents.id });

    deleted += result.length;
  }

  return NextResponse.json({ deleted });
}
