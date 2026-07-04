import { describe, expect, it } from 'vitest';

import {
  buildDescripcion,
  clampCiudad,
  clampNombre,
  clampZona,
  cleanPhone,
  inferNeedCategoria,
  locationSourceRef,
  needSourceRef,
  normalizeEstado,
  pickPhone,
  SOURCE_PREFIX,
  transformRefugio,
} from '../scripts/refugios-transform.mjs';

interface RefugioRecord {
  id: string;
  name?: string | null;
  type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  capacity?: number | null;
  current_occupancy?: number | null;
  status?: string | null;
  managed_by?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  has_water?: boolean;
  has_food?: boolean;
  has_medical?: boolean;
  has_electricity?: boolean;
  pets_allowed?: boolean;
  notes?: string | null;
  reporter_name?: string | null;
  reporter_contact?: string | null;
  verified?: boolean;
  kind?: string | null;
  food_type?: string | null;
  schedule?: string | null;
  needs?: string | null;
}

function baseRefugio(overrides: Partial<RefugioRecord> = {}): RefugioRecord {
  return {
    id: 'uuid-1',
    name: 'Parque Ali Primera',
    type: 'centro_comunitario',
    address: 'Caminera Paralela, Catia',
    city: 'Caracas',
    state: 'Distrito Capital',
    latitude: 10.5148,
    longitude: -66.9405,
    capacity: 500,
    current_occupancy: 0,
    status: 'activo',
    managed_by: null,
    contact_phone: null,
    contact_whatsapp: null,
    has_water: false,
    has_food: false,
    has_medical: false,
    has_electricity: false,
    pets_allowed: false,
    notes: 'Activado para recepcion de personas.',
    reporter_name: 'Alving Garcia Marcano',
    reporter_contact: '04120000000',
    verified: false,
    kind: 'refugio',
    food_type: null,
    schedule: null,
    needs: null,
    ...overrides,
  };
}

describe('normalizeEstado', () => {
  it('passes through canonical Venezuelan state names', () => {
    expect(normalizeEstado('Distrito Capital')).toBe('Distrito Capital');
    expect(normalizeEstado('Miranda')).toBe('Miranda');
    expect(normalizeEstado('Zulia')).toBe('Zulia');
  });

  it('normalizes case and accents', () => {
    expect(normalizeEstado('miranda')).toBe('Miranda');
    expect(normalizeEstado('BOLIVAR')).toBe('Bolívar');
  });

  it('maps the legacy Vargas alias to La Guaira', () => {
    expect(normalizeEstado('Vargas')).toBe('La Guaira');
  });

  it('falls back to Distrito Capital for unknown or empty values', () => {
    expect(normalizeEstado('')).toBe('Distrito Capital');
    expect(normalizeEstado(null)).toBe('Distrito Capital');
    expect(normalizeEstado('Narnia')).toBe('Distrito Capital');
  });
});

describe('clampNombre', () => {
  it('passes through a normal shelter name', () => {
    expect(clampNombre('Parque Ali Primera')).toBe('Parque Ali Primera');
  });

  it('uses fallback for too-short or missing names', () => {
    expect(clampNombre('AB')).toBe('Centro de ayuda');
    expect(clampNombre('')).toBe('Centro de ayuda');
    expect(clampNombre(null)).toBe('Centro de ayuda');
  });

  it('truncates names longer than 120 chars', () => {
    expect(clampNombre('R'.repeat(200)).length).toBe(120);
  });
});

describe('clampCiudad', () => {
  it('passes through a normal city name', () => {
    expect(clampCiudad('Caracas')).toBe('Caracas');
  });

  it('returns Desconocida for empty or missing city', () => {
    expect(clampCiudad('')).toBe('Desconocida');
    expect(clampCiudad(null)).toBe('Desconocida');
  });

  it('truncates cities longer than 80 chars', () => {
    expect(clampCiudad('C'.repeat(120)).length).toBe(80);
  });
});

describe('clampZona', () => {
  it('passes through a normal address', () => {
    expect(clampZona('Av. Jose Angel Lamas')).toBe('Av. Jose Angel Lamas');
  });

  it('returns null for empty or missing address', () => {
    expect(clampZona('')).toBeNull();
    expect(clampZona(null)).toBeNull();
    expect(clampZona(undefined)).toBeNull();
  });

  it('truncates addresses longer than 120 chars', () => {
    expect(clampZona('A'.repeat(200))?.length).toBe(120);
  });
});

