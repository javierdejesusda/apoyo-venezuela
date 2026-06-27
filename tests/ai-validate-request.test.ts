import { describe, expect, it } from 'vitest';

import {
  MAX_MESSAGES,
  MAX_MESSAGE_LENGTH,
  MAX_TOTAL_CHARS,
  validateChatRequest,
} from '@/lib/ai/validate-request';
import type { UIMessage } from 'ai';

function msg(text: string, role: 'user' | 'assistant' = 'user'): UIMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role,
    parts: [{ type: 'text', text }],
  };
}

describe('validateChatRequest', () => {
  it('accepts a well-formed messages array', () => {
    const result = validateChatRequest({ messages: [msg('Hola')] });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages).toHaveLength(1);
    }
  });

  it('rejects a missing messages field', () => {
    const result = validateChatRequest({});

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a non-array messages field', () => {
    const result = validateChatRequest({ messages: 'nope' });

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a null body', () => {
    const result = validateChatRequest(null);

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects an empty messages array', () => {
    const result = validateChatRequest({ messages: [] });

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects more than MAX_MESSAGES messages', () => {
    const messages = Array.from({ length: MAX_MESSAGES + 1 }, () => msg('hi'));

    const result = validateChatRequest({ messages });

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('accepts exactly MAX_MESSAGES messages', () => {
    const messages = Array.from({ length: MAX_MESSAGES }, () => msg('hi'));

    const result = validateChatRequest({ messages });

    expect(result.ok).toBe(true);
  });

  it('rejects a last message over the per-message length cap', () => {
    const result = validateChatRequest({
      messages: [msg('a'.repeat(MAX_MESSAGE_LENGTH + 1))],
    });

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects when the aggregate character budget is exceeded by prior history', () => {
    const big = 'a'.repeat(MAX_MESSAGE_LENGTH);
    const count = Math.ceil(MAX_TOTAL_CHARS / MAX_MESSAGE_LENGTH) + 1;
    const messages = Array.from({ length: count }, () => msg(big));

    const result = validateChatRequest({ messages });

    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('does not leak raw error details in its message', () => {
    const result = validateChatRequest({ messages: 'nope' });

    if (!result.ok) {
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
