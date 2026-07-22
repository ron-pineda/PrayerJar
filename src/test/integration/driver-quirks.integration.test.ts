import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/db';
import { prayers } from '@/db/schema';
import { inArray } from 'drizzle-orm';

describe('neon-http driver quirks (bucket #2)', () => {
  let ids: string[] = [];

  beforeAll(async () => {
    // prayers.content (NOT .text), prayers.expiresAt is required (NOT NULL)
    const rows = await db
      .insert(prayers)
      .values([
        {
          authorId: null,
          content: 'driver-quirk-test-a',
          category: 'health',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          authorId: null,
          content: 'driver-quirk-test-b',
          category: 'health',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          authorId: null,
          content: 'driver-quirk-test-c',
          category: 'health',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ])
      .returning({ id: prayers.id });
    ids = rows.map((r) => r.id);
  });

  it('inArray works with neon-http (fix for sql=ANY())', async () => {
    const rows = await db.select().from(prayers).where(inArray(prayers.id, ids));
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('sql= ANY() pattern is banned from app code (drift prevention)', async () => {
    const fg = await import('fast-glob');
    const { default: fs } = await import('node:fs/promises');
    const appFiles = await fg.default('src/**/*.{ts,tsx}', {
      ignore: ['src/**/*.test.*', 'src/**/*.integration.test.*'],
    });
    for (const file of appFiles) {
      const content = await fs.readFile(file, 'utf8');
      // Template literal with = ANY( pattern — the historical bug that breaks neon-http
      expect(content, `${file} contains sql=ANY() pattern incompatible with neon-http`).not.toMatch(
        /sql`[^`]*=\s*ANY\s*\(/,
      );
    }
  });
});
