import { describe, expect, it } from 'vitest';

import {
  buildStorageUri,
  escapeSqlLiteral,
  fotoUrlToStoragePath,
  isValidLocationId,
} from '../scripts/delete-report.mjs';

describe('isValidLocationId', () => {
  it('accepts a canonical UUID', () => {
    expect(isValidLocationId('449e15fa-b72d-4050-ba42-d17f2cff375b')).toBe(true);
  });

  it('accepts uppercase hex (Postgres uuids are case-insensitive)', () => {
    expect(isValidLocationId('449E15FA-B72D-4050-BA42-D17F2CFF375B')).toBe(true);
  });

  it('rejects empty, malformed, or injection-shaped input', () => {
    expect(isValidLocationId('')).toBe(false);
    expect(isValidLocationId('not-a-uuid')).toBe(false);
    expect(
      isValidLocationId("449e15fa-b72d-4050-ba42-d17f2cff375b'; drop table locations;--"),
    ).toBe(false);
  });
});

describe('fotoUrlToStoragePath', () => {
  it('extracts the object key from a public fotos URL', () => {
    const url =
      'https://rwzjztbwbqpylsqndjjf.supabase.co/storage/v1/object/public/fotos/40fcf67a-7607-4b52-b800-227c92426a4b-screenshot.jpg';
    expect(fotoUrlToStoragePath(url)).toBe(
      '40fcf67a-7607-4b52-b800-227c92426a4b-screenshot.jpg',
    );
  });

  it('ignores a query string or hash on the URL', () => {
    const url = 'https://x.supabase.co/storage/v1/object/public/fotos/abc.jpg?token=1';
    expect(fotoUrlToStoragePath(url)).toBe('abc.jpg');
  });

  it('returns null for demo-mode data URLs', () => {
    expect(fotoUrlToStoragePath('data:image/png;base64,AAAA')).toBeNull();
  });

  it('returns null for URLs outside the fotos bucket', () => {
    expect(
      fotoUrlToStoragePath('https://x.supabase.co/storage/v1/object/public/otros/a.jpg'),
    ).toBeNull();
    expect(fotoUrlToStoragePath('https://example.com/a.jpg')).toBeNull();
  });
});

describe('escapeSqlLiteral', () => {
  it('doubles single quotes', () => {
    expect(escapeSqlLiteral("o'brien")).toBe("o''brien");
  });

  it('leaves safe text unchanged', () => {
    expect(escapeSqlLiteral('San Bernardino')).toBe('San Bernardino');
  });
});

describe('buildStorageUri', () => {
  it('builds an ss:// uri into the fotos bucket', () => {
    expect(buildStorageUri('abc.jpg')).toBe('ss:///fotos/abc.jpg');
  });
});
