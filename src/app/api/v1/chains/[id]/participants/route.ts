import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChainParticipants } from '@/services/chain.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: chainId } = await params;

  const rows = await getChainParticipants(chainId);
  const participants = rows.map((r) => ({
    slotHour: r.participant.slotHour,
    nameInitial: r.nameInitial ?? null,
  }));

  return NextResponse.json({ participants });
}
