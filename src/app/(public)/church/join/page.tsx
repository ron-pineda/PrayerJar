import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import {
  getChurchBySlug,
  getChurchMembers,
} from '@/services/church-platform.service';
import { JoinButton } from './JoinButton';

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { code } = await searchParams;
  if (!code) return { title: 'Join a Church | The Prayer Jar' };
  const church = await getChurchBySlug(code);
  return {
    title: church
      ? `Join ${church.name} | The Prayer Jar`
      : 'Invalid Invite | The Prayer Jar',
  };
}

export default async function ChurchJoinPage({ searchParams }: Props) {
  const { code } = await searchParams;

  // ── No code ──────────────────────────────────────────────────────────────
  if (!code) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-6" aria-hidden="true">&#x26EA;</p>
        <h1 className="text-2xl font-bold mb-3">Invalid Invite Link</h1>
        <p className="text-muted-foreground mb-6">
          This invite link is missing a church code. Ask your church admin for
          the correct link.
        </p>
        <Link href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Prayer Jar
        </Link>
      </main>
    );
  }

  // ── Church lookup ─────────────────────────────────────────────────────────
  const church = await getChurchBySlug(code);

  if (!church) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-6" aria-hidden="true">&#x26EA;</p>
        <h1 className="text-2xl font-bold mb-3">Invalid Invite Link</h1>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find a church with that code. The link may be
          outdated or incorrect. Ask your church admin for a fresh link.
        </p>
        <Link href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Prayer Jar
        </Link>
      </main>
    );
  }

  const session = await auth();

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/church/join?code=${code}`);
    return (
      <main className="max-w-lg mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4" aria-hidden="true">&#x26EA;</p>
          <h1 className="text-2xl font-bold mb-2">You&apos;re Invited</h1>
          <p className="text-muted-foreground">
            You&apos;ve been invited to join a church on PrayerJar.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">{church.name}</h2>
          {church.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {church.description}
            </p>
          )}
          {church.welcomeMessage && (
            <p className="mt-3 text-sm italic text-muted-foreground border-t pt-3">
              &ldquo;{church.welcomeMessage}&rdquo;
            </p>
          )}
        </div>

        <Link
          href={`/sign-in?callbackUrl=${callbackUrl}`}
          className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in to join {church.name}
        </Link>

        <p className="text-xs text-muted-foreground text-center mt-4">
          After signing in you&apos;ll be brought right back here to complete
          joining.
        </p>
      </main>
    );
  }

  // ── Already a member ──────────────────────────────────────────────────────
  const members = await getChurchMembers(church.id);
  const alreadyMember = members.some((m) => m.user.id === session.user!.id);

  if (alreadyMember) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-6" aria-hidden="true">&#x2705;</p>
        <h1 className="text-2xl font-bold mb-3">
          You&apos;re already a member of {church.name}
        </h1>
        <p className="text-muted-foreground mb-6">
          Head over to your church&apos;s prayer wall to see what&apos;s been
          shared.
        </p>
        <Link
          href={`/church/${church.slug}/wall`}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Prayer Wall
        </Link>
      </main>
    );
  }

  // ── Signed in, not yet a member ───────────────────────────────────────────
  return (
    <main className="max-w-lg mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <p className="text-5xl mb-4" aria-hidden="true">&#x26EA;</p>
        <h1 className="text-2xl font-bold mb-2">You&apos;re Invited</h1>
        <p className="text-muted-foreground">
          Join this church on PrayerJar.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">{church.name}</h2>
        {church.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {church.description}
          </p>
        )}
        {church.welcomeMessage && (
          <p className="mt-3 text-sm italic text-muted-foreground border-t pt-3">
            &ldquo;{church.welcomeMessage}&rdquo;
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {members.length} member{members.length === 1 ? '' : 's'}
        </p>
      </div>

      <JoinButton slug={church.slug} churchName={church.name} />

      <p className="text-xs text-muted-foreground text-center mt-4">
        Joining adds you to this church&apos;s member roster. The private church
        prayer wall is not available yet — prayers you post today go to the
        public PrayerJar wall.
      </p>
    </main>
  );
}
