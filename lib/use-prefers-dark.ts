'use client';

import { useEffect, useState } from 'react';

/** Subscribes to a CSS media query and returns whether it currently matches. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/** Tracks the OS color scheme so a basemap can match light / dark surfaces. */
export function usePrefersDark(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/** Tracks the reduced-motion preference so animations can be skipped. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
