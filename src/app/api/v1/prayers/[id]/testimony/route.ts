import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { prayers, users } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const putSchema = z.object({
  story: z.string().min(1).max(5000),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Verify prayer exists, belongs to current user, and is answered
  const [prayer] = await db
    .select({ id: prayers.id, authorId: prayers.authorId, answeredAt: prayers.answeredAt })
    .from(prayers)
    .where(
      and(
        eq(prayers.id, id),
        eq(prayers.authorId, session.user.id),
        isNotNull(prayers.answeredAt)
      )
    )
    .limit(1);

  if (!prayer) {
    return NextResponse.json(
      { error: 'Prayer not found, not yours, or not answered' },
      { status: 404 }
    );
  }

  await db
    .update(prayers)
    .set({ testimonyStory: parsed.data.story })
    .where(eq(prayers.id, id));

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [row] = await db
    .select({
      id: prayers.id,
      content: prayers.content,
      testimonyStory: prayers.testimonyStory,
      answeredAt: prayers.answeredAt,
      category: prayers.category,
      authorId: prayers.authorId,
    })
    .from(prayers)
    .where(and(eq(prayers.id, id), isNotNull(prayers.answeredAt)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let author: { name: string | null; createdAt: Date } | null = null;
  if (row.authorId) {
    const [user] = await db
      .select({ name: users.name, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, row.authorId))
      .limit(1);

    if (user) {
      // Return first name only
      const firstName = user.name ? user.name.split(' ')[0] : null;
      author = { name: firstName, createdAt: user.createdAt };
    }
  }

  return NextResponse.json({
    prayer: {
      id: row.id,
      content: row.content,
      testimonyStory: row.testimonyStory,
      answeredAt: row.answeredAt,
      category: row.category,
    },
    author,
  });
}
