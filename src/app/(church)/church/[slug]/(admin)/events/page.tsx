import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers, getChurchTier } from '@/services/church-platform.service';
import { getChurchEvents } from '@/services/event.service';
import { PLANS } from '@/lib/plans';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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

  const [events, tier] = await Promise.all([
    getChurchEvents(church.id),
    getChurchTier(church.id),
  ]);
  const canCreateEvents = PLANS[tier].limits.events !== 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/church/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to {church.name}
          </Link>
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
        {canCreateEvents ? (
          <Link
            href={`/church/${slug}/events/new`}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Create Event
          </Link>
        ) : (
          <a
            href="/billing"
            className="inline-flex items-center rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
          >
            Events are included on the Starter plan and above
          </a>
        )}
      </div>
      {!canCreateEvents && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <span className="font-medium">Live events require a Starter plan or higher.</span>{' '}
          <a href="/billing" className="underline hover:no-underline">Upgrade your plan</a> to create and run live prayer events.
        </div>
      )}

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
                className="shrink-0 text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Manage
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
