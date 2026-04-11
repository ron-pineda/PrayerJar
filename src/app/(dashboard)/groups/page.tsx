import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getGroupsForUser } from '@/services/group.service';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { JoinGroupForm } from '@/components/group/join-group-form';
import { Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Groups | The Prayer Jar' };

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const groups = await getGroupsForUser(session.user.id);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground mt-1">
            Private prayer groups for your community.
          </p>
        </div>
        <div className="flex gap-2">
          <JoinGroupForm />
          <Button render={<Link href="/groups/new" />}>
            Create a group
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="You're not in any groups yet"
          description="Create one or join with an invite code."
        />
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="block rounded-xl border bg-card p-5 hover:shadow-md transition-shadow duration-200 hover:border-amber-300/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">{group.name}</h2>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
