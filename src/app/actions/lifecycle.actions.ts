'use server';

import { auth } from '@/lib/auth';
import { markPrayerAnswered, renewPrayer } from '@/services/prayer.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const answeredSchema = z.object({
  prayerId: z.string().uuid(),
  testimony: z.string().max(2000).optional(),
});

const renewSchema = z.object({
  prayerId: z.string().uuid(),
});

export type LifecycleResult =
  | { success: true }
  | { success: false; error: string };

export async function markAnsweredAction(formData: FormData): Promise<LifecycleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = answeredSchema.safeParse({
    prayerId: formData.get('prayerId'),
    testimony: formData.get('testimony') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await markPrayerAnswered(
    parsed.data.prayerId,
    session.user.id,
    parsed.data.testimony
  );

  if (!updated) {
    return { success: false, error: 'Prayer not found or you do not own it.' };
  }

  revalidatePath('/my-prayers');
  revalidatePath('/praise-wall');
  return { success: true };
}

export async function renewPrayerAction(formData: FormData): Promise<LifecycleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = renewSchema.safeParse({ prayerId: formData.get('prayerId') });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await renewPrayer(parsed.data.prayerId, session.user.id);

  if (!updated) {
    return { success: false, error: 'Prayer not found or you do not own it.' };
  }

  revalidatePath('/my-prayers');
  return { success: true };
}
