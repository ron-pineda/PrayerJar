import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  getGroupById,
  getGroupMembers,
  getGroupActivity,
  getGroupMembership,
} from '@/services/group.service';
import { GroupWall } from '@/components/group/group-wall';
import { GroupActivity } from '@/components/group/group-activity';
import { GroupDetailActions } from '@/components/group/group-detail-actions';
import { GroupTabs } from '@/components/group/group-tabs';
import { CopyButton } from '@/components/group/copy-button';
import { Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Group | The Prayer Jar' };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const userId = session.user.id;

  const [group, membership] = await Promise.all([
    getGroupById(id),
    getGroupMembership(userId, id),
  ]);

  // Not found or not a member
  if (!group || !membership) redirect('/groups');

  const [members, activity] = await Promise.all([
    getGroupMembers(id),
    getGroupActivity(id),
  ]);

  const isOwner = membership.role === 'owner';
  const isSoleOwner =
    isOwner &&
    members.filter((m) => m.member.role === 'owner').length === 1 &&
    members.length === 1;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/groups" className="text-sm text-muted-foreground hover:underline mb-1 inline-block">
            ← Groups
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground mt-1">{group.description}</p>
          )}
        </div>
        <GroupDetailActions
          groupId={id}
          isOwner={isOwner}
          isSoleOwner={isSoleOwner}
        />
      </div>

      {/* Invite code */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Invite Code
        </h2>
        <InviteCodeBlock code={group.inviteCode} />
      </div>

      {/* Members */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Users size={14} />
          Members ({members.length})
        </h2>
        <ul className="divide-y">
          {members.map(({ member, userName }) => {
            const initial = (userName ?? '?').trim().charAt(0).toUpperCase();
            return (
              <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-300 shrink-0">
                  {initial}
                </div>
                <span className="flex-1 text-sm font-medium">{userName ?? 'Unknown'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    member.role === 'owner'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {member.role === 'owner' ? 'Owner' : 'Member'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Prayers + Activity tabs */}
      <GroupTabs
        prayersTab={<GroupWall groupId={id} currentUserId={userId} />}
        activityTab={<GroupActivity activity={activity} />}
      />
    </main>
  );
}

// ── Invite code display with copy button ────────────────────────────────────

function InviteCodeBlock({ code }: { code: string }) {
  // This is a server-rendered shell; the copy button is client-only
  return (
    <div className="flex items-center gap-3">
      <code className="flex-1 bg-muted px-4 py-2 rounded-lg font-mono text-lg tracking-widest select-all">
        {code}
      </code>
      <CopyButton text={code} />
    </div>
  );
}
