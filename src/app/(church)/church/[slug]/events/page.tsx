import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getChurchEvents } from '@/services/event.service';

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  ended: 'bg-gray-100 text-gray-600',
};

function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function EventsPage({ params }: Props) {
  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/events`);
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (
    !currentMember ||
    (currentMember.member.role !== 'admin' &&
      currentMember.member.role !== 'pastor')
  ) {
    notFound();
  }

  const events = await getChurchEvents(church.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/church/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
          >
            ← Back to {church.name}
          </Link>
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        <Link
          href={`/church/${slug}/events/new`}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No events yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border bg-card p-5 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{event.name}</span>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[event.status] ?? STATUS_BADGE.draft}`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex gap-3">
                  {event.startsAt && (
                    <span>Starts: {formatDate(event.startsAt)}</span>
                  )}
                  {event.endsAt && (
                    <span>Ends: {formatDate(event.endsAt)}</span>
                  )}
                </div>
              </div>
              <Link
                href={`/church/${slug}/events/${event.id}/wall`}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Manage →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
