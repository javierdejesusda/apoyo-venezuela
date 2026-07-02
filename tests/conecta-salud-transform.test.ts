import { describe, expect, it } from 'vitest';

import {
  buildCantidad,
  buildNeedDescripcion,
  clampCiudad,
  clampNombre,
  cleanPhone,
  hospitalSourceRef,
  mapHospitals,
  mapUrgencia,
  needSourceRef,
  normalizeEstado,
} from '../scripts/conecta-salud-transform.mjs';

describe('normalizeEstado', () => {
  it('passes through canonical Venezuelan state names', () => {
    expect(normalizeEstado('Distrito Capital')).toBe('Distrito Capital');
    expect(normalizeEstado('Miranda')).toBe('Miranda');
    expect(normalizeEstado('Zulia')).toBe('Zulia');
  });

  it('maps Caracas to Distrito Capital (city used as estado in source data)', () => {
    expect(normalizeEstado('Caracas')).toBe('Distrito Capital');
  });

  it('maps the legacy Vargas alias to La Guaira', () => {
    expect(normalizeEstado('Vargas')).toBe('La Guaira');
  });

  it('falls back to Distrito Capital for unknown or empty values', () => {
    expect(normalizeEstado('')).toBe('Distrito Capital');
    expect(normalizeEstado(null)).toBe('Distrito Capital');
    expect(normalizeEstado('Unknown')).toBe('Distrito Capital');
  });
});

