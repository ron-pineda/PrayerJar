import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteGroup, NotOwnerError } from '@/services/group.service';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;

  try {
    await deleteGroup(groupId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof NotOwnerError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
