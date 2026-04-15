import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isGroupMember, getGroupPrayers, postGroupPrayer } from '@/services/group.service';
import { ModerationError } from '@/services/prayer.service';
import { z } from 'zod';
import { categoryEnum } from '@/db/schema';

const postPrayerSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.enum(categoryEnum.enumValues),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;

  const member = await isGroupMember(session.user.id, groupId);
  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const prayers = await getGroupPrayers(groupId);
  return NextResponse.json({ prayers });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await params;

  const member = await isGroupMember(session.user.id, groupId);
  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postPrayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const prayer = await postGroupPrayer(
      session.user.id,
      groupId,
      parsed.data.content,
      parsed.data.category,
    );
    return NextResponse.json({ prayer }, { status: 201 });
  } catch (err) {
    if (err instanceof ModerationError) {
      return NextResponse.json({ error: 'content_flagged' }, { status: 422 });
    }
    throw err;
  }
}
