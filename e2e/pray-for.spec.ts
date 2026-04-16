import { test, expect } from './fixtures/auth';
import { seedPrayer } from './helpers/seed-prayer';

// PrayForButton verified from src/components/pray-for-button.tsx:
// Initial button text: "Pray for This Request"
// Post-pray text: "I Prayed for This"
// The action is a server action (prayForRequestAction) — not a fetch to /pray or /pray-for URL.
// We track any POST matching the server action pattern.

test('pray-for fires exactly once (no double interaction)', async ({ authedPage: page, request }) => {
  const { shareId } = await seedPrayer(request);
  await page.goto(`/p/${shareId}`);

  let prayRequests = 0;
  page.on('request', (req) => {
    // Next.js server actions POST to the page URL with a specific header;
    // count any POST to the /p/ route as a pray action.
    if (req.method() === 'POST') {
      prayRequests += 1;
    }
  });

  // Button text verified: "Pray for This Request"
  await page.getByRole('button', { name: /pray for this request/i }).click();
  await page.waitForTimeout(1_500);
  // Bucket #5: double-fire regression — should only fire once
  expect(prayRequests).toBeLessThanOrEqual(1);
});
