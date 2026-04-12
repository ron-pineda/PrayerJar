import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { assignPrayer } from '@/services/pastoral.service';

const schema = z.object({
  prayerId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export async function POST(
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

  const isMember = members.some(m => m.user.id === parsed.data.assignedTo);
  if (!isMember) {
    return Response.json({ error: 'User is not a member of this church' }, { status: 400 });
  }

  await assignPrayer({
    churchId: church.id,
    prayerId: parsed.data.prayerId,
    assignedTo: parsed.data.assignedTo,
    assignedBy: session.user.id,
    notes: parsed.data.notes,
  });

  return Response.json({ success: true });
}
