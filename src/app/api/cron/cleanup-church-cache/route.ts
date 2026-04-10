import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { churchSearchCache } from '@/db/schema';
import { lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db
    .delete(churchSearchCache)
    .where(lt(churchSearchCache.expiresAt, new Date()))
    .returning({ id: churchSearchCache.id });

  return NextResponse.json({ deleted: result.length });
}
