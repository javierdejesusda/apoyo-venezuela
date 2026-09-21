import { EmergencyCallButton } from '@/components/emergency-call-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandMark } from '@/components/ui/brand-mark';

/**
 * Top bar for the transition page: brand, theme toggle and the 911 shortcut.
 * The primary navigation is gone with the routes it pointed at; only the
 * emergency line survives, since it never depended on this site.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[0.95rem] font-semibold tracking-tight text-ink">
              Apoyo Venezuela
            </span>
            <span className="eyebrow mt-0.5 text-[0.5rem] text-ink-faint">
              Sitio fuera de servicio
            </span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <EmergencyCallButton className="px-3.5 text-xs" />
        </div>
      </div>
    </header>
  );
}
