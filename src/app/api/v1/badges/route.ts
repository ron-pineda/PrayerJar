import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBadgesForUser } from '@/services/badge.service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const badges = await getBadgesForUser(session.user.id);
  return NextResponse.json({ badges });
}
