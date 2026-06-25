import { describe, expect, it } from 'vitest';

import { createLocationSchema } from '@/lib/data/schemas';
import { createMemoryStore } from '@/lib/data/memory-store';
import { toLocation } from '@/lib/data/supabase-store';
import { MAX_FOTOS } from '@/lib/data/types';

const DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

const baseLocation = {
  nombre: 'Edificio San Bernardino',
  estado: 'Distrito Capital',
  ciudad: 'Caracas',
  status: 'derrumbe' as const,
};

describe('createLocationSchema fotos', () => {
  it('accepts a valid array of https URLs', () => {
    const result = createLocationSchema.safeParse({
      ...baseLocation,
      fotos: ['https://x/a.jpg', 'https://x/b.jpg'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a data: image URL', () => {
    const result = createLocationSchema.safeParse({
      ...baseLocation,
      fotos: [DATA_URL],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than MAX_FOTOS items', () => {
    const tooMany = Array.from({ length: MAX_FOTOS + 1 }, (_, i) => `https://x/${i}.jpg`);
    const result = createLocationSchema.safeParse({
      ...baseLocation,
      fotos: tooMany,
    });
    expect(result.success).toBe(false);
  });

  it('accepts omitted fotos', () => {
    const result = createLocationSchema.safeParse(baseLocation);
    expect(result.success).toBe(true);
  });
});

describe('memory store fotos', () => {
  it('keeps the fotos passed in createLocation', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      ...baseLocation,
      fotos: ['https://x/a.jpg'],
    });
    expect(created.fotos).toEqual(['https://x/a.jpg']);
  });

  it('defaults fotos to an empty array when omitted', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation(baseLocation);
    expect(created.fotos).toEqual([]);
  });
});

describe('supabase toLocation fotos mapping', () => {
  const row = {
    id: 'id-1',
    nombre: 'Zona',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    zona: null,
    lat: null,
    lng: null,
    status: 'danado',
    descripcion: null,
    contacto_nombre: null,
    contacto_telefono: null,
    created_at: '2026-06-25T00:00:00Z',
    updated_at: '2026-06-25T00:00:00Z',
  };

  it('maps a null fotos column to an empty array', () => {
    const mapped = toLocation({ ...row, fotos: null });
    expect(mapped.fotos).toEqual([]);
  });

  it('preserves a populated fotos column', () => {
    const mapped = toLocation({ ...row, fotos: ['u'] });
    expect(mapped.fotos).toEqual(['u']);
  });
});