describe('clampNombre', () => {
  it('passes through a normal hospital name', () => {
    expect(clampNombre('Hospital Vargas de Caracas')).toBe('Hospital Vargas de Caracas');
  });

  it('uses fallback Centro de salud for too-short names', () => {
    expect(clampNombre('AB')).toBe('Centro de salud');
    expect(clampNombre('')).toBe('Centro de salud');
    expect(clampNombre(null)).toBe('Centro de salud');
  });

  it('truncates names longer than 120 chars', () => {
    const long = 'H'.repeat(200);
    expect(clampNombre(long).length).toBe(120);
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
});

describe('cleanPhone', () => {
  it('strips unicode bidi control characters', () => {
    expect(cleanPhone('‪04241234567‬')).toBe('04241234567');
    expect(cleanPhone('‎0424 123 4567')).toBe('0424 123 4567');
    expect(cleanPhone('‫+58 424 1234567‬')).toBe('+58 424 1234567');
  });

  it('trims surrounding whitespace and collapses internal spaces', () => {
    expect(cleanPhone('  0424  123  4567  ')).toBe('0424 123 4567');
  });

  it('returns null for empty or nullish input', () => {
    expect(cleanPhone('')).toBeNull();
    expect(cleanPhone(null)).toBeNull();
    expect(cleanPhone(undefined)).toBeNull();
  });
});

describe('mapUrgencia', () => {
  it('maps urgente to alta', () => {
    expect(mapUrgencia('urgente')).toBe('alta');
  });

  it('keeps alta as alta', () => {
    expect(mapUrgencia('alta')).toBe('alta');
  });

  it('maps mediana to media', () => {
    expect(mapUrgencia('mediana')).toBe('media');
  });

  it('defaults to media for unknown or empty values', () => {
    expect(mapUrgencia('')).toBe('media');
    expect(mapUrgencia(null)).toBe('media');
    expect(mapUrgencia('baja')).toBe('media');
  });
});

describe('buildNeedDescripcion', () => {
  it('joins insumo and notas with a dash separator', () => {
    expect(buildNeedDescripcion('Suero fisiologico', 'frascos de 500ml')).toBe(
      'Suero fisiologico - frascos de 500ml',
    );
  });

  it('returns insumo alone when notas is empty or null', () => {
    expect(buildNeedDescripcion('Guantes', '')).toBe('Guantes');
    expect(buildNeedDescripcion('Guantes', null)).toBe('Guantes');
  });

  it('falls back to Insumo medico when both insumo and notas are empty', () => {
    expect(buildNeedDescripcion('', '')).toBe('Insumo medico');
    expect(buildNeedDescripcion(null, null)).toBe('Insumo medico');
  });

  it('truncates to 1000 chars max', () => {
    const d = buildNeedDescripcion('Insumo', 'n'.repeat(2000));
    expect(d.length).toBeLessThanOrEqual(1000);
  });
});

describe('buildCantidad', () => {
  it('returns the trimmed string for a non-empty quantity', () => {
    expect(buildCantidad('50 unidades')).toBe('50 unidades');
    expect(buildCantidad('  10  ')).toBe('10');
  });

  it('returns undefined for empty, null, or undefined quantity', () => {
    expect(buildCantidad('')).toBeUndefined();
    expect(buildCantidad(null)).toBeUndefined();
    expect(buildCantidad(undefined)).toBeUndefined();
  });
});

describe('hospitalSourceRef', () => {
  it('builds a stable slug-based source ref', () => {
    expect(hospitalSourceRef('hospital-vargas')).toBe('conecta-salud:hosp:hospital-vargas');
  });
});

describe('needSourceRef', () => {
  it('builds a stable uuid-based source ref', () => {
    expect(needSourceRef('abc-123-uuid')).toBe('conecta-salud:need:abc-123-uuid');
  });
});

describe('mapHospitals', () => {
  const rows = [
    {
      id: 'uuid-1',
      hospital: 'Hospital Vargas',
      estado: 'Distrito Capital',
      ciudad: 'Caracas',
      insumo: 'Gasas',
      cantidad: '100',
      urgencia: 'alta',
      contacto: '04241000001',
      contacto_oculto: false,
      notas: null,
    },
    {
      id: 'uuid-2',
      hospital: 'Hospital Vargas',
      estado: 'Distrito Capital',
      ciudad: 'Caracas',
      insumo: 'Suero',
      cantidad: null,
      urgencia: 'mediana',
      contacto: '04241000002',
      contacto_oculto: true,
      notas: 'urgente 500ml',
    },
    {
      id: 'uuid-3',
      hospital: 'Clinica Caracas',
      estado: 'Miranda',
      ciudad: 'Caracas',
      insumo: 'Guantes',
      cantidad: '200',
      urgencia: 'urgente',
      contacto: null,
      contacto_oculto: false,
      notas: null,
    },
  ];

  it('groups rows by hospital into one location per distinct hospital', () => {
    const result = mapHospitals(rows);
    expect(result).toHaveLength(2);
  });

  it('uses the first non-hidden phone as contacto_telefono', () => {
    const result = mapHospitals(rows);
    const vargas = result.find((h) => h.location.nombre === 'Hospital Vargas');
    expect(vargas?.location.contacto_telefono).toBe('04241000001');
  });

  it('honors contacto_oculto and returns null when all phones are hidden', () => {
    const hiddenRows = [
      {
        id: 'uuid-4',
        hospital: 'Hospital Oculto',
        estado: 'Miranda',
        ciudad: 'Caracas',
        insumo: 'Gasas',
        cantidad: null,
        urgencia: 'alta',
        contacto: '04241999999',
        contacto_oculto: true,
        notas: null,
      },
    ];
    const result = mapHospitals(hiddenRows);
    expect(result[0].location.contacto_telefono).toBeNull();
  });

  it('fails closed when contacto_oculto is missing (unknown is treated as hidden)', () => {
    const ambiguousRows = [
      {
        id: 'uuid-5',
        hospital: 'Hospital Ambiguo',
        estado: 'Miranda',
        ciudad: 'Caracas',
        insumo: 'Gasas',
        cantidad: null,
        urgencia: 'alta',
        contacto: '04241888888',
        notas: null,
      },
    ];
    const result = mapHospitals(ambiguousRows);
    expect(result[0].location.contacto_telefono).toBeNull();
  });

  it('produces one need per source row under the hospital', () => {
    const result = mapHospitals(rows);
    const vargas = result.find((h) => h.location.nombre === 'Hospital Vargas');
    expect(vargas?.needs).toHaveLength(2);
  });

  it('assigns the correct hospital source ref', () => {
    const result = mapHospitals(rows);
    const vargas = result.find((h) => h.location.nombre === 'Hospital Vargas');
    expect(vargas?.sourceRef).toBe('conecta-salud:hosp:hospital-vargas');
  });

  it('assigns stable need source refs matching each row uuid', () => {
    const result = mapHospitals(rows);
    const vargas = result.find((h) => h.location.nombre === 'Hospital Vargas');
    const need1 = vargas?.needs.find((n: { sourceRef: string }) => n.sourceRef === 'conecta-salud:need:uuid-1');
    expect(need1).toBeDefined();
  });

  it('sets contacto_nombre to null (institution, not a person)', () => {
    const result = mapHospitals(rows);
    for (const group of result) {
      expect(group.location.contacto_nombre).toBeNull();
    }
  });
});
