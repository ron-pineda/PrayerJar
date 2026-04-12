import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getEvent, getEventStats, getEventPrayers } from '@/services/event.service';

interface Props {
  params: Promise<{ slug: string; eventId: string }>;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startsAt: Date | null | undefined, endsAt: Date | null | undefined): string {
  if (!startsAt || !endsAt) return '—';
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (ms <= 0) return '—';
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  healing: 'Healing',
  guidance: 'Guidance',
  praise: 'Praise',
  family: 'Family',
  financial: 'Financial',
  relationships: 'Relationships',
  salvation: 'Salvation',
  other: 'Other',
};

export default async function EventReportPage({ params }: Props) {
  const { slug, eventId } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/events/${eventId}/report`);
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (
    !currentMember ||
    (currentMember.member.role !== 'admin' && currentMember.member.role !== 'pastor')
  ) {
    notFound();
  }

  const event = await getEvent(eventId);
  if (!event || event.churchId !== church.id) notFound();

  const [stats, approvedPrayers, spotlightedPrayers] = await Promise.all([
    getEventStats(eventId),
    getEventPrayers(eventId, { status: 'approved', limit: 200 }),
    getEventPrayers(eventId, { status: 'spotlighted', limit: 10 }),
  ]);

  const approvalRate =
    stats.total > 0
      ? Math.round(((stats.approved + stats.spotlighted) / stats.total) * 100)
      : 0;

  const duration = formatDuration(event.startsAt, event.endsAt);

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name} — Post-Event Report</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Starts: {formatDate(event.startsAt)}</span>
              <span>Ends: {formatDate(event.endsAt)}</span>
              <span>Duration: {duration}</span>
            </div>
          </div>
          <a
            href={`/api/v1/church/${slug}/events/${eventId}/report.csv`}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Download CSV
          </a>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        <StatCard label="Total Submitted" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Spotlighted" value={stats.spotlighted} />
        <StatCard label="Hidden / Rejected" value={stats.hidden} />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} />
      </div>

      {/* Spotlighted Prayers */}
      {spotlightedPrayers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Spotlighted Prayers</h2>
          <ul className="flex flex-col gap-3">
            {spotlightedPrayers.map((prayer) => (
              <li
                key={prayer.id}
                className="rounded-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4"
              >
                <p className="text-sm leading-relaxed mb-2">{prayer.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {prayer.isAnonymous ? 'Anonymous' : (prayer.submitterName ?? 'Unknown')}
                  </span>
                  {prayer.category && (
                    <span className="capitalize">· {CATEGORY_LABEL[prayer.category] ?? prayer.category}</span>
                  )}
                  <span className="ml-auto">
                    {new Date(prayer.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All Approved Prayers */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          All Approved Prayers ({approvedPrayers.length})
        </h2>

        {approvedPrayers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground text-sm">
            No approved prayers for this event.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {approvedPrayers.map((prayer) => (
              <li key={prayer.id} className="rounded-lg border bg-card p-4">
                <p className="text-sm leading-relaxed mb-2">{prayer.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {prayer.isAnonymous ? 'Anonymous' : (prayer.submitterName ?? 'Unknown')}
                  </span>
                  {prayer.category && (
                    <span className="capitalize">· {CATEGORY_LABEL[prayer.category] ?? prayer.category}</span>
                  )}
                  <span className="ml-auto">
                    {new Date(prayer.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
