import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markNotificationRead } from '@/services/notification.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await markNotificationRead(id, session.user.id);
  return NextResponse.json({ success: true });
}
