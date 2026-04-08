'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const prefsSchema = z.object({
  emailPreference: z.enum(['off', 'realtime', 'daily', 'weekly']),
});

export async function updateEmailPreferenceAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
    return;
  }

  const parsed = prefsSchema.safeParse({ emailPreference: formData.get('emailPreference') });
  if (!parsed.success) return;

  await db
    .update(users)
    .set({ emailPreference: parsed.data.emailPreference })
    .where(eq(users.id, session.user.id));

  revalidatePath('/settings');
}
