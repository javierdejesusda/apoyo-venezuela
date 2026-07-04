import { describe, expect, it } from 'vitest';

import { computeResizeDimensions, FOTO_MAX_EDGE } from '@/lib/data/foto-resize';

describe('computeResizeDimensions', () => {
  it('scales a landscape photo so its longest edge hits the cap', () => {
    expect(computeResizeDimensions(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it('scales a portrait photo so its longest edge hits the cap', () => {
    expect(computeResizeDimensions(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('never upscales a photo already smaller than the cap', () => {
    expect(computeResizeDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it('leaves a photo whose longest edge equals the cap unchanged', () => {
    expect(computeResizeDimensions(1600, 900, 1600)).toEqual({ width: 1600, height: 900 });
  });

  it('rounds fractional dimensions to whole pixels', () => {
    expect(computeResizeDimensions(1000, 333, 500)).toEqual({ width: 500, height: 167 });
  });

  it('handles a square photo', () => {
    expect(computeResizeDimensions(3000, 3000, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('returns zero dimensions untouched rather than dividing by zero', () => {
    expect(computeResizeDimensions(0, 0, 1600)).toEqual({ width: 0, height: 0 });
  });

  it('defaults to the shared FOTO_MAX_EDGE cap', () => {
    expect(computeResizeDimensions(FOTO_MAX_EDGE * 2, FOTO_MAX_EDGE * 2)).toEqual({
      width: FOTO_MAX_EDGE,
      height: FOTO_MAX_EDGE,
    });
  });
});
