import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCheckInStatus, saveCheckIn } from '@/services/care.service';

const checkInSchema = z.object({
  prayerId: z.string().uuid(),
  mood: z.enum(['struggling', 'okay', 'better', 'breakthrough']),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = checkInSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { prayerId, mood } = result.data;

  // One check-in per prayer — 409 if already exists
  const existing = await getCheckInStatus(prayerId);
  if (existing) {
    return NextResponse.json(
      { error: 'A check-in already exists for this prayer' },
      { status: 409 }
    );
  }

  const checkIn = await saveCheckIn(prayerId, mood);
  return NextResponse.json(checkIn, { status: 201 });
}
