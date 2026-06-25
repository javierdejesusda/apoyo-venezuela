import { ExternalLink, HeartHandshake } from 'lucide-react';

import { buttonClasses } from '@/components/ui/button';
import { fundraiserHostLabel } from '@/lib/data/fundraiser-url';
import type { Fundraiser } from '@/lib/data/types';

/** Card for a single community-submitted GoFundMe campaign. */
export function FundraiserCard({ fundraiser }: { fundraiser: Fundraiser }) {
  const host = fundraiserHostLabel(fundraiser.url);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift">
      <div className="flex-1">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-soft">
          <HeartHandshake className="h-3.5 w-3.5 text-brand-600" aria-hidden />
          {host}
        </span>

        <h3 className="mt-3 text-base font-semibold text-ink">{fundraiser.titulo}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-ink-soft">{fundraiser.descripcion}</p>

        {fundraiser.organizador && (
          <p className="mt-2 text-xs text-ink-faint">
            Organiza: <span className="font-medium text-ink-soft">{fundraiser.organizador}</span>
          </p>
        )}
      </div>

      <a
        href={fundraiser.url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses('primary', 'md', 'mt-4 w-full')}
      >
        Ver y donar en GoFundMe
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </article>
  );
}
