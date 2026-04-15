'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { approveReport, rejectContent, dismissReport } from '@/services/moderation.service';
import { acknowledgeLog } from '@/services/moderation-log.service';
import { markContactRead } from '@/services/contact.service';
import { db } from '@/db';
import { adminActions } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function approveReportAction(formData: FormData) {
  const { email } = await requireAdmin();
  const reportId = formData.get('reportId') as string;
  await approveReport(reportId);
  try {
    await db.insert(adminActions).values({
      adminEmail: email,
      action: 'resolve_report',
      targetType: 'report',
      targetId: reportId,
    });
  } catch (err) {
    console.error('[approveReportAction] failed to write admin_actions row:', err);
  }
  revalidatePath('/admin/queue');
}

export async function rejectContentAction(formData: FormData) {
  const { email } = await requireAdmin();
  const reportId = formData.get('reportId') as string;
  await rejectContent(reportId);
  try {
    await db.insert(adminActions).values({
      adminEmail: email,
      action: 'dismiss_report',
      targetType: 'report',
      targetId: reportId,
    });
  } catch (err) {
    console.error('[rejectContentAction] failed to write admin_actions row:', err);
  }
  revalidatePath('/admin/queue');
}

export async function dismissReportAction(formData: FormData) {
  const { email } = await requireAdmin();
  const reportId = formData.get('reportId') as string;
  await dismissReport(reportId);
  try {
    await db.insert(adminActions).values({
      adminEmail: email,
      action: 'dismiss_report',
      targetType: 'report',
      targetId: reportId,
    });
  } catch (err) {
    console.error('[dismissReportAction] failed to write admin_actions row:', err);
  }
  revalidatePath('/admin/queue');
}

export async function acknowledgeModerationLogAction(id: string) {
  const { email } = await requireAdmin();
  await acknowledgeLog(id, email);
  revalidatePath('/admin/moderation');
  revalidatePath('/admin');
}

export async function markFeedbackReadAction(id: string) {
  const { email } = await requireAdmin();
  await markContactRead(id, email);
  revalidatePath('/admin/feedback');
  revalidatePath('/admin');
}
