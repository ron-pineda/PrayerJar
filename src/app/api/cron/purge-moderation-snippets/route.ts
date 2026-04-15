import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { moderationLogs } from '@/db/schema';
import { sql, isNotNull, lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await db
    .update(moderationLogs)
    .set({ contentSnippet: null })
    .where(
      sql`${moderationLogs.contentSnippet} IS NOT NULL AND ${moderationLogs.createdAt} < ${cutoff}`
    );

  // Drizzle returns rowCount on the result object for pg drivers.
  const purged = (result as unknown as { rowCount?: number }).rowCount ?? 0;

  return NextResponse.json({ purged });
}
