import { z } from 'zod';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import { getEvent, submitEventPrayer } from '@/services/event.service';

const categoryValues = PRAYER_CATEGORIES.map((c) => c.value) as [string, ...string[]];

const schema = z.object({
  content: z.string().min(5).max(500),
  submitterName: z.string().max(50).optional(),
  isAnonymous: z.boolean(),
  category: z.enum(categoryValues as [typeof categoryValues[0], ...typeof categoryValues]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  const event = await getEvent(eventId);
  if (!event) {
    return Response.json({ error: 'Event not found' }, { status: 404 });
  }
  if (event.status !== 'active') {
    return Response.json({ error: 'Event is not accepting prayers' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { content, submitterName, isAnonymous, category } = parsed.data;

  await submitEventPrayer({
    eventId,
    churchId: event.churchId,
    content,
    submitterName,
    isAnonymous,
    category,
  });

  return Response.json({ success: true }, { status: 201 });
}
