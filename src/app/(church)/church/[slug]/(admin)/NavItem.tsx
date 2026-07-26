'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  exact?: boolean; // when true, only exact pathname match is active (prevents parent-child collision)
}

// Sprint 27 (pj-s27-02): the `locked` branch is gone, along with its lock icon,
// its expandable "Available on the X plan" callout and its link to /billing.
// Nothing in the church admin nav is tier-locked any more, so every item here is
// a plain link.
export function NavItem({ href, label, exact }: NavItemProps) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname === href || (href.length > 1 && pathname.startsWith(href + '/'));

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
