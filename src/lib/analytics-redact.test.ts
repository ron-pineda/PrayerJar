import { describe, it, expect } from 'vitest';
import { redactAnalyticsUrl, redactAnalyticsEvent } from './analytics-redact';

const ORIGIN = 'https://prayerjar.org';
const UUID = '8f3c1a2b-4d5e-6f70-8192-a3b4c5d6e7f8';

describe('redactAnalyticsUrl — prayer and testimony IDs', () => {
  it('redacts a prayer ID from /p/[id]', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/p/${UUID}`)).toBe(`${ORIGIN}/p/[id]`);
  });

  it('redacts a testimony ID from /testimony/[id]', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/testimony/${UUID}`)).toBe(
      `${ORIGIN}/testimony/[id]`,
    );
  });

  it('redacts a non-UUID prayer ID (survives an ID-format change)', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/p/abc123shortcode`)).toBe(
      `${ORIGIN}/p/[id]`,
    );
  });

  it('redacts any UUID segment regardless of route', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/groups/${UUID}/members`)).toBe(
      `${ORIGIN}/groups/[id]/members`,
    );
  });

  it('redacts nested event IDs under a church slug', () => {
    expect(
      redactAnalyticsUrl(`${ORIGIN}/church/grace-chapel/events/${UUID}`),
    ).toBe(`${ORIGIN}/church/grace-chapel/events/[id]`);
  });

  it('never emits a raw UUID anywhere in the output', () => {
    const out = redactAnalyticsUrl(`${ORIGIN}/p/${UUID}?from=${UUID}#${UUID}`);
    expect(out).not.toContain(UUID);
  });
});

describe('redactAnalyticsUrl — paths that must be preserved', () => {
  it('leaves ordinary marketing paths untouched', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/for-churches`)).toBe(
      `${ORIGIN}/for-churches`,
    );
  });

  it('keeps church slugs — they are public identifiers, not PII', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/church/grace-chapel`)).toBe(
      `${ORIGIN}/church/grace-chapel`,
    );
  });

  it('keeps the year on /wrapped/[year]', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/wrapped/2026`)).toBe(
      `${ORIGIN}/wrapped/2026`,
    );
  });

  it('keeps prayer category paths', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/pray/healing`)).toBe(
      `${ORIGIN}/pray/healing`,
    );
  });

  it('redacts a user ID on /wrapped/[userId] while keeping years', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/api/og/wrapped/${UUID}`)).toBe(
      `${ORIGIN}/api/og/wrapped/[id]`,
    );
  });
});

describe('redactAnalyticsUrl — query strings', () => {
  it('drops OG text payloads that carry prayer content', () => {
    const url = `${ORIGIN}/api/og/card/prayer?text=${encodeURIComponent(
      'Please pray for my mother',
    )}&category=Health`;
    const out = redactAnalyticsUrl(url);
    expect(out).not.toContain('mother');
    expect(out).not.toContain('text=');
    expect(out).toBe(`${ORIGIN}/api/og/card/prayer`);
  });

  it('drops arbitrary search params', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/browse?q=cancer&page=2`)).toBe(
      `${ORIGIN}/browse`,
    );
  });

  it('keeps campaign parameters we authored', () => {
    const out = redactAnalyticsUrl(
      `${ORIGIN}/?utm_source=facebook&utm_medium=social&secret=abc`,
    );
    expect(out).toContain('utm_source=facebook');
    expect(out).toContain('utm_medium=social');
    expect(out).not.toContain('secret');
  });

  it('strips the fragment', () => {
    expect(redactAnalyticsUrl(`${ORIGIN}/about#team`)).toBe(`${ORIGIN}/about`);
  });
});

describe('redactAnalyticsEvent', () => {
  it('rewrites the url and preserves the event type', () => {
    const out = redactAnalyticsEvent({
      type: 'pageview',
      url: `${ORIGIN}/p/${UUID}`,
    });
    expect(out).toEqual({ type: 'pageview', url: `${ORIGIN}/p/[id]` });
  });

  it('never returns null — pageview volume must stay accurate', () => {
    expect(redactAnalyticsEvent({ type: 'event', url: 'not-a-url' })).not.toBeNull();
  });
});
