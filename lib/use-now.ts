'use client';

import { useSyncExternalStore } from 'react';

/**
 * Shared "current time" store for relative-time UI ("hace X min"). A single
 * app-wide interval drives every subscriber, and the server snapshot is null so
 * server and client first paint agree (no hydration mismatch); the real time
 * arrives after mount. Read it with the useNow() hook.
 */
let currentNow: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
const TICK_MS = 60_000;

function subscribe(onChange: () => void): () => void {
  if (timer === null) {
    currentNow = Date.now();
    timer = setInterval(() => {
      currentNow = Date.now();
      for (const listener of listeners) listener();
    }, TICK_MS);
  }
  listeners.add(onChange);
  onChange();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Returns the current epoch milliseconds, refreshed each minute (null on SSR). */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => currentNow,
    () => null,
  );
}
