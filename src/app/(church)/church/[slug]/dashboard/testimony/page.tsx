import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { testimonyApprovals, prayers, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { TestimonyActions } from './TestimonyActions';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

type TabValue = 'pending' | 'approved' | 'rejected';

export default async function TestimonyQueuePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const activeTab: TabValue = (tab === 'approved' || tab === 'rejected') ? tab : 'pending';

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

  const rows = await db
    .select({
      id: testimonyApprovals.id,
      testimony: testimonyApprovals.testimony,
      status: testimonyApprovals.status,
      reviewNotes: testimonyApprovals.reviewNotes,
      createdAt: testimonyApprovals.createdAt,
      submitterName: users.name,
      prayerContent: prayers.content,
    })
    .from(testimonyApprovals)
    .leftJoin(users, eq(users.id, testimonyApprovals.submittedBy))
    .leftJoin(prayers, eq(prayers.id, testimonyApprovals.prayerId))
    .where(eq(testimonyApprovals.churchId, church.id))
    .orderBy(desc(testimonyApprovals.createdAt));

  const filtered = rows.filter((r) => r.status === activeTab);

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Testimony Queue</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((t) => {
          const count = rows.filter((r) => r.status === t.value).length;
          return (
            <Link
              key={t.value}
              href={`/church/${slug}/dashboard/testimony?tab=${t.value}`}
              className={[
                'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
                activeTab === t.value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No testimonies awaiting review.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((item) => (
            <li key={item.id} className="rounded-lg border bg-card p-5 flex flex-col gap-3">
              {/* Testimony text */}
              <p className="text-sm leading-relaxed">
                {item.testimony.length > 300
                  ? item.testimony.slice(0, 300) + '…'
                  : item.testimony}
              </p>

              {/* Related prayer */}
              {item.prayerContent && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium">Related prayer: </span>
                  {item.prayerContent.length > 120
                    ? item.prayerContent.slice(0, 120) + '…'
                    : item.prayerContent}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.submitterName ?? 'Unknown'}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Review notes (for rejected) */}
              {item.reviewNotes && (
                <p className="text-xs text-destructive/80 italic">
                  Rejection reason: {item.reviewNotes}
                </p>
              )}

              {/* Actions — only show for pending */}
              {activeTab === 'pending' && (
                <TestimonyActions testimonyId={item.id} churchSlug={slug} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
