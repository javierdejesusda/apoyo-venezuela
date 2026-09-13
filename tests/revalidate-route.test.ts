import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));

vi.mock('next/cache', () => ({ revalidatePath }));

import { POST } from '@/app/api/revalidate/route';

const ZONE = '/zona/3f1c9b2e-4a5d-4e6f-8a7b-9c0d1e2f3a4b';

function makeRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const savedSecret = process.env.CRON_SECRET;

beforeEach(() => {
  revalidatePath.mockReset();
  process.env.CRON_SECRET = 'top-secret';
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = savedSecret;
});

describe('revalidate route', () => {
  it('revalidates the requested paths for an authorized caller', async () => {
    const res = await POST(
      makeRequest({ paths: ['/', ZONE] }, { authorization: 'Bearer top-secret' }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, revalidated: ['/', ZONE] });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith(ZONE);
  });

  it('rejects a missing or wrong bearer token', async () => {
    const missing = await POST(makeRequest({ paths: ['/'] }));
    expect(missing.status).toBe(401);

    const wrong = await POST(makeRequest({ paths: ['/'] }, { authorization: 'Bearer nope' }));
    expect(wrong.status).toBe(401);

    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('refuses to run at all when no secret is configured', async () => {
    delete process.env.CRON_SECRET;

    const res = await POST(makeRequest({ paths: ['/'] }, { authorization: 'Bearer top-secret' }));

    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects paths outside the allowlist', async () => {
    const res = await POST(
      makeRequest({ paths: ['/reportar'] }, { authorization: 'Bearer top-secret' }),
    );

    expect(res.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a body that is not valid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: { authorization: 'Bearer top-secret' },
        body: 'not json',
      }),
    );

    expect(res.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
