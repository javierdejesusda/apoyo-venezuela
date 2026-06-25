/**
 * Manual color theme. The app defaults to light; dark is an opt-in choice that
 * is persisted to localStorage and applied via a `data-theme` attribute on
 * <html>, independent of the OS `prefers-color-scheme`.
 */
export type Theme = 'light' | 'dark';

/** localStorage key holding the user's chosen theme. */
export const THEME_STORAGE_KEY = 'apoyo-theme';

/** Theme used when the user has no stored preference. */
export const DEFAULT_THEME: Theme = 'light';

/**
 * Coerces an arbitrary stored value into a known theme.
 *
 * Anything other than the exact string 'dark' or 'light' (null, undefined, or a
 * legacy value such as 'system') resolves to the light default.
 */
export function normalizeTheme(value: string | null | undefined): Theme {
  return value === 'dark' || value === 'light' ? value : DEFAULT_THEME;
}

/** Returns the opposite theme, used by the manual toggle. */
export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}

/**
 * Inline script that applies the persisted theme to <html> before the first
 * paint, preventing a flash of the wrong theme. It reads the same storage key
 * the provider writes, defaults to light, and never throws if storage is
 * blocked (private mode), in which case the server-rendered light default
 * stands.
 */
export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});document.documentElement.dataset.theme=t==="dark"?"dark":"light";}catch(e){}})();`;
}
