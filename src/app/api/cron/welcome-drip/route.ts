import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, welcomeDripStatus, churchAdminDripStatus, churchMembers, churches } from '@/db/schema';
import { sendWelcome2Email, sendWelcome3Email, sendChurchWelcome2Email, sendChurchWelcome3Email } from '@/services/email.service';
import { eq, isNull, isNotNull, and, lt, count, ne } from 'drizzle-orm';

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

  // ── Church admin drip ──
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let churchSent2 = 0;
  let churchSent3 = 0;

  // Email 2 pass: churches created 3+ days ago, no email2 yet
  const email2Candidates = await db
    .select({
      churchId: churchAdminDripStatus.churchId,
      adminEmail: users.email,
      churchSlug: churches.slug,
    })
    .from(churchAdminDripStatus)
    .innerJoin(users, eq(users.id, churchAdminDripStatus.adminUserId))
    .innerJoin(churches, eq(churches.id, churchAdminDripStatus.churchId))
    .where(
      and(
        isNull(churchAdminDripStatus.email2SentAt),
        lt(churchAdminDripStatus.createdAt, threeDaysAgo),
      )
    );

  for (const row of email2Candidates) {
    if (!row.adminEmail || !row.churchSlug) continue;

    const [memberCount] = await db
      .select({ count: count() })
      .from(churchMembers)
      .where(
        and(
          eq(churchMembers.churchId, row.churchId),
          ne(churchMembers.role, 'admin'),
        )
      );

    if ((memberCount?.count ?? 0) === 0) {
      await sendChurchWelcome2Email(row.churchId, row.adminEmail, row.churchSlug);
      churchSent2++;
    } else {
      await db
        .update(churchAdminDripStatus)
        .set({ email2SentAt: new Date() })
        .where(eq(churchAdminDripStatus.churchId, row.churchId));
    }
  }

  // Email 3 pass: churches created 7+ days ago, no email3 yet
  const email3Candidates = await db
    .select({
      churchId: churchAdminDripStatus.churchId,
      adminEmail: users.email,
      churchSlug: churches.slug,
    })
    .from(churchAdminDripStatus)
    .innerJoin(users, eq(users.id, churchAdminDripStatus.adminUserId))
    .innerJoin(churches, eq(churches.id, churchAdminDripStatus.churchId))
    .where(
      and(
        isNull(churchAdminDripStatus.email3SentAt),
        isNotNull(churchAdminDripStatus.email2SentAt),
        lt(churchAdminDripStatus.createdAt, sevenDaysAgo),
      )
    );

  for (const row of email3Candidates) {
    if (!row.adminEmail || !row.churchSlug) continue;

    const [memberCount] = await db
      .select({ count: count() })
      .from(churchMembers)
      .where(
        and(
          eq(churchMembers.churchId, row.churchId),
          ne(churchMembers.role, 'admin'),
        )
      );

    if ((memberCount?.count ?? 0) === 0) {
      await sendChurchWelcome3Email(row.churchId, row.adminEmail, row.churchSlug);
      churchSent3++;
    } else {
      await db
        .update(churchAdminDripStatus)
        .set({ email3SentAt: new Date() })
        .where(eq(churchAdminDripStatus.churchId, row.churchId));
    }
  }

  return NextResponse.json({ sent2, sent3, churchSent2, churchSent3 });
}
