import { describe, expect, it } from 'vitest';

import {
  avisoSourceRef,
  buildNeedDescripcion,
  clampCiudad,
  clampNombre,
  clampZona,
  isImportableAviso,
  mapCategoria,
  needSourceRef,
  normalizeEstado,
  transformAviso,
} from '../scripts/vzlayuda-transform.mjs';

const NEED_CATEGORIES = new Set([
  'rescate',
  'agua',
  'alimentos',
  'medicinas',
  'refugio',
  'ropa',
  'higiene',
  'energia',
  'herramientas',
  'transporte',
  'comunicacion',
  'otro',
]);

describe('normalizeEstado', () => {
  it('passes through canonical Venezuelan state names', () => {
    expect(normalizeEstado('Miranda')).toBe('Miranda');
    expect(normalizeEstado('Zulia')).toBe('Zulia');
    expect(normalizeEstado('Carabobo')).toBe('Carabobo');
  });

  it('maps Caracas (city used as estado) to Distrito Capital', () => {
    expect(normalizeEstado('Caracas')).toBe('Distrito Capital');
  });

  it('maps the legacy Vargas alias to La Guaira', () => {
    expect(normalizeEstado('Vargas')).toBe('La Guaira');
  });

  it('falls back to Distrito Capital for unknown values', () => {
    expect(normalizeEstado('')).toBe('Distrito Capital');
    expect(normalizeEstado(null)).toBe('Distrito Capital');
  });
});

describe('clampNombre', () => {
  it('passes through a normal titulo', () => {
    expect(clampNombre('Necesito techo para familia')).toBe('Necesito techo para familia');
  });

  it('uses fallback Solicitud de ayuda for too-short names', () => {
    expect(clampNombre('AB')).toBe('Solicitud de ayuda');
    expect(clampNombre('')).toBe('Solicitud de ayuda');
    expect(clampNombre(null)).toBe('Solicitud de ayuda');
  });

  it('truncates names longer than 120 chars', () => {
    expect(clampNombre('x'.repeat(200)).length).toBe(120);
  });
});

describe('clampCiudad', () => {
  it('passes through a normal city name', () => {
    expect(clampCiudad('Valencia')).toBe('Valencia');
  });

  it('returns Desconocida for empty or missing city', () => {
    expect(clampCiudad('')).toBe('Desconocida');
    expect(clampCiudad(null)).toBe('Desconocida');
  });
});

describe('clampZona', () => {
  it('returns the trimmed zona when present', () => {
    expect(clampZona('  El Paraiso  ')).toBe('El Paraiso');
  });

  it('truncates zona longer than 120 chars', () => {
    const zona = clampZona('x'.repeat(200));
    expect(zona?.length).toBe(120);
  });

  it('returns null for empty or missing zona', () => {
    expect(clampZona('')).toBeNull();
    expect(clampZona(null)).toBeNull();
    expect(clampZona('   ')).toBeNull();
  });
});

describe('mapCategoria', () => {
  it('subcategoria override: agua potable -> agua', () => {
    expect(mapCategoria('salud', 'agua potable')).toBe('agua');
  });

  it('subcategoria override: medicamentos -> medicinas', () => {
    expect(mapCategoria('salud', 'medicamentos')).toBe('medicinas');
  });

  it('subcategoria override: medico -> medicinas', () => {
    expect(mapCategoria('otro', 'medico')).toBe('medicinas');
  });

  it('subcategoria override: primeros auxilios -> medicinas', () => {
    expect(mapCategoria('alimentos', 'primeros auxilios')).toBe('medicinas');
  });

  it('subcategoria override: traslado de personas -> transporte', () => {
    expect(mapCategoria('otro', 'traslado de personas')).toBe('transporte');
  });

  it('subcategoria override: busco alojamiento -> refugio', () => {
    expect(mapCategoria('otro', 'busco alojamiento')).toBe('refugio');
  });

  it('subcategoria override: viveres -> alimentos', () => {
    expect(mapCategoria('otro', 'viveres')).toBe('alimentos');
  });

  it('subcategoria override: electricidad -> energia', () => {
    expect(mapCategoria('otro', 'electricidad')).toBe('energia');
  });

  it('uses categoria base map when subcategoria does not match', () => {
    expect(mapCategoria('salud', '')).toBe('medicinas');
    expect(mapCategoria('alimentos', '')).toBe('alimentos');
    expect(mapCategoria('transporte', null)).toBe('transporte');
    expect(mapCategoria('alojamiento', null)).toBe('refugio');
    expect(mapCategoria('comunicacion', null)).toBe('comunicacion');
    expect(mapCategoria('materiales', null)).toBe('otro');
    expect(mapCategoria('estructural', null)).toBe('otro');
    expect(mapCategoria('exterior', null)).toBe('otro');
    expect(mapCategoria('oficios', null)).toBe('otro');
    expect(mapCategoria('mascotas', null)).toBe('otro');
  });

  it('defaults to otro for unknown categoria and unmatched subcategoria', () => {
    expect(mapCategoria('desconocido', null)).toBe('otro');
    expect(mapCategoria(null, null)).toBe('otro');
  });

  it('every possible output value is in NEED_CATEGORIES', () => {
    const cases: [string | null, string | null][] = [
      ['salud', 'agua potable'],
      ['salud', 'medicamentos'],
      ['salud', 'medico'],
      ['salud', 'primeros auxilios'],
      ['otro', 'traslado de personas'],
      ['otro', 'busco alojamiento'],
      ['otro', 'viveres'],
      ['otro', 'electricidad'],
      ['salud', ''],
      ['alimentos', null],
      ['transporte', null],
      ['alojamiento', null],
      ['comunicacion', null],
      ['materiales', null],
      ['estructural', null],
      ['exterior', null],
      ['oficios', null],
      ['mascotas', null],
      ['desconocido', null],
      [null, null],
    ];
    for (const [cat, sub] of cases) {
      expect(NEED_CATEGORIES.has(mapCategoria(cat, sub))).toBe(true);
    }
  });
});

