import { describe, expect, it } from 'vitest';

import { cn, createId, formatRelativeTime, telHref } from '@/lib/utils';

describe('cn', () => {
  it('joins truthy classes and drops falsy ones', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  it('resolves conflicting tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('telHref', () => {
  it('preserves short codes', () => {
    expect(telHref('911')).toBe('tel:911');
    expect(telHref('171')).toBe('tel:171');
    expect(telHref('*1')).toBe('tel:*1');
  });

  it('strips spaces, dashes and parentheses from full numbers', () => {
    expect(telHref('0212-545-45-45')).toBe('tel:02125454545');
    expect(telHref('+58 412 5928735')).toBe('tel:+584125928735');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-25T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('handles recent moments', () => {
    expect(formatRelativeTime(ago(30 * 1000), now)).toBe('hace un momento');
  });

  it('handles minutes and hours', () => {
    expect(formatRelativeTime(ago(5 * 60 * 1000), now)).toBe('hace 5 min');
    expect(formatRelativeTime(ago(3 * 60 * 60 * 1000), now)).toBe('hace 3 h');
  });

  it('handles yesterday and days', () => {
    expect(formatRelativeTime(ago(25 * 60 * 60 * 1000), now)).toBe('ayer');
    expect(formatRelativeTime(ago(3 * 24 * 60 * 60 * 1000), now)).toBe('hace 3 dias');
  });

  it('returns empty string for invalid input', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('');
  });
});

describe('createId', () => {
  it('uses the given prefix and is unique', () => {
    const a = createId('zona');
    const b = createId('zona');
    expect(a.startsWith('zona_')).toBe(true);
    expect(a).not.toBe(b);
  });
});
