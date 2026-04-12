import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { db } from '@/db';
import { prayers, prayerInteractions } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiKey(req);
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    [totalRow],
    [activeRow],
    [answeredRow],
    [interactionsRow],
  ] = await Promise.all([
    db.select({ total: count() }).from(prayers),
    db.select({ total: count() }).from(prayers).where(eq(prayers.status, 'active')),
    db.select({ total: count() }).from(prayers).where(eq(prayers.status, 'answered')),
    db.select({ total: count() }).from(prayerInteractions),
  ]);

  return NextResponse.json({
    totalPrayers: Number(totalRow?.total ?? 0),
    activePrayers: Number(activeRow?.total ?? 0),
    answeredPrayers: Number(answeredRow?.total ?? 0),
    totalInteractions: Number(interactionsRow?.total ?? 0),
  });
}
