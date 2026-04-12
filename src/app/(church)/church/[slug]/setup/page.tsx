import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { PastorTips } from '@/components/church/pastor-tips';

interface Props {
  params: Promise<{ slug: string }>;
}

interface Step {
  title: string;
  description: string;
  link?: { href: string; label: string };
  comingSoon?: boolean;
}

export default async function ChurchSetupPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">You must be signed in to access this page.</p>
        <Link href="/sign-in" className="text-sm text-primary hover:underline">
          Sign in
        </Link>
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

  const steps: Step[] = [
    {
      title: 'Welcome',
      description: 'Your church is live on Prayer Jar. Here\'s how to get the most out of it.',
    },
    {
      title: 'Customize Branding',
      description: 'Add your logo, colors, and subdomain.',
      link: { href: `/church/${slug}/dashboard/branding`, label: 'Go to Branding' },
    },
    {
      title: 'Write a Welcome Message',
      description: 'Greet members when they first visit.',
      link: { href: `/church/${slug}/settings`, label: 'Open Settings' },
    },
    {
      title: 'Invite Your Prayer Team',
      description: 'Add members to your church so they can pray together.',
      comingSoon: true,
    },
    {
      title: 'Set Up Your First Event',
      description: 'Host a live prayer event at your next service.',
      link: { href: `/church/${slug}/events`, label: 'Go to Events' },
    },
    {
      title: 'Launch Your Pastoral Dashboard',
      description:
        'Monitor flagged prayers, assign to your team, and send weekly digests.',
      link: { href: `/church/${slug}/dashboard`, label: 'Open Dashboard' },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href={`/church/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
        >
          ← Back to {church.name}
        </Link>
        <h1 className="text-2xl font-bold">Church Setup Guide</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow these steps to get {church.name} fully set up on Prayer Jar.
        </p>
      </div>

      <ol className="flex flex-col gap-6 mb-10">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-4">
            <div className="flex-none flex items-start pt-0.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
                {index + 1}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold leading-tight">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {step.comingSoon ? (
                <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming soon
                </span>
              ) : step.link ? (
                <Link
                  href={step.link.href}
                  className="inline-flex w-fit items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {step.link.label} →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <PastorTips />
    </div>
  );
}
