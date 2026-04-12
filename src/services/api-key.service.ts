import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { createHash } from 'crypto';

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateRawKey(): string {
  // Format: pj_<40 random hex chars>
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pj_${hex}`;
}

export async function createApiKey(userId: string, name: string) {
  const raw = generateRawKey();
  const keyHash = hashKey(raw);
  const keyPrefix = raw.substring(0, 8); // "pj_XXXXX" (8 chars)

  const [key] = await db.insert(apiKeys).values({ userId, name, keyHash, keyPrefix }).returning();
  return { key, rawKey: raw }; // Return raw key ONCE — never stored
}

export async function validateApiKey(raw: string) {
  const keyHash = hashKey(raw);
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!key) return null;

  // Update lastUsedAt (non-blocking)
  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id)).catch(() => {});

  return key;
}

export async function revokeApiKey(id: string, userId: string) {
  const [key] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
    .returning();
  return key ?? null;
}

export async function listApiKeys(userId: string) {
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
}
