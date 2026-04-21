import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getChurchBySlug, getChurchMembers } from '@/services/church-platform.service';
import { hasCustomSubdomain } from '@/lib/plans';
import BrandingForm from './BrandingForm';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BrandingPage({ params }: Props) {
  const { slug } = await params;

  const church = await getChurchBySlug(slug);
  if (!church) notFound();

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=/church/${slug}/dashboard/branding`);
  }

  const members = await getChurchMembers(church.id);
  const currentMember = members.find((m) => m.user.id === session.user!.id);
  const canEdit =
    currentMember?.member.role === 'admin' ||
    currentMember?.member.role === 'pastor';

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">
          Only church admins and pastors can manage branding.
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href={`/church/${slug}/dashboard`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 inline-block"
      >
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-8">{church.name} — Branding</h1>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold mb-1">Custom branding</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Customize your church&apos;s logo, colors, and subdomain.
        </p>
        <BrandingForm
          churchSlug={slug}
          initialLogoUrl={church.logoUrl ?? null}
          initialPrimaryColor={church.primaryColor}
          initialSubdomain={church.subdomain ?? null}
          canClaimSubdomain={hasCustomSubdomain(church.currentPlan)}
        />
      </section>
    </div>
  );
}
