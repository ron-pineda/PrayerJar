import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { users, prayers, churches, reports, moderationLogs, contactSubmissions } from '@/db/schema';
import { eq, isNull, isNotNull, gte, sql, and, ilike } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CriticalBanner, type CriticalItem } from '@/components/admin/critical-banner';
import Link from 'next/link';

export const metadata = { title: 'Admin Overview | The Prayer Jar' };

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers7d,
    totalPrayers,
    prayers7d,
    totalChurches,
    pendingReports,
    aiRejections7d,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users).then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(gte(users.createdAt, sevenDaysAgo))
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(prayers).then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(prayers)
      .where(gte(prayers.createdAt, sevenDaysAgo))
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(churches).then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(reports)
      .where(eq(reports.status, 'pending'))
      .then((r) => r[0]?.count ?? 0),
    db.select({ count: sql<number>`count(*)::int` }).from(moderationLogs)
      .where(gte(moderationLogs.createdAt, sevenDaysAgo))
      .then((r) => r[0]?.count ?? 0),
  ]);

  return { totalUsers, activeUsers7d, totalPrayers, prayers7d, totalChurches, pendingReports, aiRejections7d };
}

async function getCriticalItems(): Promise<CriticalItem[]> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const items: CriticalItem[] = [];

  const [selfHarmLog, harassmentReport, oldUnreadContact] = await Promise.all([
    db.select({ id: moderationLogs.id }).from(moderationLogs)
      .where(and(
        eq(moderationLogs.category, 'selfHarm'),
        isNull(moderationLogs.resolvedAt),
        gte(moderationLogs.createdAt, twentyFourHoursAgo),
      ))
      .limit(1)
      .then((r) => r[0]),
    db.select({ id: reports.id }).from(reports)
      .where(and(
        eq(reports.status, 'pending'),
        ilike(reports.reason, '%harassment%'),
      ))
      .limit(1)
      .then((r) => r[0]),
    db.select({ id: contactSubmissions.id }).from(contactSubmissions)
      .where(and(
        isNull(contactSubmissions.readAt),
        sql`${contactSubmissions.createdAt} < ${twentyFourHoursAgo}`,
      ))
      .limit(1)
      .then((r) => r[0]),
  ]);

  if (selfHarmLog) {
    items.push({
      label: 'Unresolved self-harm flag in the last 24h',
      href: '/admin/moderation?category=selfHarm&status=unresolved',
    });
  }
  if (harassmentReport) {
    items.push({
      label: 'Unresolved harassment report',
      href: '/admin/queue',
    });
  }
  if (oldUnreadContact) {
    items.push({
      label: 'Unread contact submission older than 24h',
      href: '/admin/feedback',
    });
  }

  return items;
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [stats, criticalItems] = await Promise.all([getStats(), getCriticalItems()]);

  const statCards = [
    {
      title: 'Users',
      primary: stats.totalUsers.toLocaleString(),
      secondary: `${stats.activeUsers7d.toLocaleString()} joined last 7d`,
    },
    {
      title: 'Prayers',
      primary: stats.totalPrayers.toLocaleString(),
      secondary: `${stats.prayers7d.toLocaleString()} last 7d`,
    },
    {
      title: 'Churches',
      primary: stats.totalChurches.toLocaleString(),
      secondary: 'total signed up',
    },
    {
      title: 'Pending Reports',
      primary: stats.pendingReports.toLocaleString(),
      secondary: (
        <Link href="/admin/queue" className="text-xs underline text-muted-foreground hover:text-foreground">
          View queue
        </Link>
      ),
    },
    {
      title: 'AI Rejections',
      primary: stats.aiRejections7d.toLocaleString(),
      secondary: 'last 7d',
    },
  ];

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform health snapshot</p>
      </div>

      {criticalItems.length > 0 && (
        <CriticalBanner items={criticalItems} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold tracking-tight">{card.primary}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.secondary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
