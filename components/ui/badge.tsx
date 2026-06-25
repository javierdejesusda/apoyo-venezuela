import { type ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { toneClasses, type Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

interface BadgeProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  variant?: 'soft' | 'solid' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  tone = 'neutral',
  icon: Icon,
  children,
  variant = 'soft',
  size = 'md',
  className,
}: BadgeProps) {
  const t = toneClasses(tone);
  const sizeCls = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const variantCls =
    variant === 'solid'
      ? t.solid
      : variant === 'outline'
        ? cn('border bg-transparent', t.border, t.text)
        : cn('border', t.bg, t.text, t.border);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        sizeCls,
        variantCls,
        className,
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />}
      {children}
    </span>
  );
}
