import { APIRequestContext } from '@playwright/test';

export async function seedPrayer(request: APIRequestContext, text = 'seeded for e2e') {
  const res = await request.post('/api/debug/seed-prayer', {
    headers: { authorization: `Bearer ${process.env.SENTRY_DEBUG_TOKEN}` },
    data: { text },
  });
  if (!res.ok()) throw new Error(`seed-prayer failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as { prayerId: string; shareId: string };
}
