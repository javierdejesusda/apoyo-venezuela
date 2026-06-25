'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  DEFAULT_THEME,
  nextTheme,
  normalizeTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/theme';

interface ThemeContextValue {
  /** The active theme. Before `ready`, this is the server default (light). */
  theme: Theme;
  /** True once the client has hydrated and adopted the persisted theme. */
  ready: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Reads the theme the no-flash inline script already applied to <html>. The
 * server always renders data-theme="light", so on the client this attribute is
 * the single source of truth (only the inline script reads localStorage).
 */
function readAppliedTheme(): Theme {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  return normalizeTheme(document.documentElement.dataset.theme);
}

/** Persists the chosen theme and applies it to <html> so the CSS reacts. */
function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the attribute still applies.
  }
}

const subscribeToNothing = () => () => {};

/** False during SSR and the first client render, true once hydrated. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * Holds the manual light/dark theme. The inline script in <head> paints the
 * persisted theme before hydration, so the lazy initializer already reads the
 * right value on the client. `ready` stays false through the first client
 * render so server-rendered consumers match the light default (no mismatch).
 * Invariant: any server-rendered consumer that branches on `theme` must gate on
 * `ready`, or it hydration-mismatches (the maps stay safe via ssr:false).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readAppliedTheme);
  const ready = useHydrated();

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      ready,
      setTheme,
      toggleTheme: () => setTheme(nextTheme(theme)),
    }),
    [theme, ready, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Reads the theme context; throws if used outside a ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
