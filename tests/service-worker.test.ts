import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

interface WorkerEvent {
  waitUntil: (promise: Promise<unknown>) => void;
}

/**
 * Runs `public/sw.js` against a stub worker global so the install and activate
 * handlers can be driven directly. The file never reaches a bundler, so this is
 * the only place its behavior is checked.
 */
function loadServiceWorker(cacheKeys: string[], clientUrls: string[]) {
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const deletedCaches: string[] = [];
  const navigatedTo: string[] = [];
  const matchAllOptions: unknown[] = [];
  let skipWaitingCalls = 0;
  let unregisterCalls = 0;

  const self = {
    addEventListener: (type: string, handler: (event: WorkerEvent) => void) => {
      listeners.set(type, handler);
    },
    skipWaiting: async () => {
      skipWaitingCalls += 1;
    },
    registration: {
      unregister: async () => {
        unregisterCalls += 1;
      },
    },
    clients: {
      matchAll: async (options: unknown) => {
        matchAllOptions.push(options);
        return clientUrls.map((url) => ({
          url,
          navigate: async (target: string) => {
            navigatedTo.push(target);
          },
        }));
      },
    },
  };

  const caches = {
    keys: async () => [...cacheKeys],
    delete: async (key: string) => {
      deletedCaches.push(key);
      return true;
    },
  };

  const context = createContext({ self, caches });
  runInContext(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8'), context);

  async function dispatch(type: string) {
    const handler = listeners.get(type);
    if (!handler) throw new Error(`No ${type} listener registered`);
    const pending: Promise<unknown>[] = [];
    handler({ waitUntil: (promise) => pending.push(promise) });
    await Promise.all(pending);
  }

  return {
    dispatch,
    listenerTypes: () => [...listeners.keys()],
    deletedCaches,
    navigatedTo,
    matchAllOptions,
    skipWaitingCalls: () => skipWaitingCalls,
    unregisterCalls: () => unregisterCalls,
  };
}

describe('service worker kill switch', () => {
  /**
   * Anyone who used the site already has the old caching worker installed, and
   * it would keep serving them the map from cache long after the site stopped
   * operating. A fetch handler here would do the same, so there must not be one.
   */
  it('intercepts no requests at all', () => {
    const worker = loadServiceWorker([], []);

    expect(worker.listenerTypes()).not.toContain('fetch');
  });

  it('takes over from the previous worker on install', async () => {
    const worker = loadServiceWorker([], []);

    await worker.dispatch('install');

    expect(worker.skipWaitingCalls()).toBe(1);
  });

  it('drops every cache the previous worker left behind', async () => {
    const worker = loadServiceWorker(['apoyo-shell-v1', 'apoyo-runtime-v1'], []);

    await worker.dispatch('activate');

    expect(worker.deletedCaches).toEqual(['apoyo-shell-v1', 'apoyo-runtime-v1']);
  });

  it('unregisters itself so the next visit has no worker', async () => {
    const worker = loadServiceWorker(['apoyo-shell-v1'], []);

    await worker.dispatch('activate');

    expect(worker.unregisterCalls()).toBe(1);
  });

  it('reloads every open tab onto the live page', async () => {
    const worker = loadServiceWorker([], [
      'https://apoyovenezuela.com/',
      'https://apoyovenezuela.com/zona/1a2b3c',
    ]);

    await worker.dispatch('activate');

    expect(worker.navigatedTo).toEqual([
      'https://apoyovenezuela.com/',
      'https://apoyovenezuela.com/zona/1a2b3c',
    ]);
    expect(worker.matchAllOptions).toEqual([{ type: 'window' }]);
  });
});
