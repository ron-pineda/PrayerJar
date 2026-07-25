import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRAYER_CATEGORIES, PRAYER_ROUTE_SLUGS } from './utils';

/**
 * Regression guard for a production 404 shipped on 2026-07-25.
 *
 * An SEO fix closed /pray/[category] to unknown slugs — correct, since it had
 * been serving 200s that reflected arbitrary text into the page title. But it
 * validated against PRAYER_CATEGORIES alone, and `any` is not a category: it is
 * the sentinel getRandomPrayer accepts and the first, most prominent card in
 * the picker. /pray/any 404'd in production, breaking the primary
 * "pray for anyone" entry point.
 *
 * These tests assert the picker's links and the route guard cannot drift apart.
 */
describe('prayer route slugs', () => {
  it('includes the `any` sentinel', () => {
    expect(PRAYER_ROUTE_SLUGS).toContain('any');
  });

  it('includes every real category', () => {
    for (const c of PRAYER_CATEGORIES) {
      expect(PRAYER_ROUTE_SLUGS).toContain(c.value);
    }
  });

  it('has one entry per category plus the sentinel, with no duplicates', () => {
    expect(PRAYER_ROUTE_SLUGS).toHaveLength(PRAYER_CATEGORIES.length + 1);
    expect(new Set(PRAYER_ROUTE_SLUGS).size).toBe(PRAYER_ROUTE_SLUGS.length);
  });

  it('serves every slug the category picker links to', () => {
    const picker = readFileSync(
      join(process.cwd(), 'src/components/category-picker.tsx'),
      'utf8'
    );
    // Static hrefs like `/pray/any`, plus the mapped `/pray/${cat.value}`.
    const staticSlugs = [...picker.matchAll(/\/pray\/([a-z_]+)/g)].map((m) => m[1]);

    expect(staticSlugs.length).toBeGreaterThan(0);
    for (const slug of staticSlugs) {
      expect(PRAYER_ROUTE_SLUGS).toContain(slug);
    }
  });

  it('gives the route guard a description for every servable slug', async () => {
    const page = readFileSync(
      join(process.cwd(), 'src/app/(public)/pray/[category]/page.tsx'),
      'utf8'
    );
    for (const slug of PRAYER_ROUTE_SLUGS) {
      expect(page).toContain(`${slug}:`);
    }
  });
});
