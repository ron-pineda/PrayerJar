'use server';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type CompleteOnboardingResult =
  | { success: true }
  | { success: false; error: string };

export async function completeOnboardingAction(
  preferredCategories: string[]
): Promise<CompleteOnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await db
      .update(users)
      .set({
        onboardingCompleted: true,
        preferredCategories,
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save onboarding state' };
  }
}
