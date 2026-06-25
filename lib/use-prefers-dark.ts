'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query and returns whether it currently matches. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Tracks the OS color scheme so a basemap can match light / dark surfaces. */
export function usePrefersDark(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/** Tracks the reduced-motion preference so animations can be skipped. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
