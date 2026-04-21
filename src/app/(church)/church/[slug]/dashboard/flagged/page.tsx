import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getFlaggedPrayers } from '@/services/pastoral.service';
import { FlagActions } from './FlagActions';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FlaggedPrayersPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/dashboard/flagged`);
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

  const flags = await getFlaggedPrayers(church.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Flagged Prayers</h1>
          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            {flags.length} pending
          </span>
        </div>
      </div>

      {flags.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No flagged prayers. All clear!
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {flags.map((flag) => (
            <li key={flag.flagId} className="rounded-lg border bg-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed flex-1">
                  {flag.prayer.content.length > 200
                    ? flag.prayer.content.slice(0, 200) + '…'
                    : flag.prayer.content}
                </p>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 capitalize">
                    {flag.reason.replace('_', ' ')}
                  </span>
                  {flag.aiConfidence !== null && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round((flag.aiConfidence ?? 0) * 100)}% confidence
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {flag.prayer.isAnonymous ? 'Anonymous' : (flag.author?.name ?? 'Unknown')}
                </span>
                <span aria-hidden="true">·</span>
                <span>{new Date(flag.createdAt).toLocaleDateString()}</span>
              </div>

              <FlagActions flagId={flag.flagId} churchSlug={slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
