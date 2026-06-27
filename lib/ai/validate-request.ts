/**
 * Pure request validation for the AI assistant chat endpoint.
 * Bounds payload size so a malformed or abusive request is rejected with 400
 * before the route ever invokes the model.
 */
import type { UIMessage } from 'ai';

/** Maximum number of messages accepted in a single conversation payload. */
export const MAX_MESSAGES = 50;

/** Maximum length of a single message's combined text parts. */
export const MAX_MESSAGE_LENGTH = 1000;

/** Maximum aggregate characters across every message in the payload. */
export const MAX_TOTAL_CHARS = 24_000;

export type ValidateChatRequestResult =
  | { ok: true; messages: UIMessage[] }
  | { ok: false; status: number; message: string };

function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => ('text' in part ? part.text : ''))
    .join('');
}

/**
 * Validates a parsed chat request body and returns either the typed messages or
 * a 400 rejection. Never calls the model; all error messages are user-safe.
 */
export function validateChatRequest(body: unknown): ValidateChatRequestResult {
  const messages = (body as { messages?: unknown } | null | undefined)?.messages;

  if (!Array.isArray(messages)) {
    return {
      ok: false,
      status: 400,
      message: 'Solicitud no valida. Por favor intenta de nuevo.',
    };
  }

  if (messages.length === 0) {
    return { ok: false, status: 400, message: 'El mensaje no puede estar vacio.' };
  }

  if (messages.length > MAX_MESSAGES) {
    return {
      ok: false,
      status: 400,
      message: 'La conversacion es demasiado larga. Empieza una nueva.',
    };
  }

  const typed = messages as UIMessage[];

  const lastText = messageText(typed[typed.length - 1]);
  if (lastText.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: 'El mensaje es demasiado largo. Por favor acorta tu pregunta.',
    };
  }

  let totalChars = 0;
  for (const message of typed) {
    totalChars += messageText(message).length;
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return {
      ok: false,
      status: 400,
      message: 'La conversacion es demasiado larga. Empieza una nueva.',
    };
  }

  return { ok: true, messages: typed };
}
