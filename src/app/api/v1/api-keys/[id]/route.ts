import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revokeApiKey } from '@/services/api-key.service';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const key = await revokeApiKey(id, session.user.id);

  if (!key) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
