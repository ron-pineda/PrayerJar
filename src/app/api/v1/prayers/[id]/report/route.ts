import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reportContent } from '@/services/moderation.service';
import { z } from 'zod';

const schema = z.object({ reason: z.string().min(1).max(200) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  await reportContent({
    reporterId: session?.user?.id ?? null,
    prayerId: id,
    reason: parsed.data.reason,
  });

  return NextResponse.json({ success: true });
}
