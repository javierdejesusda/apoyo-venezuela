import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { resizeToWebp } from '@/scripts/lib/image-resize.mjs';

/** Build a solid-color raw image of the given size for a deterministic input. */
function makeImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 120, b: 200 } },
  })
    .png()
    .toBuffer();
}

describe('resizeToWebp', () => {
  it('downscales a large landscape image to the max edge and encodes WebP', async () => {
    const out = await resizeToWebp(await makeImage(2400, 1800), { maxEdge: 1600 });
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(1200);
  });

  it('downscales a large portrait image by its longest edge', async () => {
    const out = await resizeToWebp(await makeImage(1800, 2400), { maxEdge: 1600 });
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(1600);
  });

  it('never upscales an image already within the cap', async () => {
    const out = await resizeToWebp(await makeImage(400, 300), { maxEdge: 1600 });
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(300);
  });

  it('rejects a buffer that is not a decodable image', async () => {
    await expect(resizeToWebp(Buffer.from('not an image'))).rejects.toThrow();
  });
});
