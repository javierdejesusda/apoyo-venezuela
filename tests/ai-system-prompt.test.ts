import { describe, expect, it } from 'vitest';

import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';

describe('ASSISTANT_SYSTEM_PROMPT', () => {
  it('references the buscarZonas tool', () => {
    expect(ASSISTANT_SYSTEM_PROMPT).toContain('buscarZonas');
  });

  it('instructs the model not to invent zones', () => {
    expect(ASSISTANT_SYSTEM_PROMPT.toLowerCase()).toMatch(/no.*invent|inventes/);
  });

  it('specifies Spanish as the response language', () => {
    expect(ASSISTANT_SYSTEM_PROMPT.toLowerCase()).toMatch(/espa[nñ]/);
  });

  it('includes an honest empty-state instruction', () => {
    expect(ASSISTANT_SYSTEM_PROMPT.toLowerCase()).toMatch(/no.*encontr|ningun.*zona|no hay zona/);
  });
});
