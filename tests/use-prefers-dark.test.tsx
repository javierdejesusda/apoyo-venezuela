// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useMediaQuery, usePrefersDark } from '@/lib/use-prefers-dark';

type Listener = (event: MediaQueryListEvent) => void;

/** Installs a controllable window.matchMedia mock and returns a setter. */
function installMatchMedia(initialMatches: boolean): { setMatches: (value: boolean) => void } {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initialMatches,
    media: '',
    addEventListener(type: string, listener: Listener): void {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener(type: string, listener: Listener): void {
      if (type === 'change') listeners.delete(listener);
    },
  };
  window.matchMedia = (query: string): MediaQueryList => {
    mql.media = query;
    return mql as unknown as MediaQueryList;
  };
  return {
    setMatches(value: boolean): void {
      mql.matches = value;
      listeners.forEach((listener) => listener({ matches: value } as MediaQueryListEvent));
    },
  };
}

afterEach(() => {
  cleanup();
});

describe('useMediaQuery', () => {
  it('reflects the current match state on the first render, with no flash', () => {
    installMatchMedia(true);
    const seen: boolean[] = [];
    function Probe(): null {
      seen.push(useMediaQuery('(prefers-color-scheme: dark)'));
      return null;
    }
    render(<Probe />);
    expect(seen[0]).toBe(true);
  });

  it('updates when the media query changes', () => {
    const control = installMatchMedia(false);
    let current = false;
    function Probe(): null {
      current = useMediaQuery('(prefers-color-scheme: dark)');
      return null;
    }
    render(<Probe />);
    expect(current).toBe(false);
    act(() => {
      control.setMatches(true);
    });
    expect(current).toBe(true);
  });
});

describe('usePrefersDark', () => {
  it('is true when the dark color scheme matches', () => {
    installMatchMedia(true);
    const seen: boolean[] = [];
    function Probe(): null {
      seen.push(usePrefersDark());
      return null;
    }
    render(<Probe />);
    expect(seen[0]).toBe(true);
  });
});
