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
