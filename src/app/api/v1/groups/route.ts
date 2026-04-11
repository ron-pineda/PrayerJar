import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGroup, getGroupsForUser } from '@/services/group.service';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const group = await createGroup(
    session.user.id,
    parsed.data.name,
    parsed.data.description,
  );
  return NextResponse.json({ group }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await getGroupsForUser(session.user.id);
  return NextResponse.json({ groups });
}
