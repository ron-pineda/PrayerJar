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

  // ── Subdomain-specific validation (only when the value actually changes) ──
  //
  // Gate fires only when `subdomain` is being set to a NEW non-null value.
  // Keeping an unchanged subdomain (e.g. a downgraded church saving only
  // primaryColor while their historic subdomain rides along in the body)
  // must NOT be blocked — that would prevent any branding save after downgrade.
  if (parsed.data.subdomain != null && parsed.data.subdomain !== church.subdomain) {
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

    // Sprint 27 (pj-s27-02): this gate stays enforcing, deliberately, and it is
    // the only one that does. `*.prayerjar.org` is a scarce global namespace and
    // a claimed subdomain cannot be reclaimed once someone has published it —
    // giving it away in the sprint whose whole point is to defer pricing
    // decisions is the one move you could not undo later. It costs free churches
    // nothing today: subdomain routing is behind the SUBDOMAIN_ROUTING env flag
    // (proxy.ts), which is unset, so a claimed subdomain resolves nowhere.
    //
    // Existing subdomains are never cleared; the gate only prevents setting one.
    // Only the message changed — it used to name a plan that no longer exists.
    if (!hasCustomSubdomain(church.currentPlan)) {
      return Response.json(
        { error: 'Custom subdomains are not available yet.' },
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
