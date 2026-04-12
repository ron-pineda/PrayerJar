import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import {
  getEvent,
  getEventPrayers,
  getEventStats,
} from '@/services/event.service';

interface Props {
  params: Promise<{ slug: string; eventId: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  ended: 'bg-gray-100 text-gray-600',
};

const PRAYER_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  spotlighted: 'bg-purple-100 text-purple-800',
  hidden: 'bg-gray-100 text-gray-500',
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default async function EventWallPage({ params }: Props) {
  const { slug, eventId } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/events/${eventId}/wall`);
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

  const event = await getEvent(eventId);
  if (!event || event.churchId !== church.id) notFound();

  const [prayers, stats] = await Promise.all([
    getEventPrayers(eventId, { status: 'approved', limit: 100 }),
    getEventStats(eventId),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/church/${slug}/events`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to Events
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[event.status] ?? STATUS_BADGE.draft}`}
          >
            {event.status}
          </span>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Spotlighted" value={stats.spotlighted} />
        <StatCard label="Hidden" value={stats.hidden} />
      </div>

      {/* Status controls */}
      <div className="rounded-lg border bg-card p-4 mb-8">
        <h2 className="text-sm font-semibold mb-3">Event Controls</h2>
        <div className="flex flex-wrap gap-2">
          {(['draft', 'active', 'paused', 'ended'] as const).map((s) => (
            <form
              key={s}
              action={`/api/v1/church/${slug}/events/${eventId}/status`}
              method="post"
            >
              <input type="hidden" name="_method" value="PATCH" />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                disabled={event.status === s}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors
                  ${event.status === s
                    ? 'bg-primary text-primary-foreground cursor-default'
                    : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                {s}
              </button>
            </form>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use the API or moderation console (Sprint 5.4 Task 3) for real-time control.
        </p>
      </div>

      {/* Prayer wall */}
      <div>
        <h2 className="text-sm font-semibold mb-3">
          Approved Prayers ({prayers.length})
        </h2>

        {prayers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground text-sm">
            No approved prayers yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {prayers.map((prayer) => (
              <li
                key={prayer.id}
                className="rounded-lg border bg-card p-4 flex items-start justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm leading-relaxed">{prayer.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {prayer.isAnonymous
                        ? 'Anonymous'
                        : (prayer.submitterName ?? 'Unknown')}
                    </span>
                    {prayer.category && (
                      <span className="text-xs text-muted-foreground capitalize">
                        · {prayer.category}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRAYER_STATUS_BADGE[prayer.status] ?? ''}`}
                >
                  {prayer.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
