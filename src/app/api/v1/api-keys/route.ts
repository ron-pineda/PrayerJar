import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiKey, listApiKeys } from '@/services/api-key.service';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await listApiKeys(session.user.id);

  // Never return keyHash
  const masked = keys.map(({ keyHash: _kh, ...rest }) => rest);
  return NextResponse.json({ keys: masked });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { key, rawKey } = await createApiKey(session.user.id, parsed.data.name);

  // Never return keyHash
  const { keyHash: _kh, ...safeKey } = key;
  return NextResponse.json({ key: safeKey, rawKey }, { status: 201 });
}
