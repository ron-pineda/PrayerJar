import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveSubscription, deleteSubscription } from '@/services/push.service';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { endpoint, p256dh, auth: authKey } = await req.json();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  await saveSubscription(session.user.id, { endpoint, p256dh, auth: authKey });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }
  await deleteSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
