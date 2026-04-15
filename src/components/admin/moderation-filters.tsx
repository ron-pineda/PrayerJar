'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const CATEGORIES = [
  { value: 'all', label: 'All categories' },
  { value: 'selfHarm', label: 'Self-harm' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate', label: 'Hate' },
  { value: 'sexual', label: 'Sexual' },
  { value: 'other', label: 'Other' },
] as const;

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
] as const;

export function ModerationFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? 'all';
  const status = searchParams.get('status') ?? 'all';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="category-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Category:
        </label>
        <select
          id="category-filter"
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="text-sm border rounded px-2 py-1 bg-background"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Status:
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="text-sm border rounded px-2 py-1 bg-background"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
