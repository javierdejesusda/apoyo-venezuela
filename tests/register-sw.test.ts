import { describe, expect, it, vi } from 'vitest';

import { registerServiceWorker } from '@/lib/register-sw';

describe('registerServiceWorker', () => {
  it('returns null when the navigator has no serviceWorker support', async () => {
    const result = await registerServiceWorker({} as Navigator);
    expect(result).toBeNull();
  });

  it('registers /sw.js at root scope without caching the SW script', async () => {
    const registration = { scope: '/' } as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);
    const nav = { serviceWorker: { register } } as unknown as Navigator;

    const result = await registerServiceWorker(nav);

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
    expect(result).toBe(registration);
  });

  it('returns null and does not throw when registration fails', async () => {
    const nav = {
      serviceWorker: { register: vi.fn().mockRejectedValue(new Error('blocked')) },
    } as unknown as Navigator;

    await expect(registerServiceWorker(nav)).resolves.toBeNull();
  });
});
