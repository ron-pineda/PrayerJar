'use server';

import { auth } from '@/lib/auth';
import { createPrayer, ModerationError } from '@/services/prayer.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

const submitPrayerSchema = z.object({
  content: z.string().min(10, 'Please write at least 10 characters').max(1000),
  isAnonymous: z.boolean(),
  isUrgent: z.boolean(),
});

export type SubmitPrayerResult =
  | { success: true; prayerId: string }
  | { success: false; error: string; selfHarm?: boolean };

export async function submitPrayerAction(
  formData: FormData
): Promise<SubmitPrayerResult> {
  const session = await auth();

  const parsed = submitPrayerSchema.safeParse({
    content: formData.get('content'),
    isAnonymous: formData.get('isAnonymous') === 'true',
    isUrgent: formData.get('isUrgent') === 'true',
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? 'unknown';
  const identifier = session?.user?.id ?? ip;
  const rateCheck = await checkRateLimit('submit', identifier);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Too many requests. Please wait before submitting again.' };
  }

  try {
    const prayer = await createPrayer({
      ...parsed.data,
      authorId: session?.user?.id ?? null,
    });
    revalidatePath('/');
    return { success: true, prayerId: prayer.id };
  } catch (err) {
    if (err instanceof ModerationError) {
      if (err.selfHarm) return { success: false, error: 'selfHarm', selfHarm: true };
      return { success: false, error: 'Your request is being reviewed before it goes live.' };
    }
    console.error('[submitPrayerAction]', err);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
