'use server';

import { auth } from '@/lib/auth';
import { approveReport, rejectContent, dismissReport } from '@/services/moderation.service';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    throw new Error('Unauthorized');
  }
  return session;
}

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
