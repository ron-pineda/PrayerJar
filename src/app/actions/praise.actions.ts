'use server';

import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import { PRAYER_CATEGORIES } from '@/lib/utils';
import type { CategoryValue } from '@/db/schema';

export async function getFilteredPraisesAction(
  period: 'week' | 'month' | 'all',
  category?: string,
) {
  const validCategory = PRAYER_CATEGORIES.some((c) => c.value === category)
    ? (category as CategoryValue)
    : undefined;
  return getAnsweredPrayersFiltered(period, validCategory);
}
