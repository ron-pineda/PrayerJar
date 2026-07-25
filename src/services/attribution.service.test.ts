/**
 * Tests for recordSignupAttribution — the write half of pj-s26-03.
 *
 * Strategy: mock `next/headers` (the cookie jar NextAuth's createUser event
 * reads from) and the drizzle `db` chain, then assert on the exact payload
 * handed to `.set()`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const cookieStore = { get: vi.fn() };
vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
}));

const setSpy = vi.fn();
const whereSpy = vi.fn();
const returningSpy = vi.fn();

vi.mock('@/db', () => ({
  db: {
    update: () => ({
      set: (values: unknown) => {
        setSpy(values);
        return {
          where: (cond: unknown) => {
            whereSpy(cond);
            return { returning: () => returningSpy() };
          },
        };
      },
    }),
  },
}));

import { recordSignupAttribution } from './attribution.service';
import { encodeAttribution, deriveAttribution } from '@/lib/attribution';

const USER_ID = '11111111-2222-3333-4444-555555555555';

beforeEach(() => {
  vi.clearAllMocks();
  returningSpy.mockReturnValue(Promise.resolve([{ id: USER_ID }]));
});

describe('recordSignupAttribution', () => {
  it('writes the cookie values onto the user row', async () => {
    const attribution = deriveAttribution(
      'https://prayerjar.org/for-churches?utm_source=bulletin&utm_medium=email&utm_campaign=advent',
      'https://somechurchblog.org/links',
      'prayerjar.org',
    );
    cookieStore.get.mockReturnValue({ value: encodeAttribution(attribution) });

    const result = await recordSignupAttribution(USER_ID);

    expect(result).toEqual(attribution);
    expect(setSpy).toHaveBeenCalledWith({
      acquisitionSource: 'email',
      utmSource: 'bulletin',
      utmMedium: 'email',
      utmCampaign: 'advent',
      signupReferrer: 'https://somechurchblog.org/links',
      signupLandingPath: '/for-churches',
    });
  });

  it('is a no-op when no attribution cookie is present', async () => {
    cookieStore.get.mockReturnValue(undefined);

    expect(await recordSignupAttribution(USER_ID)).toBeNull();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('is a no-op when the cookie is malformed', async () => {
    cookieStore.get.mockReturnValue({ value: 'garbage-not-json' });

    expect(await recordSignupAttribution(USER_ID)).toBeNull();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('reports null when the row was already stamped (first touch wins)', async () => {
    const attribution = deriveAttribution('https://prayerjar.org/', null, 'prayerjar.org');
    cookieStore.get.mockReturnValue({ value: encodeAttribution(attribution) });
    // Guarded UPDATE matched no rows — acquisition_source was already set.
    returningSpy.mockReturnValue(Promise.resolve([]));

    expect(await recordSignupAttribution(USER_ID)).toBeNull();
  });

  it('never writes a prayer ID into signupLandingPath', async () => {
    const uuid = '8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8';
    const attribution = deriveAttribution(
      `https://prayerjar.org/p/${uuid}`,
      null,
      'prayerjar.org',
    );
    cookieStore.get.mockReturnValue({ value: encodeAttribution(attribution) });

    await recordSignupAttribution(USER_ID);

    const written = setSpy.mock.calls[0][0];
    expect(written.signupLandingPath).toBe('/p/[id]');
    expect(JSON.stringify(written)).not.toContain(uuid);
  });

  it('never writes an email address — no PII reaches the attribution columns', async () => {
    const attribution = deriveAttribution(
      'https://prayerjar.org/?email=ron%40example.com&utm_source=bulletin',
      null,
      'prayerjar.org',
    );
    cookieStore.get.mockReturnValue({ value: encodeAttribution(attribution) });

    await recordSignupAttribution(USER_ID);

    expect(JSON.stringify(setSpy.mock.calls[0][0])).not.toContain('example.com');
  });
});
