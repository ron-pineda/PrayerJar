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
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  country: z.string().max(10).nullable().optional(),
});

export type PrayResult =
  | { success: true; interactionId: string }
  | { success: false; error: string };

export async function prayForRequestAction(formData: FormData): Promise<PrayResult> {
  const session = await auth();
  const message = formData.get('message') as string | null;

  const rawLat = formData.get('latitude') as string | null;
  const rawLng = formData.get('longitude') as string | null;
  const rawCountry = formData.get('country') as string | null;

  const parsed = praySchema.safeParse({
    prayerId: formData.get('prayerId'),
    message: message || undefined,
    isAnonymous: formData.get('isAnonymous') === 'true',
    latitude: rawLat !== null && rawLat !== '' ? rawLat : undefined,
    longitude: rawLng !== null && rawLng !== '' ? rawLng : undefined,
    country: rawCountry !== null && rawCountry !== '' ? rawCountry : undefined,
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
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      country: parsed.data.country ?? null,
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
