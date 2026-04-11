import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { joinGroup, GroupNotFoundError, AlreadyMemberError } from '@/services/group.service';
import { z } from 'zod';

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = joinGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const member = await joinGroup(session.user.id, parsed.data.inviteCode);
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (err instanceof AlreadyMemberError) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
