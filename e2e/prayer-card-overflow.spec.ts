import { test, expect } from './fixtures/auth';
import { seedPrayer } from './helpers/seed-prayer';

// PrayerCardMenu verified from src/components/prayer-card-menu.tsx:
// Trigger: Button with aria-label="Prayer actions" (MoreHorizontal icon)
// Own prayer menu items: Edit, Renew for 30 days, Mark as Answered, Delete
// The menu is a DropdownMenuContent rendered via @base-ui/react DropdownMenu.

test('overflow menu shows owner actions for own prayer', async ({ authedPage: page, request }) => {
  await seedPrayer(request);
  await page.goto('/my-prayers');

  // Open the overflow menu using the aria-label on the trigger button
  await page.getByRole('button', { name: /prayer actions/i }).first().click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  // At minimum one of: edit, delete, share (own prayer menu has Edit, Renew, Mark as Answered, Delete)
  const hasOwnerAction = await menu.getByRole('menuitem', { name: /edit|delete|renew/i }).first().isVisible();
  expect(hasOwnerAction).toBe(true);
});

test('edit dialog opens and closes cleanly', async ({ authedPage: page, request }) => {
  await seedPrayer(request);
  await page.goto('/my-prayers');
  await page.getByRole('button', { name: /prayer actions/i }).first().click();
  await page.getByRole('menuitem', { name: /edit/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
