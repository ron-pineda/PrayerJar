'use client';

import Link from 'next/link';

interface PostEventCtaProps {
  churchName: string;
  churchSlug: string;
}

export function PostEventCta({ churchName, churchSlug }: PostEventCtaProps) {
  return (
    <div className="rounded-xl border bg-card p-8 text-center mt-10 shadow-sm">
      <div className="mb-2 text-3xl">🙏</div>
      <h2 className="text-xl font-semibold mb-2">
        Thank you for joining {churchName}&apos;s prayer event!
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your prayers are being held before God.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
        <Link
          href={`/embed/${churchSlug}/widget`}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Submit Another Prayer
        </Link>
        <Link
          href="/pray"
          className="rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Pray for Others
        </Link>
        <Link
          href="/about"
          className="rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Learn About Prayer Jar
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Share this event with a friend and invite them to pray together.
      </p>
    </div>
  );
}