describe('cleanPhone', () => {
  it('keeps a valid phone with formatting characters', () => {
    expect(cleanPhone('+584144988833')).toBe('+584144988833');
    expect(cleanPhone('0412-593-1990')).toBe('0412-593-1990');
  });

  it('collapses whitespace but keeps a valid number', () => {
    expect(cleanPhone('04125931990 0')).toBe('04125931990 0');
    expect(cleanPhone('  0412  593  1990  ')).toBe('0412 593 1990');
  });

  it('strips unicode bidi control characters', () => {
    expect(cleanPhone('‪04241234567‬')).toBe('04241234567');
  });

  it('drops letters and stray symbols before validating', () => {
    expect(cleanPhone('llamar al 04241234567')).toBe('04241234567');
  });

  it('returns null for garbage with too few digits', () => {
    expect(cleanPhone('123')).toBeNull();
    expect(cleanPhone('N/A')).toBeNull();
    expect(cleanPhone('sin telefono')).toBeNull();
  });

  it('returns null for empty or nullish input', () => {
    expect(cleanPhone('')).toBeNull();
    expect(cleanPhone(null)).toBeNull();
    expect(cleanPhone(undefined)).toBeNull();
  });
});

describe('pickPhone', () => {
  it('prefers contact_phone when valid', () => {
    expect(pickPhone({ contact_phone: '04121234567', contact_whatsapp: '04249999999' })).toBe(
      '04121234567',
    );
  });

  it('falls back to contact_whatsapp when contact_phone is absent or garbage', () => {
    expect(pickPhone({ contact_phone: null, contact_whatsapp: '+584144988833' })).toBe(
      '+584144988833',
    );
    expect(pickPhone({ contact_phone: 'N/A', contact_whatsapp: '04249999999' })).toBe(
      '04249999999',
    );
  });

  it('returns null when neither number is usable', () => {
    expect(pickPhone({ contact_phone: null, contact_whatsapp: null })).toBeNull();
    expect(pickPhone({ contact_phone: '', contact_whatsapp: 'abc' })).toBeNull();
  });
});

describe('inferNeedCategoria', () => {
  it('defaults to alimentos for food-center supply text', () => {
    expect(inferNeedCategoria('Harina pan, pasta, proteinas, carne molida, agua.')).toBe(
      'alimentos',
    );
  });

  it('detects medicinas from medical supply text', () => {
    expect(inferNeedCategoria('Se necesitan medicamentos y vendas')).toBe('medicinas');
  });

  it('detects higiene from hygiene supply text', () => {
    expect(inferNeedCategoria('Panales y jabon para bebes')).toBe('higiene');
  });

  it('detects ropa from clothing supply text', () => {
    expect(inferNeedCategoria('Cobijas y ropa de abrigo')).toBe('ropa');
  });

  it('defaults to alimentos for empty or unclassifiable text', () => {
    expect(inferNeedCategoria('')).toBe('alimentos');
    expect(inferNeedCategoria(null)).toBe('alimentos');
    expect(inferNeedCategoria('voluntarios para logistica')).toBe('alimentos');
  });
});

describe('buildDescripcion', () => {
  it('returns notes alone when no amenities or capacity', () => {
    expect(buildDescripcion(baseRefugio({ capacity: null, notes: 'Solo texto.' }))).toBe(
      'Solo texto.',
    );
  });

  it('enriches notes with amenities and capacity', () => {
    const d = buildDescripcion(
      baseRefugio({ notes: 'Refugio activo.', has_water: true, has_food: true, capacity: 500 }),
    );
    expect(d).toContain('Refugio activo.');
    expect(d).toContain('Servicios:');
    expect(d).toContain('Capacidad: 500');
  });

  it('builds a description from amenities even when notes are empty', () => {
    const d = buildDescripcion(baseRefugio({ notes: null, capacity: null, has_medical: true }));
    expect(d).toContain('Servicios:');
  });

  it('returns null when there is nothing to describe', () => {
    expect(buildDescripcion(baseRefugio({ notes: null, capacity: null }))).toBeNull();
  });

  it('ignores zero or negative capacity', () => {
    const d = buildDescripcion(baseRefugio({ notes: 'x'.repeat(5), capacity: 0 }));
    expect(d).not.toContain('Capacidad');
  });

  it('truncates very long descriptions', () => {
    const d = buildDescripcion(baseRefugio({ notes: 'n'.repeat(2000) }));
    expect((d ?? '').length).toBeLessThanOrEqual(1000);
  });
});

