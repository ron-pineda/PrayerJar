import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getPastoralStats } from '@/services/pastoral.service';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PastoralDashboardPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">You must be signed in to access the dashboard.</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">
          Sign in
        </Link>
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

  const stats = await getPastoralStats(church.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to {church.name}
        </Link>
        <h1 className="text-2xl font-bold">{church.name} — Pastoral Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Active Prayers</span>
          <span className="text-3xl font-bold">{stats.activePrayers}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Pending Flags</span>
          <span className="text-3xl font-bold">{stats.pendingFlags}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Open Assignments</span>
          <span className="text-3xl font-bold">{stats.openAssignments}</span>
        </div>
        <div className="rounded-lg border bg-card p-5 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Members</span>
          <span className="text-3xl font-bold">{stats.memberCount}</span>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold mb-1">Quick Navigation</h2>
        <Link
          href={`/church/${slug}/dashboard/flagged`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Flagged Prayers ({stats.pendingFlags})</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
        <Link
          href={`/church/${slug}/dashboard/care`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Care Inbox</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
        <Link
          href={`/church/${slug}/dashboard/team`}
          className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
        >
          <span className="font-medium">Prayer Team</span>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
      </div>
    </div>
  );
}
