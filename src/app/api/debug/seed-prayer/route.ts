import { NextResponse } from 'next/server';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse('not found', { status: 404 });
  }
  const header = req.headers.get('authorization');
  if (header !== `Bearer ${process.env.SENTRY_DEBUG_TOKEN}`) {
    return new NextResponse('not found', { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('must be signed in', { status: 401 });
  }
  const body = (await req.json()) as { text?: string };

  // Schema verified from src/db/schema.ts:
  // - prayers.content (NOT .text)
  // - prayers.expiresAt is required (NOT NULL)
  // - NO shareId column — public URL uses prayers.id directly (/p/[id])
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const [row] = await db
    .insert(prayers)
    .values({
      authorId: session.user.id,
      content: body.text ?? 'e2e seeded prayer',
      category: 'other',
      expiresAt,
    })
    .returning();

  // The /p/[id] route uses prayers.id directly as the share identifier
  return NextResponse.json({ prayerId: row.id, shareId: row.id });
}
