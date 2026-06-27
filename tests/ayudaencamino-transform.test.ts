import { describe, expect, it } from 'vitest';

import {
  buildNeedCantidad,
  buildNeedDescripcion,
  buildOrgDescripcion,
  clampCiudad,
  clampNombre,
  isImportableNeed,
  isImportableOrg,
  mapNeedCategoria,
  mapNeedStatus,
  mapNeedUrgencia,
  needSourceRef,
  normalizeEstado,
  orgSourceRef,
  orgTipoLabel,
  transformNeed,
  transformOrg,
} from '../scripts/ayudaencamino-transform.mjs';

describe('normalizeEstado', () => {
  it('passes through the canonical Venezuelan states the source uses', () => {
    expect(normalizeEstado('Distrito Capital')).toBe('Distrito Capital');
    expect(normalizeEstado('La Guaira')).toBe('La Guaira');
    expect(normalizeEstado('Carabobo')).toBe('Carabobo');
    expect(normalizeEstado('Mérida')).toBe('Mérida');
  });

  it('repairs casing and missing accents against the canonical list', () => {
    expect(normalizeEstado('merida')).toBe('Mérida');
    expect(normalizeEstado('distrito capital')).toBe('Distrito Capital');
    expect(normalizeEstado('LA GUAIRA')).toBe('La Guaira');
  });

  it('maps the legacy Vargas alias to La Guaira', () => {
    expect(normalizeEstado('Vargas')).toBe('La Guaira');
  });

  it('falls back to Distrito Capital when nothing resolves', () => {
    expect(normalizeEstado('')).toBe('Distrito Capital');
    expect(normalizeEstado(null)).toBe('Distrito Capital');
    expect(normalizeEstado('Atlantis')).toBe('Distrito Capital');
  });
});

describe('clampNombre', () => {
  it('passes through a normal organization name', () => {
    expect(clampNombre('Coliseo La Urbina')).toBe('Coliseo La Urbina');
  });

  it('pads a too-short name to meet the 3 char minimum', () => {
    expect(clampNombre('A').length).toBeGreaterThanOrEqual(3);
  });

  it('truncates a name longer than 120 chars', () => {
    expect(clampNombre('x'.repeat(200)).length).toBe(120);
  });
});

describe('clampCiudad', () => {
  it('passes through a normal city', () => {
    expect(clampCiudad('Caracas')).toBe('Caracas');
  });

  it('falls back when the city is missing', () => {
    expect(clampCiudad('').length).toBeGreaterThanOrEqual(2);
    expect(clampCiudad(null).length).toBeGreaterThanOrEqual(2);
  });
});

describe('orgTipoLabel', () => {
  it('maps each known organization type to a Spanish label', () => {
    expect(orgTipoLabel('hospital_centro_medico')).toBe('Hospital / centro médico');
    expect(orgTipoLabel('centro_acopio')).toBe('Centro de acopio');
    expect(orgTipoLabel('refugio')).toBe('Refugio');
    expect(orgTipoLabel('voluntarios')).toBe('Voluntarios');
    expect(orgTipoLabel('lugar_afectado')).toBe('Lugar afectado');
    expect(orgTipoLabel('ong')).toBe('ONG');
  });

  it('returns a generic label for an unknown type', () => {
    expect(orgTipoLabel('algo_nuevo')).toBe('Organización');
    expect(orgTipoLabel(null)).toBe('Organización');
  });
});

describe('buildOrgDescripcion', () => {
  it('describes the org from its type, address, schedule and email without external attribution', () => {
    const d = buildOrgDescripcion(
      {
        tipo: 'centro_acopio',
        direccion: 'Calle México detrás de la clínica',
        horario: '8am - 5pm',
        contactoEmail: 'centro@example.com',
      },
    );
    expect(d).toContain('Centro de acopio');
    expect(d).toContain('Calle México');
    expect(d).toContain('8am - 5pm');
    expect(d).toContain('centro@example.com');
    expect(d?.toLowerCase()).not.toContain('ayudaencamino');
  });

  it('omits missing fields and still names the type', () => {
    const d = buildOrgDescripcion({ tipo: 'refugio', direccion: null, horario: null });
    expect(d).toContain('Refugio');
    expect(d).not.toContain('Horario');
  });

  it('truncates to 1000 chars max', () => {
    const d = buildOrgDescripcion({ tipo: 'refugio', direccion: 'x'.repeat(2000) });
    expect((d ?? '').length).toBeLessThanOrEqual(1000);
  });
});

describe('mapNeedCategoria', () => {
  it('passes through categories that exist in our schema', () => {
    for (const c of ['medicinas', 'higiene', 'alimentos', 'ropa', 'agua', 'herramientas', 'otro']) {
      expect(mapNeedCategoria(c)).toBe(c);
    }
  });

  it('falls back to otro for an unknown category', () => {
    expect(mapNeedCategoria('combustible')).toBe('otro');
    expect(mapNeedCategoria(null)).toBe('otro');
  });
});

describe('mapNeedUrgencia', () => {
  it('keeps alta and media', () => {
    expect(mapNeedUrgencia('alta')).toBe('alta');
    expect(mapNeedUrgencia('media')).toBe('media');
  });

  it('maps the source-only critica level onto our highest level alta', () => {
    expect(mapNeedUrgencia('critica')).toBe('alta');
  });

  it('defaults to media for unknown values', () => {
    expect(mapNeedUrgencia('')).toBe('media');
    expect(mapNeedUrgencia(null)).toBe('media');
  });
});

