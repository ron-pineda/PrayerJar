import { test, expect } from './fixtures/auth';

// Button text verified from src/components/prayer-dialog.tsx: "Add a Prayer Request"
// Dialog is rendered inline via <Dialog> from shadcn — confirmed PrayerDialog mounted
// on homepage in commit a31b05c (src/app/(public)/page.tsx).

test('add-prayer dialog opens inline on homepage (not redirect)', async ({ authedPage: page }) => {
  await page.goto('/');
  // Archaeology: commit a31b05c — PrayerDialog wasn't mounted on homepage
  await page.getByRole('button', { name: /add a prayer request/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/\/$/); // must NOT have redirected
});

test('add-prayer dialog cancel leaves no ghost state', async ({ authedPage: page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /add a prayer request/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});
