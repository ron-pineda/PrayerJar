import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { leaveGroup, OwnerHasMembersError } from '@/services/group.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;

  try {
    await leaveGroup(session.user.id, groupId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof OwnerHasMembersError) {
      return NextResponse.json(
        { error: 'Transfer ownership to another member before leaving.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