describe('mapNeedStatus', () => {
  it('maps the source need lifecycle onto ours', () => {
    expect(mapNeedStatus('activa')).toBe('pendiente');
    expect(mapNeedStatus('parcial')).toBe('en_camino');
    expect(mapNeedStatus('cumplida')).toBe('cubierto');
  });

  it('defaults to pendiente for unknown values', () => {
    expect(mapNeedStatus('')).toBe('pendiente');
    expect(mapNeedStatus(null)).toBe('pendiente');
  });
});

describe('buildNeedDescripcion', () => {
  it('combines the article name and the free-text description', () => {
    const d = buildNeedDescripcion({ nombreArticulo: 'POVEDINE', descripcion: 'Lismar Mujica' });
    expect(d).toContain('POVEDINE');
    expect(d).toContain('Lismar Mujica');
  });

  it('uses just the article name when the description is empty (51 such rows exist)', () => {
    expect(buildNeedDescripcion({ nombreArticulo: 'Colchonetas', descripcion: '' })).toBe('Colchonetas');
    expect(buildNeedDescripcion({ nombreArticulo: 'Colchonetas', descripcion: null })).toBe('Colchonetas');
  });

  it('never returns an empty string (our needs.descripcion is NOT NULL)', () => {
    expect(buildNeedDescripcion({ nombreArticulo: 'Agua', descripcion: null }).length).toBeGreaterThan(0);
  });

  it('truncates to 1000 chars max', () => {
    const d = buildNeedDescripcion({ nombreArticulo: 'Agua', descripcion: 'n'.repeat(2000) });
    expect(d.length).toBeLessThanOrEqual(1000);
  });
});

describe('buildNeedCantidad', () => {
  it('reports the needed quantity', () => {
    expect(buildNeedCantidad({ cantidadNecesaria: 50 })).toContain('50');
  });

  it('returns undefined when no quantity is recorded', () => {
    expect(buildNeedCantidad({ cantidadNecesaria: 0 })).toBeUndefined();
    expect(buildNeedCantidad({ cantidadNecesaria: null })).toBeUndefined();
  });
});

describe('source refs', () => {
  it('builds a stable per-organization ref on the ayudaencamino domain', () => {
    expect(orgSourceRef(53)).toBe('https://ayudaencamino.com/organizacion/53');
  });

  it('builds a stable per-need ref on the ayudaencamino domain', () => {
    expect(needSourceRef(71)).toBe('https://ayudaencamino.com/need/71');
  });
});

describe('isImportableOrg / isImportableNeed', () => {
  it('accepts organizations and needs with real content', () => {
    expect(isImportableOrg({ id: 1, nombre: 'Refugio X' })).toBe(true);
    expect(isImportableNeed({ id: 1, nombreArticulo: 'Agua' })).toBe(true);
  });

  it('rejects degenerate rows with no name', () => {
    expect(isImportableOrg({ id: 1, nombre: '   ' })).toBe(false);
    expect(isImportableOrg({ id: 1, nombre: null })).toBe(false);
    expect(isImportableNeed({ id: 1, nombreArticulo: '' })).toBe(false);
    expect(isImportableNeed({ id: 1, nombreArticulo: null })).toBe(false);
  });
});

describe('transformOrg', () => {
  const org = {
    id: 53,
    nombre: 'Hospital Periférico de Catia',
    tipo: 'hospital_centro_medico',
    estado: 'Distrito Capital',
    ciudad: 'Caracas',
    direccion: 'Calle Argentina, Catia',
    contactoNombre: 'Coordinación',
    contactoTelefono: '04241459437',
    contactoEmail: 'peinadomgh@gmail.com',
    horario: null,
    verificada: true,
  };

  it('produces a location payload with no coordinates, no photos and unknown status', () => {
    const out = transformOrg(org);
    expect(out.location.nombre).toBe('Hospital Periférico de Catia');
    expect(out.location.estado).toBe('Distrito Capital');
    expect(out.location.ciudad).toBe('Caracas');
    expect(out.location.lat).toBeNull();
    expect(out.location.lng).toBeNull();
    expect(out.location.status).toBe('desconocido');
  });

  it('keeps the organization contact details (user chose to retain contact)', () => {
    const out = transformOrg(org);
    expect(out.location.contactoNombre).toBe('Coordinación');
    expect(out.location.contactoTelefono).toBe('04241459437');
    expect(out.location.descripcion).toContain('peinadomgh@gmail.com');
  });

  it('carries a stable per-org source_ref for idempotency', () => {
    expect(transformOrg(org).sourceRef).toBe('https://ayudaencamino.com/organizacion/53');
  });
});

describe('transformNeed', () => {
  const need = {
    id: 71,
    orgId: 53,
    nombreArticulo: 'POVEDINE',
    categoria: 'medicinas',
    descripcion: 'Lismar Mujica',
    cantidadNecesaria: 50,
    urgencia: 'critica',
    status: 'activa',
  };

  it('maps a source need onto our needs schema and links it to its org', () => {
    const out = transformNeed(need);
    expect(out.orgId).toBe(53);
    expect(out.need.categoria).toBe('medicinas');
    expect(out.need.urgencia).toBe('alta');
    expect(out.need.status).toBe('pendiente');
    expect(out.need.descripcion).toContain('POVEDINE');
    expect(out.need.cantidad).toContain('50');
  });

  it('carries a stable per-need source_ref for idempotency', () => {
    expect(transformNeed(need).sourceRef).toBe('https://ayudaencamino.com/need/71');
  });
});
