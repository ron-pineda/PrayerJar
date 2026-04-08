import { NextRequest, NextResponse } from 'next/server';
import { expireOverduePrayers } from '@/services/prayer.service';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await expireOverduePrayers();
  return NextResponse.json({ expired: expired.length });
}
