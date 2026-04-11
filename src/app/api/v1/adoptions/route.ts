import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adoptPrayer, unadoptPrayer } from '@/services/adoption.service';
import { z } from 'zod';

const adoptSchema = z.object({
  prayerId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = adoptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await adoptPrayer(session.user.id, parsed.data.prayerId);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prayerId = req.nextUrl.searchParams.get('prayerId');
  if (!prayerId) {
    return NextResponse.json({ error: 'prayerId is required' }, { status: 400 });
  }

  await unadoptPrayer(session.user.id, prayerId);
  return NextResponse.json({ ok: true }, { status: 200 });
}