describe('source ref builders', () => {
  it('exposes the refugios source prefix', () => {
    expect(SOURCE_PREFIX).toBe('refugios');
  });

  it('builds a stable location source ref', () => {
    expect(locationSourceRef('abc-123')).toBe('refugios:abc-123');
  });

  it('builds a stable need source ref', () => {
    expect(needSourceRef('abc-123')).toBe('refugios:need:abc-123');
  });
});

describe('transformRefugio', () => {
  it('maps a refugio into a location with no need', () => {
    const result = transformRefugio(baseRefugio());
    expect(result.location.nombre).toBe('Parque Ali Primera');
    expect(result.location.estado).toBe('Distrito Capital');
    expect(result.location.ciudad).toBe('Caracas');
    expect(result.location.zona).toBe('Caminera Paralela, Catia');
    expect(result.location.status).toBe('desconocido');
    expect(result.location.fotos).toEqual([]);
    expect(result.need).toBeNull();
  });

  it('carries the location and need source refs keyed by id', () => {
    const result = transformRefugio(baseRefugio({ id: 'xyz' }));
    expect(result.sourceRef).toBe('refugios:xyz');
    expect(result.needSourceRef).toBe('refugios:need:xyz');
  });

  it('ALWAYS sets contacto_nombre to null and drops reporter PII', () => {
    const result = transformRefugio(
      baseRefugio({ reporter_name: 'Persona Real', reporter_contact: '04120001111' }),
    );
    expect(result.location.contacto_nombre).toBeNull();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('Persona Real');
    expect(serialized).not.toContain('04120001111');
  });

  it('uses the institutional aid line as contacto_telefono', () => {
    const result = transformRefugio(
      baseRefugio({ contact_phone: '04121234567', contact_whatsapp: null }),
    );
    expect(result.location.contacto_telefono).toBe('04121234567');
  });

  it('falls back to whatsapp when contact_phone is missing', () => {
    const result = transformRefugio(
      baseRefugio({ contact_phone: null, contact_whatsapp: '+584144988833' }),
    );
    expect(result.location.contacto_telefono).toBe('+584144988833');
  });

  it('passes lat/lng through as numbers, null when absent', () => {
    const withCoords = transformRefugio(baseRefugio({ latitude: 10.5, longitude: -66.9 }));
    expect(withCoords.location.lat).toBe(10.5);
    expect(withCoords.location.lng).toBe(-66.9);

    const noCoords = transformRefugio(baseRefugio({ latitude: null, longitude: null }));
    expect(noCoords.location.lat).toBeNull();
    expect(noCoords.location.lng).toBeNull();
  });

  it('parses numeric coordinates supplied as strings', () => {
    const result = transformRefugio(baseRefugio({ latitude: '10.5', longitude: '-66.9' }));
    expect(result.location.lat).toBe(10.5);
    expect(result.location.lng).toBe(-66.9);
  });

  it('emits a need for a comida record with non-empty needs text', () => {
    const result = transformRefugio(
      baseRefugio({
        id: 'comida-1',
        kind: 'comida',
        needs: 'Harina pan, pasta, agua.',
      }),
    );
    expect(result.need).not.toBeNull();
    expect(result.need?.categoria).toBe('alimentos');
    expect(result.need?.descripcion).toBe('Harina pan, pasta, agua.');
    expect(result.need?.cantidad).toBeNull();
    expect(result.need?.urgencia).toBe('media');
    expect(result.need?.status).toBe('pendiente');
    expect(result.needSourceRef).toBe('refugios:need:comida-1');
  });

  it('does NOT emit a need for a comida record with empty or null needs', () => {
    expect(transformRefugio(baseRefugio({ kind: 'comida', needs: null })).need).toBeNull();
    expect(transformRefugio(baseRefugio({ kind: 'comida', needs: '   ' })).need).toBeNull();
  });

  it('does NOT emit a need for a refugio record even if needs text is present', () => {
    const result = transformRefugio(
      baseRefugio({ kind: 'refugio', needs: 'agua y comida' }),
    );
    expect(result.need).toBeNull();
  });

  it('clamps a very long need description', () => {
    const result = transformRefugio(
      baseRefugio({ kind: 'comida', needs: 'a'.repeat(2000) }),
    );
    expect((result.need?.descripcion ?? '').length).toBeLessThanOrEqual(1000);
  });

  it('falls back to Desconocida ciudad and null zona when address/city missing', () => {
    const result = transformRefugio(baseRefugio({ city: null, address: null }));
    expect(result.location.ciudad).toBe('Desconocida');
    expect(result.location.zona).toBeNull();
  });
});
