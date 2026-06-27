'use client';

import { DefaultChatTransport } from 'ai';
import { MessageCircle, Send, Square } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';

import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

const EXAMPLE_QUESTIONS = [
  { id: 'agua', text: 'Tengo agua, ¿en qué sitios la puedo dar?' },
  { id: 'medicinas', text: '¿Qué sitios necesitan medicinas urgente?' },
  { id: 'alimentos', text: '¿Dónde puedo llevar alimentos?' },
  { id: 'urgentes', text: '¿Cuáles son las zonas con necesidades más urgentes?' },
];

export default function AsistentePage() {
  const { messages, sendMessage, stop, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/asistente' }),
  });

  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === 'streaming' || status === 'submitted';
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  function handleChipClick(text: string) {
    sendMessage({ text });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || isStreaming) return;
    sendMessage({ text: value });
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const value = inputRef.current?.value.trim();
      if (!value || isStreaming) return;
      sendMessage({ text: value });
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        icon={MessageCircle}
        eyebrow="Asistente"
        title="¿Cómo puedo ayudar?"
        description="Pregúntame sobre zonas que necesitan ayuda, qué llevar o dónde ir. Solo cito datos reales del mapa."
      />

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error.message || 'Ocurrió un error. Por favor intenta de nuevo.'}
        </div>
      )}

      <div
        ref={transcriptRef}
        className="min-h-[300px] overflow-y-auto rounded-2xl border border-border bg-surface p-4"
        aria-live="polite"
        aria-label="Conversacion con el asistente"
      >
        {!hasMessages && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
            <p className="text-sm text-ink-soft">
              Haz una pregunta o elige un ejemplo para comenzar.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleChipClick(q.text)}
                  disabled={isStreaming}
                  className={cn(
                    'rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors',
                    'hover:border-brand-300 hover:bg-brand-100 active:scale-[0.96]',
                    'dark:border-brand-900 dark:bg-brand-900/20 dark:text-brand-300',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages &&
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'mb-4 flex',
                message.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-prose rounded-2xl px-4 py-2.5 text-sm',
                  message.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'border border-border bg-surface-2 text-ink',
                )}
              >
                {message.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return <p key={i} className="whitespace-pre-wrap">{part.text}</p>;
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            placeholder="Escribe tu pregunta aquí..."
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            aria-label="Tu pregunta"
            className={cn(
              'min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm',
              'placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-500/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Detener respuesta"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger transition-colors hover:bg-danger/20 active:scale-[0.96]"
            >
              <Square className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isStreaming}
              aria-label="Enviar pregunta"
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors',
                'hover:bg-brand-700 active:scale-[0.96]',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <p className="text-xs text-ink-faint">
          Las respuestas se basan solo en los datos registrados en el mapa. Verifica siempre
          la informacion antes de actuar.
        </p>
      </form>
    </div>
  );
}
