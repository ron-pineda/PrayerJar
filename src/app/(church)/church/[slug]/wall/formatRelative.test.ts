import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelative } from './formatRelative';

describe('formatRelative', () => {
  beforeEach(() => {
    // Fix "now" to a known timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates less than 60 seconds ago', () => {
    const date = new Date('2025-06-15T11:59:30Z');
    expect(formatRelative(date)).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 1 minute', () => {
    const date = new Date('2025-06-15T11:59:00Z');
    expect(formatRelative(date)).toBe('1 minute ago');
  });

  it('returns "5 minutes ago" for 5 minutes', () => {
    const date = new Date('2025-06-15T11:55:00Z');
    expect(formatRelative(date)).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for exactly 1 hour', () => {
    const date = new Date('2025-06-15T11:00:00Z');
    expect(formatRelative(date)).toBe('1 hour ago');
  });

  it('returns "3 hours ago" for 3 hours', () => {
    const date = new Date('2025-06-15T09:00:00Z');
    expect(formatRelative(date)).toBe('3 hours ago');
  });

  it('returns "yesterday" for exactly 1 day ago', () => {
    const date = new Date('2025-06-14T12:00:00Z');
    expect(formatRelative(date)).toBe('yesterday');
  });

  it('returns "7 days ago" for 7 days', () => {
    const date = new Date('2025-06-08T12:00:00Z');
    expect(formatRelative(date)).toBe('7 days ago');
  });

  it('returns "1 month ago" for ~30 days', () => {
    const date = new Date('2025-05-16T12:00:00Z');
    expect(formatRelative(date)).toBe('1 month ago');
  });

  it('returns "2 months ago" for ~60 days', () => {
    const date = new Date('2025-04-16T12:00:00Z');
    expect(formatRelative(date)).toBe('2 months ago');
  });

  it('returns "1 year ago" for ~365 days', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(formatRelative(date)).toBe('1 year ago');
  });

  it('returns "2 years ago" for ~730 days', () => {
    const date = new Date('2023-06-16T12:00:00Z');
    expect(formatRelative(date)).toBe('2 years ago');
  });
});
