/**
 * Tests for the fuente_reporte and tipo_construccion report metadata fields.
 * Covers schema validation, memory store persistence, and label constants.
 */
import { describe, expect, it } from 'vitest';

import { createLocationSchema, fuenteReporteSchema } from '@/lib/data/schemas';
import { createMemoryStore } from '@/lib/data/memory-store';
import { FUENTE_REPORTE, FUENTE_REPORTE_LABELS } from '@/lib/data/types';

describe('FUENTE_REPORTE constant', () => {
  it('contains exactly 5 values', () => {
    expect(FUENTE_REPORTE).toHaveLength(5);
  });

  it('contains all expected source values', () => {
    expect(FUENTE_REPORTE).toContain('vecino');
    expect(FUENTE_REPORTE).toContain('video');
    expect(FUENTE_REPORTE).toContain('noticia');
    expect(FUENTE_REPORTE).toContain('organismo');
    expect(FUENTE_REPORTE).toContain('otro');
  });
});

describe('FUENTE_REPORTE_LABELS', () => {
  it('has a label for every fuente value', () => {
    for (const val of FUENTE_REPORTE) {
      expect(FUENTE_REPORTE_LABELS[val]).toBeTruthy();
    }
  });

  it('maps organismo to "Organismo oficial"', () => {
    expect(FUENTE_REPORTE_LABELS['organismo']).toBe('Organismo oficial');
  });

  it('maps all remaining values', () => {
    expect(FUENTE_REPORTE_LABELS['vecino']).toBe('Vecino');
    expect(FUENTE_REPORTE_LABELS['video']).toBe('Video');
    expect(FUENTE_REPORTE_LABELS['noticia']).toBe('Noticia');
    expect(FUENTE_REPORTE_LABELS['otro']).toBe('Otro');
  });
});

describe('fuenteReporteSchema', () => {
  it('accepts a valid fuente', () => {
    expect(fuenteReporteSchema.parse('organismo')).toBe('organismo');
  });

  it('rejects an invalid fuente', () => {
    expect(() => fuenteReporteSchema.parse('wikipedia')).toThrow();
  });

  it('maps empty string to undefined', () => {
    expect(fuenteReporteSchema.parse('')).toBeUndefined();
  });

  it('accepts undefined (absent field)', () => {
    expect(fuenteReporteSchema.parse(undefined)).toBeUndefined();
  });

  it('accepts null as undefined', () => {
    expect(fuenteReporteSchema.parse(null)).toBeUndefined();
  });
});

describe('createLocationSchema - fuente_reporte and tipo_construccion', () => {
  const base = {
    nombre: 'Edificio Prueba',
    estado: 'Aragua',
    ciudad: 'Maracay',
    status: 'dano_parcial' as const,
    personas_atrapadas: 'no_se' as const,
  };

  it('accepts valid fuente_reporte', () => {
    const result = createLocationSchema.parse({
      ...base,
      fuente_reporte: 'organismo',
    });
    expect(result.fuente_reporte).toBe('organismo');
  });

  it('rejects invalid fuente_reporte', () => {
    expect(() =>
      createLocationSchema.parse({ ...base, fuente_reporte: 'wikipedia' }),
    ).toThrow();
  });

  it('maps empty fuente_reporte to undefined', () => {
    const result = createLocationSchema.parse({ ...base, fuente_reporte: '' });
    expect(result.fuente_reporte).toBeUndefined();
  });

  it('accepts absent fuente_reporte', () => {
    const result = createLocationSchema.parse(base);
    expect(result.fuente_reporte).toBeUndefined();
  });

  it('accepts absent tipo_construccion', () => {
    const result = createLocationSchema.parse(base);
    expect(result.tipo_construccion).toBeUndefined();
  });

  it('rejects tipo_construccion over 200 characters', () => {
    expect(() =>
      createLocationSchema.parse({
        ...base,
        tipo_construccion: 'a'.repeat(201),
      }),
    ).toThrow();
  });

  it('stores tipo_construccion HTML as a plain string without interpretation', () => {
    const result = createLocationSchema.parse({
      ...base,
      tipo_construccion: '<b>casa</b>',
    });
    expect(result.tipo_construccion).toBe('<b>casa</b>');
  });

  it('accepts null fuente_reporte (maps to undefined in schema)', () => {
    const result = createLocationSchema.parse({ ...base, fuente_reporte: null });
    expect(result.fuente_reporte).toBeUndefined();
  });
});

describe('memory store - fuente_reporte and tipo_construccion', () => {
  const baseInput = {
    nombre: 'Edificio Prueba',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    status: 'dano_parcial' as const,
  };

  it('persists fuente_reporte when provided', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      ...baseInput,
      fuente_reporte: 'vecino',
    });
    expect(created.fuente_reporte).toBe('vecino');
    const detail = await store.getLocation(created.id);
    expect(detail?.fuente_reporte).toBe('vecino');
  });

  it('persists tipo_construccion when provided', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation({
      ...baseInput,
      tipo_construccion: 'edificio de concreto',
    });
    expect(created.tipo_construccion).toBe('edificio de concreto');
    const detail = await store.getLocation(created.id);
    expect(detail?.tipo_construccion).toBe('edificio de concreto');
  });

  it('stores null when fuente_reporte is absent', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation(baseInput);
    expect(created.fuente_reporte).toBeNull();
  });

  it('stores null when tipo_construccion is absent', async () => {
    const store = createMemoryStore({ locations: [], needs: [] });
    const created = await store.createLocation(baseInput);
    expect(created.tipo_construccion).toBeNull();
  });
});
