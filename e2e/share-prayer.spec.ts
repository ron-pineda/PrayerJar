import { test, expect } from './fixtures/auth';
import { seedPrayer } from './helpers/seed-prayer';

// Share UI verified from src/components/prayer-card.tsx:
// Own prayers have a ghost Button with Share2 icon (sr-only "Share Link").
// Clicking it calls navigator.clipboard.writeText(`${origin}/p/${prayer.id}`).
// There is NO "Share" menu item in the overflow menu for own prayers.
// The share identifier is prayers.id directly (no separate shareId column — verified schema).

test('share link button copies correct public URL to clipboard', async ({ authedPage: page, request }) => {
  const { shareId } = await seedPrayer(request);
  await page.goto('/my-prayers');

  // Grant clipboard write permission for this context
  await page.context().grantPermissions(['clipboard-write']);

  // Click the Share Link button (sr-only text "Share Link")
  await page.getByRole('button', { name: /share link/i }).first().click();

  // Read clipboard value
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain(`/p/${shareId}`);
});

test('shared prayer page is publicly accessible', async ({ page: unauthPage, authedPage: page, request }) => {
  const { shareId } = await seedPrayer(request);

  // Verify the public prayer page loads without auth
  await unauthPage.goto(`/p/${shareId}`);
  await expect(unauthPage.getByRole('button', { name: /pray for this request/i })).toBeVisible();
});
