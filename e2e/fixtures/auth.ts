import { test as base, expect, type Page } from '@playwright/test';
import path from 'path';

export const AUTH_STATE = path.resolve(__dirname, '../.auth/user.json');

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
export { expect };
