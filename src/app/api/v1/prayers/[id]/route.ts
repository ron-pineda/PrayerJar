import { NextRequest, NextResponse } from 'next/server';
import { getPrayerById, markPrayerAnswered, renewPrayer } from '@/services/prayer.service';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prayer = await getPrayerById(id);
  if (!prayer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ prayer });
}

const patchSchema = z.object({
  action: z.enum(['answer', 'renew']),
  testimony: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  if (parsed.data.action === 'answer') {
    const prayer = await markPrayerAnswered(id, session.user.id, parsed.data.testimony);
    if (!prayer) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    return NextResponse.json({ prayer });
  }

  if (parsed.data.action === 'renew') {
    const prayer = await renewPrayer(id, session.user.id);
    if (!prayer) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    return NextResponse.json({ prayer });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
