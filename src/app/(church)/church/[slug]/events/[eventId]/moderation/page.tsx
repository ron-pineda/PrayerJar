import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { getEvent } from '@/services/event.service';
import ModerationConsole from './ModerationConsole';

interface Props {
  params: Promise<{ slug: string; eventId: string }>;
}

export default async function ModerationPage({ params }: Props) {
  const { slug, eventId } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/events/${eventId}/moderation`);
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);

  if (
    !currentMember ||
    (currentMember.member.role !== 'admin' &&
      currentMember.member.role !== 'pastor')
  ) {
    notFound();
  }

  const event = await getEvent(eventId);
  if (!event || event.churchId !== church.id) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/events/${eventId}/wall`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to Event Wall
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Moderation Console</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{event.name}</p>
          </div>
          <Link
            href={`/church/${slug}/events/${eventId}/display`}
            className="text-sm text-primary underline"
          >
            Display Mode →
          </Link>
        </div>
      </div>

      <ModerationConsole eventId={eventId} churchSlug={slug} />
    </div>
  );
}
