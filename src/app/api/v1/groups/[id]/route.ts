import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteGroup, renameGroup, NotOwnerError } from '@/services/group.service';
import { moderateContent } from '@/services/ai.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;

  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'Name is required and must be under 80 characters.' }, { status: 400 });
  }

  const nameModeration = await moderateContent(name);
  if (!nameModeration.safe) {
    return NextResponse.json({ error: 'content_flagged' }, { status: 422 });
  }

  if (description !== undefined) {
    const descModeration = await moderateContent(description);
    if (!descModeration.safe) {
      return NextResponse.json({ error: 'content_flagged' }, { status: 422 });
    }
  }

  try {
    const group = await renameGroup(groupId, session.user.id, name, description);
    return NextResponse.json({ group });
  } catch (err) {
    if (err instanceof NotOwnerError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
