import { describe, expect, it } from 'vitest';

import { corsHeaders, handleOptions, jsonError, jsonOk, withApiError } from '@/lib/api/http';

describe('corsHeaders', () => {
  it('allows any origin and only safe read methods', () => {
    const headers = corsHeaders();
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });

  it('returns a fresh object each call (no shared mutation)', () => {
    const a = corsHeaders();
    a['Access-Control-Allow-Origin'] = 'mutated';
    expect(corsHeaders()['Access-Control-Allow-Origin']).toBe('*');
  });
});

describe('jsonOk', () => {
  it('wraps the payload in a data envelope with 200 status', async () => {
    const res = jsonOk({ hello: 'world' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { hello: 'world' } });
  });

  it('merges extra top-level keys such as pagination', async () => {
    const res = jsonOk([1, 2], { pagination: { total: 2, nextCursor: null } });
    expect(await res.json()).toEqual({
      data: [1, 2],
      pagination: { total: 2, nextCursor: null },
    });
  });

  it('sets CORS and edge cache headers', () => {
    const res = jsonOk({});
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=3600',
    );
  });
});

describe('jsonError', () => {
  it('returns the consistent error envelope with the given status', async () => {
    const res = jsonError(404, 'not_found', 'Zona no encontrada.');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: 'not_found', message: 'Zona no encontrada.' },
    });
  });

  it('sets CORS headers but never a cache header', () => {
    const res = jsonError(400, 'bad_request', 'Parametro invalido.');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});

describe('handleOptions', () => {
  it('answers CORS preflight with 204 and no body', async () => {
    const res = handleOptions();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.text()).toBe('');
  });
});

describe('withApiError', () => {
  it('passes through the handler result when nothing throws', async () => {
    const wrapped = withApiError(async () => jsonOk({ ok: true }));
    const res = await wrapped();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { ok: true } });
  });

  it('forwards arguments to the wrapped handler', async () => {
    const wrapped = withApiError(async (n: number) => jsonOk({ n }));
    expect(await (await wrapped(7)).json()).toEqual({ data: { n: 7 } });
  });

  it('converts a thrown error into a 500 envelope with CORS and no internal leak', async () => {
    const wrapped = withApiError(async () => {
      throw new Error('supabase connection refused at 10.0.0.5');
    });
    const res = await wrapped();
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: { code: 'internal_error', message: 'Error interno.' } });
    expect(body.error.message).not.toContain('supabase');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBeNull();
  });
});
