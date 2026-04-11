import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createChain } from '@/services/chain.service';
import { z } from 'zod';

const createChainSchema = z.object({
  prayerId: z.string().uuid(),
  startsAt: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createChainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const chain = await createChain(
    parsed.data.prayerId,
    session.user.id,
    new Date(parsed.data.startsAt),
  );
  return NextResponse.json({ chain }, { status: 201 });
}
