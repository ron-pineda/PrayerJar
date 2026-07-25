import { describe, it, expect } from 'vitest';
import {
  deriveAttribution,
  encodeAttribution,
  decodeAttribution,
  shouldStampAttribution,
} from './attribution';

const ORIGIN = 'https://prayerjar.org';
const SELF_HOST = 'prayerjar.org';
const UUID = '8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8';

describe('deriveAttribution — channel classification', () => {
  it('classifies no referrer and no UTM as direct', () => {
    const a = deriveAttribution(`${ORIGIN}/`, null, SELF_HOST);
    expect(a.acquisitionSource).toBe('direct');
    expect(a.referrer).toBeNull();
  });

  it('classifies a Google referrer as organic_search', () => {
    const a = deriveAttribution(`${ORIGIN}/`, 'https://www.google.com/', SELF_HOST);
    expect(a.acquisitionSource).toBe('organic_search');
  });

  it('classifies a Facebook referrer as social', () => {
    const a = deriveAttribution(`${ORIGIN}/`, 'https://m.facebook.com/', SELF_HOST);
    expect(a.acquisitionSource).toBe('social');
  });

  it('classifies an unknown external referrer as referral', () => {
    const a = deriveAttribution(
      `${ORIGIN}/`,
      'https://somechurchblog.org/links',
      SELF_HOST,
    );
    expect(a.acquisitionSource).toBe('referral');
    expect(a.referrer).toBe('https://somechurchblog.org/links');
  });

  it('ignores an internal referrer and falls back to direct', () => {
    const a = deriveAttribution(`${ORIGIN}/wall`, `${ORIGIN}/`, SELF_HOST);
    expect(a.acquisitionSource).toBe('direct');
    expect(a.referrer).toBeNull();
  });

  it('lets UTM medium override referrer inference', () => {
    const a = deriveAttribution(
      `${ORIGIN}/?utm_source=google&utm_medium=cpc&utm_campaign=lent`,
      'https://www.google.com/',
      SELF_HOST,
    );
    expect(a.acquisitionSource).toBe('paid');
    expect(a.utmSource).toBe('google');
    expect(a.utmMedium).toBe('cpc');
    expect(a.utmCampaign).toBe('lent');
  });

  it('classifies utm_medium=email as email', () => {
    const a = deriveAttribution(`${ORIGIN}/?utm_medium=email`, null, SELF_HOST);
    expect(a.acquisitionSource).toBe('email');
  });

  it('classifies an unrecognised utm_medium as campaign', () => {
    const a = deriveAttribution(`${ORIGIN}/?utm_medium=flyer`, null, SELF_HOST);
    expect(a.acquisitionSource).toBe('campaign');
  });

  it('classifies utm_source alone as campaign', () => {
    const a = deriveAttribution(`${ORIGIN}/?utm_source=bulletin`, null, SELF_HOST);
    expect(a.acquisitionSource).toBe('campaign');
    expect(a.utmMedium).toBeNull();
  });
});

describe('deriveAttribution — privacy', () => {
  it('drops the referrer query string (search terms must not be stored)', () => {
    const a = deriveAttribution(
      `${ORIGIN}/`,
      'https://www.google.com/search?q=prayer+for+my+dying+father',
      SELF_HOST,
    );
    expect(a.referrer).toBe('https://www.google.com/search');
    expect(a.referrer).not.toContain('father');
  });

  it('redacts a prayer ID in the landing path', () => {
    const a = deriveAttribution(`${ORIGIN}/p/${UUID}`, null, SELF_HOST);
    expect(a.landingPath).toBe('/p/[id]');
    expect(a.landingPath).not.toContain(UUID);
  });

  it('stores only a path for landingPath, never a full URL with params', () => {
    const a = deriveAttribution(
      `${ORIGIN}/browse?q=cancer&utm_source=x`,
      null,
      SELF_HOST,
    );
    expect(a.landingPath).toBe('/browse');
  });

  it('caps long values so a crafted URL cannot bloat the row', () => {
    const long = 'a'.repeat(500);
    const a = deriveAttribution(`${ORIGIN}/?utm_campaign=${long}`, null, SELF_HOST);
    expect(a.utmCampaign!.length).toBeLessThanOrEqual(128);
  });

  it('survives a malformed referrer without throwing', () => {
    const a = deriveAttribution(`${ORIGIN}/`, 'not a url', SELF_HOST);
    expect(a.acquisitionSource).toBe('direct');
  });
});

describe('encodeAttribution / decodeAttribution', () => {
  it('round-trips', () => {
    const a = deriveAttribution(
      `${ORIGIN}/for-churches?utm_source=bulletin&utm_medium=print`,
      'https://somechurchblog.org/links',
      SELF_HOST,
    );
    expect(decodeAttribution(encodeAttribution(a))).toEqual(a);
  });

  it('returns null for missing, empty or malformed cookie values', () => {
    expect(decodeAttribution(null)).toBeNull();
    expect(decodeAttribution('')).toBeNull();
    expect(decodeAttribution('%7Bnot-json')).toBeNull();
    expect(decodeAttribution('garbage-not-json')).toBeNull();
    expect(decodeAttribution(encodeURIComponent('{"nope":1}'))).toBeNull();
  });

  it('decodes regardless of how many percent-encoding layers survived', () => {
    // Next's ResponseCookies.set encodes on top of encodeAttribution, and
    // RequestCookies.get strips one layer — so the read side can legitimately
    // see 0, 1 or 2 layers depending on runtime.
    const a = deriveAttribution(`${ORIGIN}/?utm_campaign=50%25-off`, null, SELF_HOST);
    const plain = JSON.stringify(a);
    expect(decodeAttribution(plain)).toEqual(a);
    expect(decodeAttribution(encodeURIComponent(plain))).toEqual(a);
    expect(decodeAttribution(encodeURIComponent(encodeURIComponent(plain)))).toEqual(a);
  });

  it('round-trips a campaign name containing a literal percent sign', () => {
    const a = deriveAttribution(`${ORIGIN}/?utm_campaign=50%25-off`, null, SELF_HOST);
    expect(a.utmCampaign).toBe('50%-off');
    expect(decodeAttribution(encodeAttribution(a))).toEqual(a);
  });
});

describe('shouldStampAttribution', () => {
  const base = {
    hasExistingCookie: false,
    isAuthenticated: false,
    accept: 'text/html,application/xhtml+xml',
    isPrefetch: false,
    pathname: '/',
  };

  it('stamps a fresh anonymous HTML request', () => {
    expect(shouldStampAttribution(base)).toBe(true);
  });

  it('never overwrites an existing cookie — first touch wins', () => {
    expect(shouldStampAttribution({ ...base, hasExistingCookie: true })).toBe(false);
  });

  it('skips authenticated requests', () => {
    expect(shouldStampAttribution({ ...base, isAuthenticated: true })).toBe(false);
  });

  it('skips prefetches', () => {
    expect(shouldStampAttribution({ ...base, isPrefetch: true })).toBe(false);
  });

  it('skips non-document requests', () => {
    expect(shouldStampAttribution({ ...base, accept: 'image/avif' })).toBe(false);
    expect(shouldStampAttribution({ ...base, accept: null })).toBe(false);
  });

  it('skips API routes', () => {
    expect(shouldStampAttribution({ ...base, pathname: '/api/v1/prayers' })).toBe(
      false,
    );
  });
});
