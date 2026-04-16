import { test, expect } from './fixtures/auth';

// Button text verified from src/app/(dashboard)/my-prayers/page.tsx:
// PrayerDialog component renders "Add a Prayer Request" button.
// Two locations: header area and empty state — we click the first.

test('add-prayer from My Prayers opens inline — not homepage redirect', async ({ authedPage: page }) => {
  await page.goto('/my-prayers');
  // Archaeology: commit c990752 — used to redirect to /
  await page.getByRole('button', { name: /add a prayer request/i }).first().click();
  await expect(page).toHaveURL(/\/my-prayers/);
  await expect(page.getByRole('dialog')).toBeVisible();
});
