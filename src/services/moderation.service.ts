import { db } from '@/db';
import { reports, prayers, prayerInteractions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function reportContent(data: {
  reporterId: string | null;
  prayerId?: string;
  interactionId?: string;
  reason: string;
}) {
  const [report] = await db.insert(reports).values(data).returning();
  return report;
}

export async function getPendingReports() {
  return db.select().from(reports).where(eq(reports.status, 'pending')).orderBy(reports.createdAt);
}

export async function approveReport(reportId: string) {
  await db.update(reports).set({ status: 'reviewed' }).where(eq(reports.id, reportId));
}

export async function rejectContent(reportId: string) {
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return;

  if (report.prayerId) {
    await db.update(prayers).set({ status: 'expired' }).where(eq(prayers.id, report.prayerId));
  }
  if (report.interactionId) {
    await db.update(prayerInteractions).set({ message: null }).where(eq(prayerInteractions.id, report.interactionId));
  }

  await db.update(reports).set({ status: 'reviewed' }).where(eq(reports.id, reportId));
}

export async function dismissReport(reportId: string) {
  await db.update(reports).set({ status: 'dismissed' }).where(eq(reports.id, reportId));
}
