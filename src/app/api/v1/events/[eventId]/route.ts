import { getEvent } from '@/services/event.service';
import { getChurchById } from '@/services/church-platform.service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  const event = await getEvent(eventId);
  if (!event) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const church = await getChurchById(event.churchId);

  return Response.json({
    event: {
      id: event.id,
      name: event.name,
      status: event.status,
      displayMode: event.displayMode,
      churchId: event.churchId,
      churchName: church?.name ?? null,
      churchSlug: church?.slug ?? null,
    },
  });
}
