import { describe, expect, it } from 'vitest';

import { computePreviewPlacement, excerpt } from '@/lib/map/preview';

describe('excerpt', () => {
  it('returns short text untouched (trimmed)', () => {
    expect(excerpt('  hola  ', 20)).toBe('hola');
  });

  it('truncates at a word boundary with an ellipsis', () => {
    expect(excerpt('el edificio colapso por completo anoche', 20)).toBe(
      'el edificio colapso…',
    );
  });

  it('handles empty or missing text', () => {
    expect(excerpt('', 10)).toBe('');
    expect(excerpt(undefined, 10)).toBe('');
  });
});

describe('computePreviewPlacement', () => {
  const card = { width: 200, height: 120 };
  const viewport = { width: 800, height: 600 };
  const gap = 12;

  it('centers the card above the anchor when there is room', () => {
    const p = computePreviewPlacement({ anchor: { x: 400, y: 300 }, card, viewport, gap });
    expect(p.placement).toBe('above');
    expect(p.left).toBe(300); // 400 - 200/2
    expect(p.top).toBe(168); // 300 - 12 - 120
  });

  it('flips below the anchor when there is not enough room above', () => {
    const p = computePreviewPlacement({ anchor: { x: 400, y: 40 }, card, viewport, gap });
    expect(p.placement).toBe('below');
    expect(p.top).toBe(52); // 40 + 12
  });

  it('clamps the card inside the right edge of the viewport', () => {
    const p = computePreviewPlacement({ anchor: { x: 790, y: 300 }, card, viewport, gap });
    expect(p.left).toBe(viewport.width - card.width - 8); // 592
  });

  it('clamps the card inside the left edge of the viewport', () => {
    const p = computePreviewPlacement({ anchor: { x: 5, y: 300 }, card, viewport, gap });
    expect(p.left).toBe(8);
  });
});
