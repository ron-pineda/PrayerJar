import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
  updateWelcomeMessage,
} from '@/services/church-platform.service';

const schema = z.object({
  // min not set — empty string clears the welcome message (intentional)
  message: z.string().max(1000),
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

  // Verify user is admin or pastor
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

  await updateWelcomeMessage(church.id, parsed.data.message);

  return Response.json({ success: true });
}
