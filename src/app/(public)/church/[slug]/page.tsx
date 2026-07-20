import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const church = await getChurchBySlug(slug);
  if (!church) return { title: 'Church Not Found' };
  return {
    title: `${church.name} | Prayer Jar`,
    description: church.description ?? `Join ${church.name} on Prayer Jar — pray together, share requests, and grow in faith.`,
    openGraph: {
      title: church.name,
      description: church.description ?? `Join ${church.name} on Prayer Jar.`,
      type: 'website',
    },
  };
}

export default async function PublicChurchPage({ params }: Props) {
  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const members = await getChurchMembers(church.id);
  const currentMember = userId ? members.find((m) => m.user.id === userId) : null;
  const isAdminOrPastor =
    currentMember?.member.role === 'admin' || currentMember?.member.role === 'pastor';

  const joinUrl = `/church/join?code=${encodeURIComponent(slug)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <div className="flex items-start gap-5">
            {/* Church initial avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ backgroundColor: church.primaryColor }}
            >
              {church.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight break-words">{church.name}</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {members.length} {members.length === 1 ? 'member' : 'members'} on Prayer Jar
              </p>
            </div>
          </div>

          {church.description && (
            <p className="mt-6 text-base text-foreground/80 leading-relaxed">
              {church.description}
            </p>
          )}

          {church.welcomeMessage && (
            <blockquote className="mt-6 border-l-4 border-amber-400 pl-4 italic text-muted-foreground">
              {church.welcomeMessage}
            </blockquote>
          )}

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            {!userId ? (
              <Link
                href={`/sign-in?callbackUrl=${joinUrl}`}
                className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign in to join
              </Link>
            ) : currentMember ? (
              <Link
                href={`/church/${slug}/wall`}
                className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                View Prayer Wall
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href={joinUrl}
                className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Join this church
              </Link>
            )}

            {isAdminOrPastor && (
              <Link
                href={`/church/${slug}/dashboard`}
                className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Member list (first-name initials only, privacy-safe) */}
      {members.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Community ({members.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {members.map(({ member, user }) => {
              const label = user.name
                ? user.name.trim().charAt(0).toUpperCase()
                : (user.email ? user.email.charAt(0).toUpperCase() : '?');
              return (
                <div
                  key={member.id}
                  title={user.name ?? undefined}
                  className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-300"
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
