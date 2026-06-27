/**
 * User-safe error mapping for the AI assistant stream.
 * Internal failures (provider errors, stack traces, secrets) must never reach
 * the client, so every error collapses to one fixed Spanish message.
 */

/** Fixed message shown to the client when the assistant stream fails. */
export const ASSISTANT_ERROR_MESSAGE =
  'Ocurrió un error procesando tu consulta. Intentá de nuevo.';

/**
 * Logs the real error server-side for diagnostics and returns the fixed
 * user-safe message. The raw error is never returned to the client.
 */
export function assistantErrorMessage(error: unknown): string {
  console.error('asistente stream error:', error);
  return ASSISTANT_ERROR_MESSAGE;
}
