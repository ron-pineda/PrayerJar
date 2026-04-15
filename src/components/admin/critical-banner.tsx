'use client';

import Link from 'next/link';

export type CriticalItem = {
  label: string;
  href: string;
};

export function CriticalBanner({ items }: { items: CriticalItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
      <p className="font-semibold text-destructive mb-1">Urgent items need attention:</p>
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, i) => (
          <li key={i}>
            <Link href={item.href} className="underline text-destructive hover:text-destructive/80">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
