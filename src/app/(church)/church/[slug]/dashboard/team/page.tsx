import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getChurchAssignments } from '@/services/pastoral.service';
import { AssignPrayerForm } from './AssignPrayerForm';
import { CopyInviteLink } from '@/components/church/copy-invite-link';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PrayerTeamPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">You must be signed in to access this page.</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">Sign in</Link>
      </div>
    );
  }

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const members = await getChurchMembers(church.id);
  const member = members.find((m) => m.user.id === session.user!.id);
  const canAccess = member?.member.role === 'admin' || member?.member.role === 'pastor';

  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Access restricted to church administrators and pastors.
        </p>
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline">
          ← Back to {church.name}
        </Link>
      </div>
    );
  }

  const assignments = await getChurchAssignments(church.id);

  const memberOptions = members.map((m) => ({ id: m.user.id, name: m.user.name }));

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    pastor: 'bg-blue-100 text-blue-700',
    member: 'bg-muted text-muted-foreground',
  };

  const statusColors: Record<string, string> = {
    assigned: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    praying: 'bg-green-100 text-green-700',
    completed: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Prayer Team</h1>
      </div>

      {/* Invite Members */}
      <section className="mb-10 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">Invite Members</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Share this link with your congregation to let them join your private
          prayer wall. Anyone with the link can join as a member.
        </p>
        <CopyInviteLink
          inviteUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org'}/church/join?code=${slug}`}
        />
      </section>

      {/* Assign form */}
      <div className="mb-10">
        <AssignPrayerForm churchSlug={slug} members={memberOptions} />
      </div>

      {/* Members section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Church Members</h2>
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.user.id} className="rounded-lg border bg-card p-4 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{m.user.name ?? 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">{m.user.email ?? ''}</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColors[m.member.role] ?? roleColors.member}`}>
                {m.member.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Assignments section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Prayer Assignments</h2>
        {assignments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No prayers assigned yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {assignments.map((a) => (
              <li key={a.id} className="rounded-lg border bg-card p-5 flex flex-col gap-2">
                <p className="text-sm leading-relaxed">
                  {a.prayer.content.length > 120
                    ? a.prayer.content.slice(0, 120) + '…'
                    : a.prayer.content}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Assigned to: <span className="text-foreground font-medium">{a.assignedTo.name ?? 'Unknown'}</span></span>
                  <span aria-hidden="true">·</span>
                  <span>By: {a.assignedBy.name ?? 'Unknown'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium capitalize ${statusColors[a.status] ?? statusColors.assigned}`}
                  >
                    {a.status}
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
