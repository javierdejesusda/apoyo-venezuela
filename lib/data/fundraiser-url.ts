/**
 * Pure helpers for GoFundMe fundraiser links plus the shared duplicate-url
 * error. The normalized URL is the deduplication key, so the helper that builds
 * it and the error that signals a clash live together. No I/O, no framework.
 */

/**
 * Validates and canonicalizes a GoFundMe link. Returns the normalized URL
 * (https, lowercase host without a leading "www.", no query string, no hash,
 * no trailing slash) or `null` when the input is not a valid GoFundMe URL.
 *
 * The host and path are canonicalized the same way validation and display treat
 * them so that the result is a stable deduplication key: the www and bare-host
 * variants of the same campaign collapse to one value.
 */
export function normalizeFundraiserUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const isGofundme =
    host === 'gofundme.com' ||
    host === 'gofund.me' ||
    host.endsWith('.gofundme.com');
  if (!isGofundme) return null;
  const path = parsed.pathname.replace(/\/+$/, '');
  return `https://${host}${path || '/'}`;
}

/** Short, trust-building host label for display (drops a leading "www."). */
export function fundraiserHostLabel(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'gofundme.com';
  }
}

/** Thrown when a fundraiser with the same normalized URL already exists. */
export class DuplicateFundraiserError extends Error {
  constructor(url: string) {
    super(`Fundraiser already exists for ${url}`);
    this.name = 'DuplicateFundraiserError';
  }
}
