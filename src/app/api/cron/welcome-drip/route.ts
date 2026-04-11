import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, welcomeDripStatus } from '@/db/schema';
import { sendWelcome2Email, sendWelcome3Email } from '@/services/email.service';
import { eq, isNull, and, lt } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  const sixtyEightHoursAgo = new Date(now.getTime() - 68 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: welcomeDripStatus.userId,
      email2SentAt: welcomeDripStatus.email2SentAt,
      email3SentAt: welcomeDripStatus.email3SentAt,
      createdAt: welcomeDripStatus.createdAt,
      email: users.email,
    })
    .from(welcomeDripStatus)
    .innerJoin(users, eq(users.id, welcomeDripStatus.userId));

  let sent2 = 0;
  let sent3 = 0;

  for (const row of rows) {
    if (!row.email) continue;

    if (!row.email2SentAt && row.createdAt < twentyHoursAgo) {
      await sendWelcome2Email(row.userId, row.email);
      sent2++;
    }

    if (!row.email3SentAt && row.createdAt < sixtyEightHoursAgo) {
      await sendWelcome3Email(row.userId, row.email);
      sent3++;
    }
  }

  return NextResponse.json({ sent2, sent3 });
}
