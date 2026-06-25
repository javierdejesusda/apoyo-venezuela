'use client';

import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

/**
 * Icon button that flips between the light and dark themes. The shown icon is
 * the theme it switches to (moon in light, sun in dark) and cross-fades on
 * change. Renders the light state until the theme is ready to avoid a
 * hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, ready, toggleTheme } = useTheme();
  const dark = ready && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Activar tema claro' : 'Activar tema oscuro'}
      title={dark ? 'Tema claro' : 'Tema oscuro'}
      className={cn(
        'relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-soft transition-[color,background-color,transform] duration-200 hover:bg-surface-2 hover:text-ink active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        className,
      )}
    >
      <Sun
        aria-hidden
        className={cn(
          'absolute h-[1.15rem] w-[1.15rem] transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
          dark ? 'scale-100 opacity-100 blur-0' : 'scale-50 opacity-0 blur-[2px]',
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          'absolute h-[1.15rem] w-[1.15rem] transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
          dark ? 'scale-50 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0',
        )}
      />
    </button>
  );
}
