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

import { assistantErrorMessage } from '@/lib/ai/error-message';
import { clientIp, createRateLimiter } from '@/lib/ai/rate-limit';
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { buscarZonas } from '@/lib/ai/tools';
import { validateChatRequest } from '@/lib/ai/validate-request';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ASSISTANT_MODEL = openai('gpt-4o-mini');

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

export async function POST(req: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: 'Solicitud no valida. Por favor intenta de nuevo.' },
      { status: 400 },
    );
  }

  const validation = validateChatRequest(body);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: validation.status });
  }

  const messages: UIMessage[] = validation.messages;

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

  // Grounding relies on the strict system prompt plus a single buscarZonas tool
  // with the default toolChoice 'auto'. 'auto' (not 'required') is deliberate:
  // it lets the model run the tool, then take a second step to answer from the
  // returned data, which an empty-state honest reply also needs. The blast
  // radius of any client-fabricated history is the requesting user only.
  const result = streamText({
    model: ASSISTANT_MODEL,
    system: ASSISTANT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(4),
    tools: { buscarZonas },
  });

  const uiStream = toUIMessageStream({
    stream: result.stream,
    onError: (error) => assistantErrorMessage(error),
  });

  return createUIMessageStreamResponse({ stream: uiStream });
}
