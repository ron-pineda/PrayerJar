'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItemProps {
  href: string;
  label: string;
  locked: boolean;
  tierName: string; // e.g. "Small Church" — shown in upgrade callout
  exact?: boolean; // when true, only exact pathname match is active (prevents parent-child collision)
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 opacity-40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function NavItem({ href, label, locked, tierName, exact }: NavItemProps) {
  const pathname = usePathname();
  const [showCallout, setShowCallout] = useState(false);

  const isActive = exact
    ? pathname === href
    : pathname === href || (href.length > 1 && pathname.startsWith(href + '/'));

  if (locked) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowCallout((v) => !v)}
          aria-expanded={showCallout}
          aria-controls={`callout-${href.replace(/\//g, '-')}`}
          aria-label={`${label} — upgrade required`}
          className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors text-muted-foreground hover:bg-muted/50"
        >
          <span>{label}</span>
          <LockIcon />
        </button>
        {showCallout && (
          <div
            id={`callout-${href.replace(/\//g, '-')}`}
            className="mx-2 mb-1 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground"
          >
            <p className="mb-2">
              Available on the{' '}
              <span className="font-medium text-foreground">{tierName}</span> plan.
            </p>
            <Link
              href="/billing"
              className="text-primary hover:underline"
              onClick={() => setShowCallout(false)}
            >
              View plans →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-muted/50'
      }`}
    >
      {label}
    </Link>
  );
}
