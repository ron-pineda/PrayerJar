import { NextResponse } from 'next/server';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { isNull, eq, count, and } from 'drizzle-orm';

export async function GET() {
  const rows = await db
    .select({ category: prayers.category, count: count() })
    .from(prayers)
    .where(
      and(
        eq(prayers.status, 'active'),
        isNull(prayers.groupId)
      )
    )
    .groupBy(prayers.category);

  // Filter to public prayers (no group) and sort descending
  const result = rows
    .filter((r) => r.count > 0)
    .map((r) => ({ category: r.category, count: Number(r.count) }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(result);
}
