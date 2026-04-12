import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { testimonyApprovals, prayers } from '@/db/schema';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';

const schema = z.object({
  prayerId: z.string().uuid(),
  testimony: z.string().min(20).max(5000),
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

  if (!currentMember) {
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

  // Verify the prayer exists
  const [prayer] = await db
    .select({ id: prayers.id })
    .from(prayers)
    .where(eq(prayers.id, parsed.data.prayerId));

  if (!prayer) {
    return Response.json({ error: 'Prayer not found' }, { status: 404 });
  }

  await db
    .insert(testimonyApprovals)
    .values({
      churchId: church.id,
      prayerId: parsed.data.prayerId,
      submittedBy: session.user.id,
      testimony: parsed.data.testimony,
      status: 'pending',
    })
    .onConflictDoNothing();

  return Response.json({ success: true }, { status: 201 });
}
