'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { approveReport, rejectContent, dismissReport } from '@/services/moderation.service';
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
