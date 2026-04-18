import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createChurch } from '@/services/church-platform.service';

const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  welcomeMessage: z.string().max(1000).optional(),
  /** UTM fields — callers may send these in the body. */
  utmSource: z.string().max(200).optional().nullable(),
  utmMedium: z.string().max(200).optional().nullable(),
  utmCampaign: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });

  // Prefer UTMs from the request body; fall back to URL query params so that
  // redirect-based flows (e.g. OAuth callback with ?utm_source=...) are also
  // captured without the client needing to echo them in the JSON body.
  const url = new URL(req.url);
  const utmSource = parsed.data.utmSource ?? url.searchParams.get('utm_source') ?? undefined;
  const utmMedium = parsed.data.utmMedium ?? url.searchParams.get('utm_medium') ?? undefined;
  const utmCampaign = parsed.data.utmCampaign ?? url.searchParams.get('utm_campaign') ?? undefined;

  const church = await createChurch({
    ...parsed.data,
    createdBy: session.user.id,
    utmSource,
    utmMedium,
    utmCampaign,
  });
  return Response.json({ slug: church.slug }, { status: 201 });
}
