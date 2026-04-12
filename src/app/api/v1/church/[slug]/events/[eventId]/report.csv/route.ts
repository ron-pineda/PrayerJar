import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getEvent, getEventPrayers } from '@/services/event.service';

function escapeCSV(value: string | null | undefined): string {
  const str = value ?? '';
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; eventId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, eventId } = await params;

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

  const event = await getEvent(eventId);
  if (!event || event.churchId !== church.id) {
    return Response.json({ error: 'Event not found' }, { status: 404 });
  }

  const [approvedPrayers, spotlightedPrayers] = await Promise.all([
    getEventPrayers(eventId, { status: 'approved', limit: 1000 }),
    getEventPrayers(eventId, { status: 'spotlighted', limit: 1000 }),
  ]);

  const allPrayers = [...approvedPrayers, ...spotlightedPrayers];

  const header = 'id,content,submitterName,isAnonymous,category,status,createdAt\n';
  const rows = allPrayers.map((p) =>
    [
      escapeCSV(p.id),
      escapeCSV(p.content),
      escapeCSV(p.submitterName),
      String(p.isAnonymous),
      escapeCSV(p.category),
      escapeCSV(p.status),
      new Date(p.createdAt).toISOString(),
    ].join(','),
  );

  const csv = header + rows.join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="event-report-${eventId}.csv"`,
    },
  });
}
