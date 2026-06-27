import { convertToModelMessages, isStepCount, simulateReadableStream, streamText } from 'ai';
import type { UIMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LocationWithNeeds } from '@/lib/data/types';

const storeState = vi.hoisted(() => ({ locations: [] as LocationWithNeeds[] }));

vi.mock('@/lib/data/store', () => ({
  getStore: () => ({
    isDemo: false,
    listLocations: async () => storeState.locations,
    listLocationsPage: async () => ({
      items: storeState.locations,
      total: storeState.locations.length,
    }),
    getLocation: async () => null,
    createLocation: async () => {
      throw new Error('not implemented');
    },
    updateLocationStatus: async () => null,
    createNeed: async () => {
      throw new Error('not implemented');
    },
    updateNeedStatus: async () => null,
    listFundraisers: async () => [],
    createFundraiser: async () => {
      throw new Error('not implemented');
    },
    checkReportQuota: async () => true,
    getClusterForLocation: async () => null,
  }),
}));

import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { buscarZonas } from '@/lib/ai/tools';

const PHONE = '0412-9998877';

function loc(over: Partial<LocationWithNeeds> = {}): LocationWithNeeds {
  return {
    id: 'z1',
    nombre: 'Zona Carabobo Centro',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    zona: undefined,
    lat: 10.16,
    lng: -68.0,
    status: 'dano_parcial',
    contactoNombre: 'Maria Lopez',
    contactoTelefono: PHONE,
    fotos: ['https://example.com/foto.jpg'],
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    needs: [
      {
        id: 'n1',
        locationId: 'z1',
        categoria: 'agua',
        descripcion: 'Se necesita agua potable',
        urgencia: 'alta',
        status: 'pendiente',
        createdAt: '2026-06-25T00:00:00Z',
        updatedAt: '2026-06-25T00:00:00Z',
      },
    ],
    summary: { total: 1, pendientes: 1, enCamino: 0, cubiertos: 0, urgentes: 1 },
    ...over,
  };
}

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

function streamOf(chunks: LanguageModelV4StreamPart[]) {
  return { stream: simulateReadableStream({ chunks, initialDelayInMs: 0, chunkDelayInMs: 0 }) };
}

/** First step: the model calls buscarZonas with the given JSON arguments. */
function toolCallStep(input: string) {
  return streamOf([
    { type: 'stream-start', warnings: [] },
    { type: 'response-metadata', id: 'r1', modelId: 'mock', timestamp: new Date(0) },
    { type: 'tool-call', toolCallId: 'call-1', toolName: 'buscarZonas', input },
    { type: 'finish', finishReason: { unified: 'tool-calls', raw: 'tool_calls' }, usage },
  ]);
}

/** Second step: the model streams an answer in incremental text deltas. */
function textStep(deltas: string[]) {
  return streamOf([
    { type: 'stream-start', warnings: [] },
    { type: 'response-metadata', id: 'r2', modelId: 'mock', timestamp: new Date(0) },
    { type: 'text-start', id: 't1' },
    ...deltas.map((delta) => ({ type: 'text-delta' as const, id: 't1', delta })),
    { type: 'text-end', id: 't1' },
    { type: 'finish', finishReason: { unified: 'stop', raw: 'stop' }, usage },
  ]);
}

const userMessages: UIMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: '¿Donde puedo llevar agua en Carabobo?' }],
  },
];

async function run(model: MockLanguageModelV4): Promise<string[]> {
  const result = streamText({
    model,
    system: ASSISTANT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(userMessages),
    stopWhen: isStepCount(4),
    tools: { buscarZonas },
  });

  const chunks: string[] = [];
  for await (const part of result.textStream) {
    chunks.push(part);
  }
  return chunks;
}

beforeEach(() => {
  storeState.locations = [];
});

describe('grounded assistant pipeline', () => {
  it('runs buscarZonas and flows PII-stripped zone data into the next model step', async () => {
    storeState.locations = [loc()];
    const model = new MockLanguageModelV4({
      doStream: [
        toolCallStep(JSON.stringify({ estado: 'Carabobo' })),
        textStep(['En ', 'Carabobo ', 'hay una zona.']),
      ],
    });

    const chunks = await run(model);

    expect(model.doStreamCalls).toHaveLength(2);

    const step1Prompt = JSON.stringify(model.doStreamCalls[0].prompt);
    expect(step1Prompt).toContain('buscarZonas');

    const step2Prompt = JSON.stringify(model.doStreamCalls[1].prompt);
    expect(step2Prompt).toContain('Zona Carabobo Centro');
    expect(step2Prompt).not.toContain(PHONE);
    expect(step2Prompt).not.toContain('Maria Lopez');
    expect(step2Prompt).not.toContain('10.16');

    expect(chunks.join('')).toBe('En Carabobo hay una zona.');
  });

  it('reaches an honest reply step with no fabricated zone when nothing matches', async () => {
    storeState.locations = [];
    const model = new MockLanguageModelV4({
      doStream: [
        toolCallStep(JSON.stringify({ estado: 'Nowhere' })),
        textStep(['No encontre zonas que coincidan con tu busqueda.']),
      ],
    });

    const chunks = await run(model);

    expect(model.doStreamCalls).toHaveLength(2);

    const step2Prompt = JSON.stringify(model.doStreamCalls[1].prompt);
    expect(step2Prompt).not.toContain('Zona Carabobo Centro');
    expect(step2Prompt).toContain('[]');

    expect(chunks.join('')).toContain('No encontre');
  });

  it('streams the answer as incremental text chunks', async () => {
    storeState.locations = [loc()];
    const model = new MockLanguageModelV4({
      doStream: [
        toolCallStep(JSON.stringify({ categoria: 'agua' })),
        textStep(['Hay ', 'agua ', 'pendiente ', 'en ', 'Valencia.']),
      ],
    });

    const chunks = await run(model);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe('Hay agua pendiente en Valencia.');
  });
});
