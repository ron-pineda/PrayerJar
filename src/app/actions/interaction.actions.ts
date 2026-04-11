'use server';

import { auth } from '@/lib/auth';
import { prayForRequest, ModerationError } from '@/services/interaction.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { refreshActivityLevel } from '@/lib/progressive-disclosure';

const praySchema = z.object({
  prayerId: z.string().uuid(),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean(),
});

export type PrayResult =
  | { success: true; interactionId: string }
  | { success: false; error: string };

export async function prayForRequestAction(formData: FormData): Promise<PrayResult> {
  const session = await auth();
  const message = formData.get('message') as string | null;

  const parsed = praySchema.safeParse({
    prayerId: formData.get('prayerId'),
    message: message || undefined,
    isAnonymous: formData.get('isAnonymous') === 'true',
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const interaction = await prayForRequest({
      prayerId: parsed.data.prayerId,
      userId: session?.user?.id ?? null,
      message: parsed.data.message,
      isAnonymous: parsed.data.isAnonymous,
    });
    revalidatePath('/pray');
    if (session?.user?.id) {
      refreshActivityLevel(session.user.id).catch(() => {});
    }
    return { success: true, interactionId: interaction.id };
  } catch (err) {
    if (err instanceof ModerationError) {
      return { success: false, error: 'Your message is being reviewed before it goes live.' };
    }
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
