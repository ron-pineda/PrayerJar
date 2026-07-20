import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { PastorTips } from '@/components/church/pastor-tips';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventSetupPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/events/setup`);
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
        <Link href={`/church/${slug}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {church.name}
        </Link>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prayerjar.org';
  const widgetUrl = `${siteUrl}/embed/${slug}/widget`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}/events`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Events
        </Link>
        <h1 className="text-2xl font-bold">Event Setup Guide</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to run a live prayer event with {church.name}.
        </p>
      </div>

      <ol className="flex flex-col gap-6 mb-10">
        <li className="flex gap-4">
          <div className="flex-none flex items-start pt-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              1
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold leading-tight">Create Your Event</h2>
            <p className="text-sm text-muted-foreground">
              Go to your events page and click &quot;Create Event&quot;. Give it a name and set your
              dates.
            </p>
            <Link
              href={`/church/${slug}/events`}
              className="inline-flex w-fit items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Events
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </li>

        <li className="flex gap-4">
          <div className="flex-none flex items-start pt-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              2
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold leading-tight">Share the Prayer Wall</h2>
            <p className="text-sm text-muted-foreground">
              Attendees submit prayers at the URL below — show it on screen or add it to your
              program.
            </p>
            <code className="mt-1 block rounded-md bg-muted px-3 py-2 text-xs font-mono break-all text-foreground">
              {widgetUrl}
            </code>
          </div>
        </li>

        <li className="flex gap-4">
          <div className="flex-none flex items-start pt-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              3
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold leading-tight">Open the Moderation Console</h2>
            <p className="text-sm text-muted-foreground">
              Before the event starts, open the moderation console on a separate device to approve
              prayers as they come in.
            </p>
            <Link
              href={`/church/${slug}/events`}
              className="inline-flex w-fit items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Your Events
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </li>

        <li className="flex gap-4">
          <div className="flex-none flex items-start pt-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              4
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold leading-tight">Activate the Display</h2>
            <p className="text-sm text-muted-foreground">
              Project the display page on the big screen — it auto-refreshes every 5 seconds. Three
              display modes are available:
            </p>
            <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Stream</span> — shows a live feed of
                approved prayers as they arrive.
              </li>
              <li>
                <span className="font-medium text-foreground">Spotlight</span> — highlights one
                prayer at a time for focused, unified prayer.
              </li>
              <li>
                <span className="font-medium text-foreground">Category</span> — groups prayers by
                topic for structured intercession.
              </li>
            </ul>
          </div>
        </li>

        <li className="flex gap-4">
          <div className="flex-none flex items-start pt-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              5
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold leading-tight">Go Live</h2>
            <p className="text-sm text-muted-foreground">
              Set event status to &quot;Active&quot; from the wall page. Prayers start flowing
              immediately.
            </p>
          </div>
        </li>

        <li className="flex gap-4">
          <div className="flex-none flex items-start pt-0.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              6
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold leading-tight">Wrap Up</h2>
            <p className="text-sm text-muted-foreground">
              When done, set status to &quot;Ended&quot; and download the post-event report for your
              records.
            </p>
          </div>
        </li>
      </ol>

      <PastorTips variant="event" />
    </div>
  );
}
