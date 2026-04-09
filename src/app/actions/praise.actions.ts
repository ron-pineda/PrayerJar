'use server';

import { getAnsweredPrayersFiltered } from '@/services/prayer.service';
import type { CategoryValue } from '@/db/schema';

export async function getFilteredPraisesAction(
  period: 'week' | 'month' | 'all',
  category?: string,
) {
  const validCategory = category as CategoryValue | undefined;
  return getAnsweredPrayersFiltered(period, validCategory);
}
