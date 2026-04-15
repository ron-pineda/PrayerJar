import { db } from '@/db';
import { prayerInteractions } from '@/db/schema';
import { count, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const rows = await db
      .select({ count: count() })
      .from(prayerInteractions)
      .where(gte(prayerInteractions.createdAt, fiveMinutesAgo));
    return Response.json({ count: Number(rows[0]?.count ?? 0) });
  } catch {
    return Response.json({ count: 0 });
  }
}
