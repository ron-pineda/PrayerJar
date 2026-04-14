'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
  addChurchMember,
} from '@/services/church-platform.service';

export type JoinChurchResult = { success: true } | { error: string };

export async function joinChurchAction(slug: string): Promise<JoinChurchResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/join?code=${encodeURIComponent(slug)}`);
  }

  const church = await getChurchBySlug(slug);
  if (!church) {
    return { error: 'Church not found. The invite link may be invalid.' };
  }

  const members = await getChurchMembers(church.id);
  const alreadyMember = members.some((m) => m.user.id === session.user!.id);
  if (alreadyMember) {
    return { error: 'You are already a member of this church.' };
  }

  await addChurchMember(church.id, session.user.id, 'member');

  redirect(`/church/${slug}/wall`);
}
