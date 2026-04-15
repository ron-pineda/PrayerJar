'use server';

import { auth } from '@/lib/auth';
import { markPrayerAnswered, renewPrayer, deletePrayer, updatePrayer } from '@/services/prayer.service';
import { moderateContent } from '@/services/ai.service';
import { logModerationRejection } from '@/services/moderation-log.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const answeredSchema = z.object({
  prayerId: z.string().uuid(),
  testimony: z.string().max(2000).optional(),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  videoDurationSeconds: z.coerce.number().int().min(0).nullable().optional(),
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
    imageUrl: formData.get('imageUrl') || null,
    videoUrl: formData.get('videoUrl') || null,
    videoDurationSeconds: formData.get('videoDurationSeconds') || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await markPrayerAnswered(
    parsed.data.prayerId,
    session.user.id,
    parsed.data.testimony,
    parsed.data.imageUrl ?? undefined,
    parsed.data.videoUrl ?? undefined,
    parsed.data.videoDurationSeconds ?? undefined
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

export async function updatePrayerAction(formData: FormData): Promise<LifecycleResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'You must be signed in.' };

  const parsed = z.object({
    prayerId: z.string().uuid(),
    content: z.string().min(10).max(1000),
    isUrgent: z.boolean(),
    isAnonymous: z.boolean(),
  }).safeParse({
    prayerId: formData.get('prayerId'),
    content: formData.get('content'),
    isUrgent: formData.get('isUrgent') === 'true',
    isAnonymous: formData.get('isAnonymous') === 'true',
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const moderation = await moderateContent(parsed.data.content);
  if (moderation.selfHarm) {
    logModerationRejection({
      userId: session.user.id,
      contentType: 'prayer',
      contentSnippet: parsed.data.content,
      category: 'selfHarm',
      sourceRoute: 'actions/lifecycle.updatePrayer',
    }).catch(() => {});
    return { success: false, error: 'selfHarm' };
  }
  if (!moderation.safe) {
    logModerationRejection({
      userId: session.user.id,
      contentType: 'prayer',
      contentSnippet: parsed.data.content,
      category: 'other',
      sourceRoute: 'actions/lifecycle.updatePrayer',
    }).catch(() => {});
    return { success: false, error: 'Your message was flagged by our content filter. Please revise and try again.' };
  }

  const updated = await updatePrayer(parsed.data.prayerId, session.user.id, {
    content: parsed.data.content,
    isUrgent: parsed.data.isUrgent,
    isAnonymous: parsed.data.isAnonymous,
  });

  if (!updated) return { success: false, error: 'Prayer not found or you do not own it.' };

  revalidatePath('/my-prayers');
  return { success: true };
}

export async function deletePrayerAction(formData: FormData): Promise<LifecycleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const prayerId = formData.get('prayerId');
  if (typeof prayerId !== 'string' || !prayerId) {
    return { success: false, error: 'Invalid prayer ID.' };
  }

  const deleted = await deletePrayer(prayerId, session.user.id);
  if (!deleted) {
    return { success: false, error: 'Prayer not found or you do not own it.' };
  }

  revalidatePath('/my-prayers');
  return { success: true };
}
