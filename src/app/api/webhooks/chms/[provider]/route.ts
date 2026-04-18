import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { db } from '@/db';
import { churches, chmsSyncJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/encrypt';
import { CHMS_ADAPTERS } from '@/lib/chms/providers';
import type { ChmsProviderSlug } from '@/lib/chms/ChmsAdapter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  // 1. Validate provider slug
  const factory = CHMS_ADAPTERS[provider as ChmsProviderSlug];
  if (!factory) {
    return new Response('Unknown provider', { status: 404 });
  }

  // 2. Read raw body BEFORE any parsing (critical for HMAC)
  const rawBody = await request.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // 3. Extract PCO org ID from payload to look up the church
  const pcoOrgId = (payload as { meta?: { parent?: { id?: string } } })?.meta?.parent?.id;
  if (!pcoOrgId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 4. Find the church whose chmsConfig has this pcoOrgId
  const churchRows = await db.select().from(churches)
    .where(eq(churches.chmsProvider, provider));

  let matchedChurchId: string | null = null;
  let matchedConfig: Record<string, unknown> | null = null;

  for (const church of churchRows) {
    if (!church.chmsConfig) continue;
    try {
      const config = JSON.parse(decrypt(church.chmsConfig)) as { pcoOrgId?: string };
      if (config.pcoOrgId === pcoOrgId) {
        matchedChurchId = church.id;
        matchedConfig = config as Record<string, unknown>;
        break;
      }
    } catch {
      // Corrupted config — skip this church
    }
  }

  if (!matchedChurchId || !matchedConfig) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 5. Build adapter + connect with church config
  const adapter = await factory();
  await adapter.connect(matchedConfig as unknown as Parameters<typeof adapter.connect>[0]);

  // Pass raw body via a synthetic header so handleWebhook can verify the HMAC
  const webhookHeaders: Record<string, string> = {
    'x-raw-body': rawBody,
    'x-pco-webhooks-authenticity': request.headers.get('x-pco-webhooks-authenticity') ?? '',
  };

  const result = await adapter.handleWebhook(payload, webhookHeaders);

  if (result === null) {
    Sentry.captureException(new Error('ChMS webhook signature verification failed'), {
      extra: { provider, churchId: matchedChurchId },
    });
    return new Response('Unauthorized', { status: 401 });
  }

  if (result.action === 'ignore') {
    return Response.json({ ignored: true });
  }

  // 6. Insert pending sync job — return 202 immediately after insert, not after processing
  await db.insert(chmsSyncJobs).values({
    churchId: matchedChurchId,
    provider,
    jobType: 'delta_sync',
    status: 'pending',
    payload: result as unknown as Record<string, unknown>,
  });

  return new Response(null, { status: 202 });
}
