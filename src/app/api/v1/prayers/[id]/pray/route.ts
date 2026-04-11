import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prayForRequest, ModerationError } from '@/services/interaction.service';
import { z } from 'zod';

const schema = z.object({
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  country: z.string().max(10).nullable().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  try {
    const interaction = await prayForRequest({
      prayerId: id,
      userId: session?.user?.id ?? null,
      message: parsed.data.message,
      isAnonymous: parsed.data.isAnonymous,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      country: parsed.data.country ?? null,
    });
    return NextResponse.json({ interaction }, { status: 201 });
  } catch (err) {
    if (err instanceof ModerationError) {
      return NextResponse.json({ error: 'moderation' }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
