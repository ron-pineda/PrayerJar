import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { joinChain, leaveChain, SlotTakenError } from '@/services/chain.service';
import { z } from 'zod';

const joinSchema = z.object({
  slotHour: z.number().int().min(0).max(23),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: chainId } = await params;

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const participant = await joinChain(chainId, session.user.id, parsed.data.slotHour);
    return NextResponse.json({ participant }, { status: 201 });
  } catch (err) {
    if (err instanceof SlotTakenError) {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: chainId } = await params;

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const removed = await leaveChain(chainId, session.user.id, parsed.data.slotHour);
  if (!removed) {
    return NextResponse.json({ error: 'not_your_slot' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
