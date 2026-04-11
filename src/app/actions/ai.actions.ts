'use server';

import { generateEncouragement } from '@/services/ai.service';

export async function generateEncouragementAction(
  prayerContent: string,
  verse: string
): Promise<{ encouragement: string }> {
  return generateEncouragement(prayerContent, verse);
}
