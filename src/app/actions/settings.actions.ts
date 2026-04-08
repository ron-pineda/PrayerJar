'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const prefsSchema = z.object({
  emailPreference: z.enum(['off', 'realtime', 'daily', 'weekly']),
});

export async function updateEmailPreferenceAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Not signed in' };

  const parsed = prefsSchema.safeParse({ emailPreference: formData.get('emailPreference') });
  if (!parsed.success) return { success: false, error: 'Invalid preference' };

  await db
    .update(users)
    .set({ emailPreference: parsed.data.emailPreference })
    .where(eq(users.id, session.user.id));

  revalidatePath('/settings');
  return { success: true };
}
