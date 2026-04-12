import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
  getChurchGroups,
} from '@/services/church-platform.service';

interface Props {
  params: Promise<{ slug: string }>;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export default async function ChurchGroupsPage({ params }: Props) {
  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          You must be a member of this church to view this page.
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

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (!currentMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          You must be a member of this church to view this page.
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

  const isAdmin =
    currentMember.member.role === 'admin' ||
    currentMember.member.role === 'pastor';

  const groups = await getChurchGroups(church.id);

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
          <h1 className="text-2xl font-bold">{church.name} — Small Groups</h1>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          {groups.length} group{groups.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Admin action */}
      {isAdmin && (
        <div className="mb-6">
          <Link
            href={`/groups/create?churchId=${church.id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Create Group
          </Link>
        </div>
      )}

      {/* Group list */}
      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No small groups yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((group) => (
            <li
              key={group.id}
              className="rounded-lg border bg-card p-5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-base">{group.name}</h2>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {truncate(group.description, 120)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Created{' '}
                {new Date(group.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
