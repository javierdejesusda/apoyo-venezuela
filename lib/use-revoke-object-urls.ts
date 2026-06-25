'use client';

import { useEffect, useRef } from 'react';

/** Revokes the given object URLs when the component unmounts, freeing memory. */
export function useRevokeObjectUrlsOnUnmount(urls: string[]): void {
  const urlsRef = useRef(urls);
  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
}
