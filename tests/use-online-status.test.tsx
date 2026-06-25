// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useOnlineStatus } from '@/lib/use-online-status';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

afterEach(() => setNavigatorOnline(true));

describe('useOnlineStatus', () => {
  it('reflects navigator.onLine and reacts to offline/online events', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
