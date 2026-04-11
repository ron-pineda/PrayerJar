import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { CreateGroupForm } from '@/components/group/create-group-form';

export const metadata: Metadata = { title: 'Create a Group | The Prayer Jar' };

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/groups" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
          ← Back to Groups
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create a Group</h1>
        <p className="text-muted-foreground mt-1">
          Start a private prayer group and invite others with a code.
        </p>
      </div>

      <CreateGroupForm />
    </main>
  );
}
