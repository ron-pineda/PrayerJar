import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
} from '@/services/church-platform.service';
import { db } from '@/db';
import { churches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isReservedSubdomain, hasInvalidHyphen } from '@/lib/subdomain-reserved';
import { hasCustomSubdomain } from '@/lib/plans';

const schema = z.object({
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  // Subdomain: lowercase letters, numbers, hyphens, 1–32 chars.
  // Leading/trailing hyphens are rejected separately (see route body).
  subdomain: z.string().regex(/^[a-z0-9-]{1,32}$/).optional().nullable(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) {
    return Response.json({ error: 'Church not found' }, { status: 404 });
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (
    !currentMember ||
    (currentMember.member.role !== 'admin' &&
      currentMember.member.role !== 'pastor')
  ) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  // ── Subdomain-specific validation (only when a new value is being set) ──
  if (parsed.data.subdomain != null) {
    const sub = parsed.data.subdomain;

    // RFC-1035: no leading or trailing hyphen.
    if (hasInvalidHyphen(sub)) {
      return Response.json(
        { error: 'Subdomain cannot start or end with a hyphen.' },
        { status: 400 },
      );
    }

    // Reserved-word check — same set used by proxy.ts (defense-in-depth).
    if (isReservedSubdomain(sub)) {
      return Response.json(
        { error: 'This subdomain is reserved. Please choose another.' },
        { status: 400 },
      );
    }

    // Tier gate — Growing Church (pro) and above only.
    // Tier-downgrade behaviour: existing subdomains are NOT cleared on downgrade
    // (avoids breaking shared URLs through a billing lapse). The gate only
    // prevents re-setting a subdomain once the field has been cleared.
    if (!hasCustomSubdomain(church.currentPlan)) {
      return Response.json(
        {
          error:
            'Custom subdomain requires Growing Church plan or above. Upgrade your plan to claim a subdomain.',
        },
        { status: 403 },
      );
    }
  }

  const updates: Partial<{
    logoUrl: string | null;
    primaryColor: string;
    subdomain: string | null;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if ('logoUrl' in parsed.data) updates.logoUrl = parsed.data.logoUrl ?? null;
  if (parsed.data.primaryColor !== undefined) updates.primaryColor = parsed.data.primaryColor;
  if ('subdomain' in parsed.data) updates.subdomain = parsed.data.subdomain ?? null;

  await db
    .update(churches)
    .set(updates)
    .where(eq(churches.id, church.id));

  return Response.json({ success: true });
}
