import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
  getChurchPrayers,
} from '@/services/church-platform.service';
import { formatRelative } from './formatRelative';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ChurchWallPage({ params }: Props) {
  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  const members = await getChurchMembers(church.id);
  const currentMember = session?.user?.id
    ? members.find((m) => m.user.id === session.user!.id)
    : undefined;

  if (!currentMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          You must be a member of this church to view this wall.
        </p>
        <Link
          href={`/church/${slug}`}
          className="text-sm text-primary hover:underline"
        >
          ← Back to {church.name}
        </Link>
      </div>
    );
  }

  const prayers = await getChurchPrayers(church.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/church/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
          >
            ← Back to {church.name}
          </Link>
          <h1 className="text-2xl font-bold">{church.name} — Prayer Wall</h1>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          {prayers.length} prayer{prayers.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Prayer list */}
      {prayers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No prayers have been shared yet. Be the first!
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {prayers.map((prayer) => (
            <li
              key={prayer.id}
              className="rounded-lg border bg-card p-5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed flex-1">
                  {prayer.content}
                </p>
                <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                  {prayer.category}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{prayer.isAnonymous ? 'Anonymous' : 'Member'}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRelative(new Date(prayer.createdAt))}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
