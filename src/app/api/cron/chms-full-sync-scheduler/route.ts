import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { churches, chmsSyncJobs } from '@/db/schema';
import { isNotNull, eq, and, gte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // All churches with a ChMS provider connected
  const connectedChurches = await db
    .select({ id: churches.id, chmsProvider: churches.chmsProvider })
    .from(churches)
    .where(isNotNull(churches.chmsProvider));

  // Start of today UTC — used to check if a full_sync job already exists for today
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let scheduled = 0;
  let skipped = 0;

  for (const church of connectedChurches) {
    if (!church.chmsProvider) continue;

    // Check if a pending or running full_sync already exists for this church today
    const [existing] = await db
      .select({ id: chmsSyncJobs.id })
      .from(chmsSyncJobs)
      .where(
        and(
          eq(chmsSyncJobs.churchId, church.id),
          eq(chmsSyncJobs.jobType, 'full_sync'),
          sql`${chmsSyncJobs.status} IN ('pending', 'running')`,
          gte(chmsSyncJobs.createdAt, todayStart),
        )
      )
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(chmsSyncJobs).values({
      churchId: church.id,
      provider: church.chmsProvider,
      jobType: 'full_sync',
      status: 'pending',
      attempt: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
    });

    scheduled++;
  }

  return NextResponse.json({ scheduled, skipped });
}
