'use client';

import { useState } from 'react';
import { Link2, MessageCircle, Send, Share2 } from 'lucide-react';

import {
  buildHomeSharePayload,
  buildTelegramUrl,
  buildWhatsAppUrl,
  buildZoneSharePayload,
  type SharePayload,
} from '@/lib/share';

type SharePanelProps =
  | { kind: 'home' }
  | { kind: 'zone'; zone: { id: string; nombre: string; ciudad: string } };

function buildPayload(props: SharePanelProps): SharePayload {
  const origin = window.location.origin;
  if (props.kind === 'home') return buildHomeSharePayload(origin);
  return buildZoneSharePayload(props.zone, origin);
}

export function SharePanel(props: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  const openShareUrl = (builder: (p: SharePayload) => string) => {
    window.open(builder(buildPayload(props)), '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    const payload = buildPayload(props);
    try {
      await navigator.clipboard.writeText(payload.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; silently ignore
    }
  };

  const handleNativeShare = () => {
    const payload = buildPayload(props);
    if (navigator.share) {
      navigator.share({ text: payload.text, url: payload.url }).catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
      });
    } else {
      openShareUrl(buildWhatsAppUrl);
    }
  };

  const btnClass =
    'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-label="Compartir" onClick={handleNativeShare} className={btnClass}>
        <Share2 className="h-4 w-4" aria-hidden />
        Compartir
      </button>

      <button
        type="button"
        aria-label="Compartir por WhatsApp"
        onClick={() => openShareUrl(buildWhatsAppUrl)}
        className={btnClass}
      >
        <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
        WhatsApp
      </button>

      <button
        type="button"
        aria-label="Compartir por Telegram"
        onClick={() => openShareUrl(buildTelegramUrl)}
        className={btnClass}
      >
        <Send className="h-4 w-4 text-[#229ED9]" aria-hidden />
        Telegram
      </button>

      <button
        type="button"
        aria-label="Copiar enlace"
        onClick={handleCopy}
        className={btnClass}
      >
        <Link2 className="h-4 w-4" aria-hidden />
        {copied ? 'Copiado' : 'Copiar enlace'}
      </button>
    </div>
  );
}
