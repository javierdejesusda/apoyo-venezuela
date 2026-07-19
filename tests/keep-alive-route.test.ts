import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const ping = vi.fn();

vi.mock('@/lib/data/store', () => ({
  getStore: () => ({ ping }),
}));

import { GET } from '@/app/api/cron/keep-alive/route';

function makeRequest(headers?: Record<string, string>): Request {
  return new Request('http://localhost/api/cron/keep-alive', { headers });
}

const savedSecret = process.env.CRON_SECRET;

beforeEach(() => {
  ping.mockReset();
  ping.mockResolvedValue(undefined);
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = savedSecret;
});

describe('keep-alive cron route', () => {
  it('returns 401 when CRON_SECRET is set and the Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'top-secret';

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ ok: false });
    expect(ping).not.toHaveBeenCalled();
  });

  it('returns 401 when CRON_SECRET is set and the bearer token is wrong', async () => {
    process.env.CRON_SECRET = 'top-secret';

    const res = await GET(makeRequest({ authorization: 'Bearer wrong' }));

    expect(res.status).toBe(401);
    expect(ping).not.toHaveBeenCalled();
  });

  it('returns 200 when CRON_SECRET is set and the bearer token matches', async () => {
    process.env.CRON_SECRET = 'top-secret';

    const res = await GET(makeRequest({ authorization: 'Bearer top-secret' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('allows the request when CRON_SECRET is not set (dev/demo)', async () => {
    delete process.env.CRON_SECRET;

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('returns 500 and logs when the keep-alive ping rejects', async () => {
    delete process.env.CRON_SECRET;
    const error = new Error('backend unreachable');
    ping.mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false });
    expect(consoleError).toHaveBeenCalledWith('keep-alive ping failed', error);
    consoleError.mockRestore();
  });
});
