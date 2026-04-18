import type { ChmsAdapter, ChmsProviderSlug } from './ChmsAdapter';
import { db } from '@/db';
import { churches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/encrypt';

export type { ChmsProviderSlug };

export const CHMS_ADAPTERS: Record<ChmsProviderSlug, () => Promise<ChmsAdapter>> = {
  'planning-center': () =>
    import('./adapters/PlanningCenterAdapter').then(m => new m.PlanningCenterAdapter()),
  'breeze': () => {
    throw new Error('Breeze adapter not yet implemented (Sprint 19)');
  },
};

export async function getAdapterForChurch(churchId: string): Promise<ChmsAdapter> {
  const [church] = await db.select().from(churches).where(eq(churches.id, churchId)).limit(1);
  if (!church?.chmsProvider) throw new Error(`Church ${churchId} has no ChMS connected`);
  const slug = church.chmsProvider as ChmsProviderSlug;
  const factory = CHMS_ADAPTERS[slug];
  if (!factory) throw new Error(`No adapter registered for provider: ${slug}`);
  const adapter = await factory();
  if (!church.chmsConfig) throw new Error(`Church ${churchId} has no chmsConfig`);
  const config = JSON.parse(decrypt(church.chmsConfig));
  await adapter.connect(config);
  return adapter;
}
