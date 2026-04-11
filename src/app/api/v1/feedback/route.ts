import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { feedback } from '@/db/schema';
import { auth } from '@/lib/auth';

const schema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'praise']).default('general'),
  message: z.string().min(1).max(1000),
  page: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const row = await db.insert(feedback).values({
    userId,
    type: result.data.type,
    message: result.data.message,
    page: result.data.page ?? null,
  }).returning();

  return NextResponse.json(row[0], { status: 201 });
}
