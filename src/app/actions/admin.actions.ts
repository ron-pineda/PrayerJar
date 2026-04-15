'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { approveReport, rejectContent, dismissReport } from '@/services/moderation.service';
import { acknowledgeLog } from '@/services/moderation-log.service';
import { markContactRead } from '@/services/contact.service';
import { revalidatePath } from 'next/cache';

export async function approveReportAction(formData: FormData) {
  await requireAdmin();
  await approveReport(formData.get('reportId') as string);
  revalidatePath('/admin/queue');
}

export async function rejectContentAction(formData: FormData) {
  await requireAdmin();
  await rejectContent(formData.get('reportId') as string);
  revalidatePath('/admin/queue');
}

export async function dismissReportAction(formData: FormData) {
  await requireAdmin();
  await dismissReport(formData.get('reportId') as string);
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
