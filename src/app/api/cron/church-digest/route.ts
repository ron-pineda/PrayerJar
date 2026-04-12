// Cron: every Monday at 8am UTC — weekly church prayer digest
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { churches, churchMembers, prayers, prayerInteractions, prayerFlags, users } from '@/db/schema';
import { eq, and, gte, inArray, count, sql } from 'drizzle-orm';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import ChurchDigestEmail from '@/emails/church-digest';

const resend = new Resend(process.env.AUTH_RESEND_KEY ?? 're_placeholder');
const FROM = process.env.AUTH_EMAIL_FROM ?? 'Prayer Jar <noreply@prayerjar.org>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prayerjar.org';

function formatWeekOf(): string {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(end.getDate() - 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${startStr}–${endStr}`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekOf = formatWeekOf();

  // 1. Get all churches that have at least one admin or pastor
  const adminRows = await db
    .selectDistinct({ churchId: churchMembers.churchId })
    .from(churchMembers)
    .where(inArray(churchMembers.role, ['admin', 'pastor']));

  if (adminRows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const churchIds = adminRows.map((r) => r.churchId);

  // 2. Fetch church names in one query
  const churchRows = await db
    .select({ id: churches.id, name: churches.name })
    .from(churches)
    .where(inArray(churches.id, churchIds));

  const churchMap = new Map(churchRows.map((c) => [c.id, c.name]));

  let sent = 0;

  await Promise.allSettled(
    churchIds.map(async (churchId) => {
      const churchName = churchMap.get(churchId) ?? 'Your Church';

      // --- Stats ---

      // New prayers this week
      const [newPrayersRow] = await db
        .select({ val: count() })
        .from(prayers)
        .where(and(eq(prayers.churchId, churchId), gte(prayers.createdAt, sevenDaysAgo)));

      // Answered prayers this week
      const [answeredRow] = await db
        .select({ val: count() })
        .from(prayers)
        .where(
          and(
            eq(prayers.churchId, churchId),
            eq(prayers.status, 'answered'),
            gte(prayers.answeredAt, sevenDaysAgo),
          )
        );

      // New members this week
      const [newMembersRow] = await db
        .select({ val: count() })
        .from(churchMembers)
        .where(and(eq(churchMembers.churchId, churchId), gte(churchMembers.joinedAt, sevenDaysAgo)));

      // Pending flagged prayers
      const [flaggedRow] = await db
        .select({ val: count() })
        .from(prayerFlags)
        .where(and(eq(prayerFlags.churchId, churchId), eq(prayerFlags.status, 'pending')));

      // Total interactions this week for this church's prayers
      const churchPrayers = await db
        .select({ id: prayers.id })
        .from(prayers)
        .where(eq(prayers.churchId, churchId));

      let totalInteractions = 0;
      if (churchPrayers.length > 0) {
        const prayerIdList = churchPrayers.map((p) => p.id);
        const [interactionsRow] = await db
          .select({ val: count() })
          .from(prayerInteractions)
          .where(
            and(
              inArray(prayerInteractions.prayerId, prayerIdList),
              gte(prayerInteractions.createdAt, sevenDaysAgo),
            )
          );
        totalInteractions = interactionsRow?.val ?? 0;
      }

      // Top 3 prayers by interaction count this week
      const topPrayerRows = await db
        .select({
          content: prayers.content,
          category: prayers.category,
          prayedCount: sql<number>`cast(count(${prayerInteractions.id}) as integer)`,
        })
        .from(prayers)
        .leftJoin(
          prayerInteractions,
          and(
            eq(prayerInteractions.prayerId, prayers.id),
            gte(prayerInteractions.createdAt, sevenDaysAgo),
          )
        )
        .where(eq(prayers.churchId, churchId))
        .groupBy(prayers.id, prayers.content, prayers.category)
        .orderBy(sql`count(${prayerInteractions.id}) desc`)
        .limit(3);

      const topPrayers = topPrayerRows
        .filter((p) => p.prayedCount > 0)
        .map((p) => ({
          content: p.content.length > 100 ? p.content.slice(0, 100) : p.content,
          prayedCount: p.prayedCount,
          category: p.category,
        }));

      // 3. Get admin/pastor emails
      const adminEmails = await db
        .select({ email: users.email })
        .from(churchMembers)
        .innerJoin(users, eq(users.id, churchMembers.userId))
        .where(
          and(
            eq(churchMembers.churchId, churchId),
            inArray(churchMembers.role, ['admin', 'pastor']),
          )
        );

      const emails = adminEmails.map((r) => r.email).filter(Boolean) as string[];
      if (emails.length === 0) return;

      // 4. Render and send
      const digestUrl = `${BASE_URL}/church/${churchId}/dashboard`;

      const html = await render(
        ChurchDigestEmail({
          churchName,
          weekOf,
          stats: {
            newPrayers: newPrayersRow?.val ?? 0,
            answeredPrayers: answeredRow?.val ?? 0,
            totalInteractions,
            newMembers: newMembersRow?.val ?? 0,
          },
          flaggedCount: flaggedRow?.val ?? 0,
          topPrayers,
          digestUrl,
        })
      );

      await resend.emails.send({
        from: FROM,
        to: emails,
        subject: `Your Weekly Prayer Digest — ${churchName}`,
        html,
      });

      sent++;
    })
  );

  return NextResponse.json({ sent });
}
