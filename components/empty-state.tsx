import { type ReactNode } from 'react';

import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed',
        'border-border-strong bg-surface px-6 py-12 text-center',
      )}
    >
      {Icon && (
        <Icon
          className="h-10 w-10 text-ink-faint"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      )}
      <div className="space-y-1">
        <p className="font-medium text-ink">{title}</p>
        {description && (
          <p className="text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
