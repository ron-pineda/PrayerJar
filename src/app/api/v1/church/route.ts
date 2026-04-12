import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createChurch } from '@/services/church-platform.service';

const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  welcomeMessage: z.string().max(1000).optional(),
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

  const church = await createChurch({ ...parsed.data, createdBy: session.user.id });
  return Response.json({ slug: church.slug }, { status: 201 });
}