describe('buildNeedDescripcion', () => {
  it('joins titulo, descripcion and subcategoria filtering empty parts', () => {
    expect(buildNeedDescripcion('Titulo', 'Descripcion', 'Sub')).toBe('Titulo - Descripcion - Sub');
  });

  it('skips empty parts', () => {
    expect(buildNeedDescripcion('Titulo', '', 'Sub')).toBe('Titulo - Sub');
    expect(buildNeedDescripcion('Titulo', '', '')).toBe('Titulo');
    expect(buildNeedDescripcion('', 'Descripcion', '')).toBe('Descripcion');
  });

  it('falls back to Solicitud de ayuda when all parts are empty', () => {
    expect(buildNeedDescripcion('', '', '')).toBe('Solicitud de ayuda');
    expect(buildNeedDescripcion(null, null, null)).toBe('Solicitud de ayuda');
  });

  it('truncates to 1000 chars max', () => {
    const d = buildNeedDescripcion('x'.repeat(2000), '', '');
    expect(d.length).toBeLessThanOrEqual(1000);
  });
});

describe('avisoSourceRef', () => {
  it('builds a stable location source ref from the aviso id', () => {
    expect(avisoSourceRef('abc-uuid-123')).toBe('vzlayuda:abc-uuid-123');
  });
});

describe('needSourceRef', () => {
  it('builds a stable need source ref from the aviso id', () => {
    expect(needSourceRef('abc-uuid-123')).toBe('vzlayuda:need:abc-uuid-123');
  });
});

describe('transformAviso', () => {
  const aviso = {
    id: 'aviso-uuid-1',
    tipo: 'necesidad',
    categorias: ['alimentos'],
    subcategoria: 'viveres',
    descripcion: 'Necesito comida para familia de 5',
    estado: 'Miranda',
    ciudad: 'Guarenas',
    zona: 'Sector Norte',
    titulo: 'Comida urgente',
    nombre: 'Juan Perez',
    es_negocio: false,
    nombre_negocio: null,
    tipo_ayuda: null,
    creado_en: '2026-06-01T00:00:00Z',
    expira_en: null,
  };

  it('produces a location payload with no coordinates and desconocido status', () => {
    const out = transformAviso(aviso);
    expect(out.location.nombre).toBe('Comida urgente');
    expect(out.location.estado).toBe('Miranda');
    expect(out.location.ciudad).toBe('Guarenas');
    expect(out.location.zona).toBe('Sector Norte');
    expect(out.location.lat).toBeNull();
    expect(out.location.lng).toBeNull();
    expect(out.location.status).toBe('desconocido');
    expect(out.location.fotos).toEqual([]);
  });

  it('never includes contact info (gated at source)', () => {
    const out = transformAviso(aviso);
    expect(out.location.contacto_nombre).toBeNull();
    expect(out.location.contacto_telefono).toBeNull();
  });

  it('produces a need payload with correct categoria, urgencia and status', () => {
    const out = transformAviso(aviso);
    expect(out.need.categoria).toBe('alimentos');
    expect(out.need.urgencia).toBe('media');
    expect(out.need.status).toBe('pendiente');
    expect(out.need.cantidad).toBeNull();
  });

  it('sets stable source refs for location and need', () => {
    const out = transformAviso(aviso);
    expect(out.sourceRef).toBe('vzlayuda:aviso-uuid-1');
    expect(out.needSourceRef).toBe('vzlayuda:need:aviso-uuid-1');
  });
});

describe('isImportableAviso', () => {
  it('accepts a necesidad with a titulo', () => {
    expect(
      isImportableAviso({ tipo: 'necesidad', titulo: 'Necesito agua', descripcion: null }),
    ).toBe(true);
  });

  it('accepts a necesidad with only a descripcion and no titulo', () => {
    expect(
      isImportableAviso({ tipo: 'necesidad', titulo: '', descripcion: 'Descripcion' }),
    ).toBe(true);
  });

  it('rejects an oferta regardless of content', () => {
    expect(
      isImportableAviso({ tipo: 'oferta', titulo: 'Ofrezco agua', descripcion: 'Descripcion' }),
    ).toBe(false);
  });

  it('rejects a necesidad with no titulo AND no descripcion', () => {
    expect(isImportableAviso({ tipo: 'necesidad', titulo: '', descripcion: '' })).toBe(false);
    expect(isImportableAviso({ tipo: 'necesidad', titulo: null, descripcion: null })).toBe(false);
  });
});
