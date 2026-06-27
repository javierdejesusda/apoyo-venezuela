/**
 * AI assistant route handler.
 * Streams grounded responses about Venezuelan relief zones via the AI SDK.
 * Applies per-IP rate limiting before invoking the model.
 */
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai';
import type { UIMessage } from 'ai';

import { clientIp, createRateLimiter } from '@/lib/ai/rate-limit';
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { buscarZonas } from '@/lib/ai/tools';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Maximum length of the user message content to prevent abuse. */
const MAX_MESSAGE_LENGTH = 1000;

const ASSISTANT_MODEL = openai('gpt-4o-mini');

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

export async function POST(req: Request): Promise<Response> {
  let messages: UIMessage[];

  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    messages = body.messages ?? [];
  } catch {
    return Response.json(
      { error: 'Solicitud no valida. Por favor intenta de nuevo.' },
      { status: 400 },
    );
  }

  if (messages.length === 0) {
    return Response.json(
      { error: 'El mensaje no puede estar vacio.' },
      { status: 400 },
    );
  }

  const lastMessage = messages[messages.length - 1];
  const textContent = lastMessage.parts
    ?.filter((p) => p.type === 'text')
    .map((p) => ('text' in p ? p.text : ''))
    .join('');

  if (textContent && textContent.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: 'El mensaje es demasiado largo. Por favor acorta tu pregunta.' },
      { status: 400 },
    );
  }

  const ip = clientIp(req.headers);
  const outcome = limiter.check(ip);

  if (!outcome.ok) {
    return Response.json(
      {
        error:
          'Has alcanzado el limite de preguntas. Intenta de nuevo en unos minutos.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(outcome.retryAfterSeconds) },
      },
    );
  }

  const result = streamText({
    model: ASSISTANT_MODEL,
    system: ASSISTANT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(4),
    tools: { buscarZonas },
  });

  const uiStream = toUIMessageStream({
    stream: result.stream,
    onError: (error) =>
      error instanceof Error ? error.message : 'Error inesperado. Intenta de nuevo.',
  });

  return createUIMessageStreamResponse({ stream: uiStream });
}
