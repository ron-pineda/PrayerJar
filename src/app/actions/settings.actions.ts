'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const displayNameSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export async function updateDisplayNameAction(_prev: unknown, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const parsed = displayNameSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { success: false, error: 'Name must be between 1 and 50 characters.' };

  await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, session.user.id));

  revalidatePath('/settings');
  revalidatePath('/profile');
  return { success: true };
}

const prefsSchema = z.object({
  emailPreference: z.enum(['off', 'realtime', 'daily', 'weekly']),
});

export async function updateEmailPreferenceAction(_prev: unknown, formData: FormData): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const parsed = prefsSchema.safeParse({ emailPreference: formData.get('emailPreference') });
  if (!parsed.success) return { success: false };

  await db
    .update(users)
    .set({ emailPreference: parsed.data.emailPreference })
    .where(eq(users.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}

const notifTypesSchema = z.object({
  notifyOnPrayed: z.boolean(),
  notifyOnMessage: z.boolean(),
  notifyOnBadge: z.boolean(),
  notifyOnDigest: z.boolean(),
});

export async function updateNotificationTypesAction(_prev: unknown, formData: FormData): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const parsed = notifTypesSchema.safeParse({
    notifyOnPrayed: formData.get('notifyOnPrayed') === 'on',
    notifyOnMessage: formData.get('notifyOnMessage') === 'on',
    notifyOnBadge: formData.get('notifyOnBadge') === 'on',
    notifyOnDigest: formData.get('notifyOnDigest') === 'on',
  });
  if (!parsed.success) return { success: false };

  await db
    .update(users)
    .set(parsed.data)
    .where(eq(users.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}

const quietHoursSchema = z.object({
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.number().int().min(0).max(23).nullable(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable(),
  quietHoursTimezone: z.string().nullable(),
});

export async function updateQuietHoursAction(_prev: unknown, formData: FormData): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const enabled = formData.get('quietHoursEnabled') === 'on';
  const parsed = quietHoursSchema.safeParse({
    quietHoursEnabled: enabled,
    quietHoursStart: enabled ? parseInt(formData.get('quietHoursStart') as string, 10) : null,
    quietHoursEnd: enabled ? parseInt(formData.get('quietHoursEnd') as string, 10) : null,
    quietHoursTimezone: enabled ? (formData.get('quietHoursTimezone') as string) || null : null,
  });
  if (!parsed.success) return { success: false };

  await db
    .update(users)
    .set({
      quietHoursStart: parsed.data.quietHoursStart,
      quietHoursEnd: parsed.data.quietHoursEnd,
      quietHoursTimezone: parsed.data.quietHoursTimezone,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}
