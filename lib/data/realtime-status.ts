/**
 * Decides how the app should react to a Supabase realtime channel status.
 * Extracted from the subscription effect so the liveness logic is unit-testable
 * without a real websocket. The Supabase client manages its own reconnection, so
 * we only report liveness; recovery flips `live` back to true.
 */
export interface RealtimeOutcome {
  /** Whether realtime updates are currently flowing. */
  live: boolean;
  /** Whether this status is definitive (transient states are not). */
  settled: boolean;
}

const TERMINAL_STATUSES = new Set(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']);

export function interpretChannelStatus(status: string): RealtimeOutcome {
  if (status === 'SUBSCRIBED') return { live: true, settled: true };
  if (TERMINAL_STATUSES.has(status)) return { live: false, settled: true };
  return { live: false, settled: false };
}
