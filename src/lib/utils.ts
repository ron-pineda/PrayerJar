import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PRAYER_CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'financial', label: 'Financial' },
  { value: 'grief', label: 'Grief' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'guidance', label: 'Guidance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'work_career', label: 'Work & Career' },
  { value: 'spiritual_growth', label: 'Spiritual Growth' },
  { value: 'other', label: 'Other' },
] as const;

export type CategoryValue = typeof PRAYER_CATEGORIES[number]['value'];

/**
 * Every slug `/pray/[category]` must serve — the ten real categories plus the
 * `any` sentinel that `getRandomPrayer` accepts and that backs the first card
 * in the category picker.
 *
 * This exists because the two drifted: a slug guard validated against
 * PRAYER_CATEGORIES alone and 404'd /pray/any in production, breaking the main
 * "pray for anyone" entry point. The picker and the route guard must read the
 * same list.
 */
export const PRAYER_ROUTE_SLUGS: readonly string[] = [
  'any',
  ...PRAYER_CATEGORIES.map((c) => c.value),
];
