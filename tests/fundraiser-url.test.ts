import { describe, expect, it } from 'vitest';

import {
  fundraiserHostLabel,
  normalizeFundraiserUrl,
} from '@/lib/data/fundraiser-url';

describe('normalizeFundraiserUrl', () => {
  it('strips tracking query params and hash fragments, keeping the path', () => {
    expect(
      normalizeFundraiserUrl(
        'https://www.gofundme.com/f/my-campaign?utm_source=instagram_story&utm_medium=customer#frag',
      ),
    ).toBe('https://gofundme.com/f/my-campaign');
  });

  it('normalizes the provided seed link with attribution and utm params', () => {
    expect(
      normalizeFundraiserUrl(
        'https://www.gofundme.com/f/emergency-relief-for-venezuela-earthquake-victims?attribution_id=sl:e39997e2-043a-4422-81b7-3ff40ec5f09f&lang=en_GB&ts=1782402438&utm_campaign=fp_sharesheet',
      ),
    ).toBe(
      'https://gofundme.com/f/emergency-relief-for-venezuela-earthquake-victims',
    );
  });

  it('drops a leading www. and a trailing slash so the dedup key is stable', () => {
    expect(normalizeFundraiserUrl('https://www.gofundme.com/f/my-campaign/')).toBe(
      'https://gofundme.com/f/my-campaign',
    );
  });

  it('produces the same key for the www and bare-host variants of a campaign', () => {
    expect(normalizeFundraiserUrl('https://www.gofundme.com/f/my-campaign')).toBe(
      normalizeFundraiserUrl('https://gofundme.com/f/my-campaign'),
    );
  });

  it('forces https and lowercases the host', () => {
    expect(normalizeFundraiserUrl('http://GoFundMe.com/f/Slug')).toBe(
      'https://gofundme.com/f/Slug',
    );
  });

  it('accepts the gofund.me short host', () => {
    expect(normalizeFundraiserUrl('https://gofund.me/abc123?x=1')).toBe(
      'https://gofund.me/abc123',
    );
  });

  it('accepts subdomains of gofundme.com', () => {
    expect(normalizeFundraiserUrl('https://charity.gofundme.com/f/slug')).toBe(
      'https://charity.gofundme.com/f/slug',
    );
  });

  it('rejects non-gofundme hosts', () => {
    expect(normalizeFundraiserUrl('https://example.com/f/slug')).toBeNull();
  });

  it('rejects look-alike and suffix-spoofing hosts', () => {
    expect(normalizeFundraiserUrl('https://gofundme.com.evil.com/f/x')).toBeNull();
    expect(normalizeFundraiserUrl('https://evilgofundme.com/f/x')).toBeNull();
  });

  it('rejects strings that are not valid URLs', () => {
    expect(normalizeFundraiserUrl('not a url')).toBeNull();
    expect(normalizeFundraiserUrl('')).toBeNull();
  });
});

describe('fundraiserHostLabel', () => {
  it('drops a leading www. for display', () => {
    expect(
      fundraiserHostLabel('https://www.gofundme.com/f/slug'),
    ).toBe('gofundme.com');
  });

  it('keeps the short host and real subdomains', () => {
    expect(fundraiserHostLabel('https://gofund.me/abc')).toBe('gofund.me');
    expect(
      fundraiserHostLabel('https://charity.gofundme.com/f/x'),
    ).toBe('charity.gofundme.com');
  });

  it('falls back to gofundme.com for an unparseable value', () => {
    expect(fundraiserHostLabel('not a url')).toBe('gofundme.com');
  });
});
