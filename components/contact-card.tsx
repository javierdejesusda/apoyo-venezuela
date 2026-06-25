import { BadgeCheck, ExternalLink, Phone } from 'lucide-react';

import { contactCategoryMeta } from '@/lib/status';
import { cn, telHref } from '@/lib/utils';
import type { EmergencyContact } from '@/lib/data/types';
import { Badge } from '@/components/ui/badge';

interface ContactCardProps {
  contact: EmergencyContact;
}

/** Checks whether a string looks like an HTTP/HTTPS URL. */
function isUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function ContactCard({ contact }: ContactCardProps) {
  const meta = contactCategoryMeta[contact.category];
  const CategoryIcon = meta.icon;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {/* Header: category badge + organization name */}
      <div className="flex flex-col gap-1.5">
        <Badge tone={meta.tone} icon={CategoryIcon}>
          {meta.label}
        </Badge>
        <h3 className="text-sm font-semibold text-ink leading-snug">{contact.organization}</h3>
      </div>

      {/* Phone numbers */}
      {contact.phones.length > 0 && (
        <ul className="flex flex-col gap-1" role="list" aria-label="Teléfonos de contacto">
          {contact.phones.map((phone) => (
            <li key={phone}>
              <a
                href={telHref(phone)}
                aria-label={`Llamar al ${phone}`}
                className={cn(
                  'inline-flex min-h-[44px] w-full items-center gap-2.5 rounded-xl',
                  'border border-border-strong bg-surface-2 px-3',
                  'text-sm font-medium text-ink transition-colors duration-150',
                  'hover:border-brand-500 hover:text-brand-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                )}
              >
                <Phone className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
                <span>{phone}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Notes */}
      {contact.notes && (
        <p className="text-xs text-ink-faint leading-relaxed">{contact.notes}</p>
      )}

      {/* Footer: source link + verified indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {contact.source && isUrl(contact.source) ? (
          <a
            href={contact.source}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1 text-xs text-ink-faint underline-offset-2',
              'hover:text-brand-600 hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded',
            )}
          >
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            Fuente
          </a>
        ) : (
          <span />
        )}

        {contact.verified ? (
          <Badge tone="success" icon={BadgeCheck} size="sm">
            Verificado
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            Sin verificar
          </Badge>
        )}
      </div>
    </article>
  );
}
