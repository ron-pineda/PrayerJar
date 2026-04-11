import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { griefDates } from '@/db/schema';

const griefDateSchema = z.object({
  prayerId: z.string().uuid(),
  label: z.string().min(1).max(255),
  anniversaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = griefDateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { prayerId, label, anniversaryDate } = result.data;

  const [record] = await db
    .insert(griefDates)
    .values({
      userId: session.user.id,
      prayerId,
      label,
      anniversaryDate,
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
}
