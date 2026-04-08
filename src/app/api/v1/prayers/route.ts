import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPrayer, ModerationError } from '@/services/prayer.service';
import { z } from 'zod';

const createSchema = z.object({
  content: z.string().min(10).max(1000),
  isAnonymous: z.boolean(),
  isUrgent: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const prayer = await createPrayer({ ...parsed.data, authorId: session?.user?.id ?? null });
    return NextResponse.json({ prayer }, { status: 201 });
  } catch (err) {
    if (err instanceof ModerationError) {
      return NextResponse.json({ error: 'moderation', selfHarm: err.selfHarm }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
