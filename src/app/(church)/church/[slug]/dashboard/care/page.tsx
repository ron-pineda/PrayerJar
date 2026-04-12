import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getPastoralNotes } from '@/services/pastoral.service';
import { CreateNoteForm } from './CreateNoteForm';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PastoralCareInboxPage({ params }: Props) {
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

  const notes = await getPastoralNotes(church.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Pastoral Care Inbox</h1>
      </div>

      <div className="mb-8">
        <CreateNoteForm churchSlug={slug} />
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No care notes yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {notes.map((note) => {
            const author = members.find((m) => m.user.id === note.authorId);
            return (
              <li key={note.id} className="rounded-lg border bg-card p-5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed flex-1">{note.content}</p>
                  {note.isPrivate && (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Private
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{author?.user.name ?? 'Unknown'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
