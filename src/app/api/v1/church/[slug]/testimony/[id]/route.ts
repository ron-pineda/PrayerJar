import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { testimonyApprovals } from '@/db/schema';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';

const schema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(500).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, id } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) {
    return Response.json({ error: 'Church not found' }, { status: 404 });
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (
    !currentMember ||
    (currentMember.member.role !== 'admin' && currentMember.member.role !== 'pastor')
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

  const [testimony] = await db
    .select({ id: testimonyApprovals.id })
    .from(testimonyApprovals)
    .where(and(eq(testimonyApprovals.id, id), eq(testimonyApprovals.churchId, church.id)));

  if (!testimony) {
    return Response.json({ error: 'Testimony not found' }, { status: 404 });
  }

  await db
    .update(testimonyApprovals)
    .set({
      status: parsed.data.status,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      reviewNotes: parsed.data.reviewNotes ?? null,
    })
    .where(eq(testimonyApprovals.id, id));

  return Response.json({ success: true });
}
