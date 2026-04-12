import { getEvent } from '@/services/event.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  const event = await getEvent(eventId);
  if (!event) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({
    event: {
      id: event.id,
      name: event.name,
      status: event.status,
      displayMode: event.displayMode,
      churchId: event.churchId,
    },
  });
}
