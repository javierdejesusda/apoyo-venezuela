import { describe, expect, it } from 'vitest';

import {
  buildDescripcion,
  clampNombre,
  deriveEstado,
  isMissingPersonReport,
  mapDamageToStatus,
  sanitizeCoords,
  selectFotos,
  toProxyUrl,
  transformBuilding,
} from '../scripts/terremoto-transform.mjs';

describe('mapDamageToStatus', () => {
  it('maps total collapse to derrumbe', () => {
    expect(mapDamageToStatus('total')).toBe('derrumbe');
  });

  it('maps severe and partial damage to danado', () => {
    expect(mapDamageToStatus('severo')).toBe('danado');
    expect(mapDamageToStatus('parcial')).toBe('danado');
  });

  it('falls back to desconocido for empty or unknown levels', () => {
    expect(mapDamageToStatus('')).toBe('desconocido');
    expect(mapDamageToStatus(null)).toBe('desconocido');
    expect(mapDamageToStatus('whatever')).toBe('desconocido');
  });
});

describe('deriveEstado', () => {
  it('reads the state from the last address segment before Venezuela', () => {
    expect(
      deriveEstado({
        address: 'Av. Miguel Otero Silva, Caracas 1071, Distrito Capital, Venezuela',
        city: 'Caracas',
      }),
    ).toBe('Distrito Capital');
    expect(
      deriveEstado({ address: 'Calle X, Caraballeda, La Guaira, Venezuela', city: 'Caraballeda' }),
    ).toBe('La Guaira');
    expect(deriveEstado({ address: 'Urb Y, Guarenas, Miranda', city: 'Guarenas' })).toBe('Miranda');
  });

  it('resolves English and French and legacy aliases for La Guaira / Distrito Capital', () => {
    expect(deriveEstado({ address: 'X, Capital District, Venezuela', city: 'Caracas' })).toBe(
      'Distrito Capital',
    );
    expect(deriveEstado({ address: 'X, État de Vargas, Venezuela', city: 'Macuto' })).toBe(
      'La Guaira',
    );
    expect(deriveEstado({ address: 'X, Vargas, Venezuela', city: 'La Guaira' })).toBe('La Guaira');
    expect(deriveEstado({ address: 'X, Estado La Guaira', city: 'La Guaira' })).toBe('La Guaira');
  });

  it('falls back to a city -> state map when the address has no state segment', () => {
    expect(deriveEstado({ address: '4ta transversal de Mariperez', city: 'Caracas' })).toBe(
      'Distrito Capital',
    );
    expect(deriveEstado({ address: '', city: 'Maracaibo' })).toBe('Zulia');
    expect(deriveEstado({ address: '', city: 'Valencia' })).toBe('Carabobo');
    expect(deriveEstado({ address: '', city: 'Maracay' })).toBe('Aragua');
    expect(deriveEstado({ address: '', city: 'Barquisimeto' })).toBe('Lara');
  });

  it('tolerates city typos and casing in the fallback map', () => {
    expect(deriveEstado({ address: '', city: 'caracas' })).toBe('Distrito Capital');
    expect(deriveEstado({ address: '', city: 'Cabaralleda' })).toBe('La Guaira');
    expect(deriveEstado({ address: '', city: 'La guiará' })).toBe('La Guaira');
  });

  it('does not misread a street named after Miranda as the Miranda state', () => {
    // "Av. Francisco de Miranda" is a Caracas avenue, not the state.
    expect(
      deriveEstado({
        address: 'Av. Francisco de Miranda, Caracas, Distrito Capital, Venezuela',
        city: 'Caracas',
      }),
    ).toBe('Distrito Capital');
  });

  it('defaults to Distrito Capital only when nothing else resolves', () => {
    expect(deriveEstado({ address: 'totally unparseable', city: 'Caracqw' })).toBe(
      'Distrito Capital',
    );
    expect(deriveEstado({ address: '', city: '' })).toBe('Distrito Capital');
  });

  it('always returns a non-empty string of at least 2 chars (estado is required)', () => {
    for (const row of [{}, { address: null, city: null }, { address: ' ', city: ' ' }]) {
      const e = deriveEstado(row as { address?: string | null; city?: string | null });
      expect(typeof e).toBe('string');
      expect(e.trim().length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('clampNombre', () => {
  it('passes through a normal building name', () => {
    expect(clampNombre('Edificio Valdiana')).toBe('Edificio Valdiana');
  });

  it('pads a too-short name so it meets the 3 char minimum', () => {
    expect(clampNombre('A').length).toBeGreaterThanOrEqual(3);
  });

  it('truncates a name longer than 120 chars', () => {
    expect(clampNombre('x'.repeat(200)).length).toBe(120);
  });
});

describe('sanitizeCoords', () => {
  it('keeps valid coordinates', () => {
    expect(sanitizeCoords(10.5, -66.9)).toEqual({ lat: 10.5, lng: -66.9 });
  });

  it('nulls out missing or out-of-range coordinates', () => {
    expect(sanitizeCoords(null, null)).toEqual({ lat: null, lng: null });
    expect(sanitizeCoords(999, -66.9)).toEqual({ lat: null, lng: null });
    expect(sanitizeCoords(10.5, 'x' as unknown as number)).toEqual({ lat: null, lng: null });
  });
});

describe('selectFotos', () => {
  it('combines main photo and media, dedupes, keeps only https, and caps the count', () => {
    const row = {
      main_photo_url: 'https://src/a.jpg',
      media_urls: ['https://src/a.jpg', 'https://src/b.jpg', 'http://insecure/c.jpg', 'https://src/d.jpg', 'https://src/e.jpg'],
    };
    const fotos = selectFotos(row, 4);
    expect(fotos).toEqual(['https://src/a.jpg', 'https://src/b.jpg', 'https://src/d.jpg', 'https://src/e.jpg']);
  });

  it('handles a report with no photos', () => {
    expect(selectFotos({ main_photo_url: null, media_urls: [] }, 4)).toEqual([]);
  });
});

describe('toProxyUrl', () => {
  it('rewrites a private damage-media storage URL to the public proxy', () => {
    expect(
      toProxyUrl(
        'https://jckifxsdlnsvbztxydes.supabase.co/storage/v1/object/public/damage-media/reports/abc.jpg',
      ),
    ).toBe('https://terremotovenezuela.com/api/public/media/reports/abc.jpg');
  });

  it('drops any query string when rewriting', () => {
    expect(
      toProxyUrl('https://x/storage/v1/object/public/damage-media/reports/abc.jpg?r=123'),
    ).toBe('https://terremotovenezuela.com/api/public/media/reports/abc.jpg');
  });

  it('leaves an already-proxied URL untouched', () => {
    const proxied = 'https://terremotovenezuela.com/api/public/media/reports/abc.jpg';
    expect(toProxyUrl(proxied)).toBe(proxied);
  });

  it('returns an unrelated URL unchanged', () => {
    expect(toProxyUrl('https://other/image.jpg')).toBe('https://other/image.jpg');
  });
});

describe('buildDescripcion', () => {
  it('includes notes and source provenance without any external attribution', () => {
    const d = buildDescripcion({
      notes: 'Columnas con grietas.',
      general_source: 'Vecino',
      address: 'Av X, Caracas',
      trapped_names: null,
    });
    expect(d).toContain('Columnas con grietas.');
    expect(d).toContain('Vecino');
    expect(d?.toLowerCase()).not.toContain('terremotovenezuela');
  });

  it('surfaces possibly trapped people when present', () => {
    const d = buildDescripcion({ notes: null, trapped_names: 'María Pérez', general_source: null, address: null });
    expect(d).toContain('María Pérez');
  });

  it('truncates to 1000 chars max', () => {
    const d = buildDescripcion({ notes: 'n'.repeat(2000), general_source: null, address: null, trapped_names: null });
    expect((d ?? '').length).toBeLessThanOrEqual(1000);
  });

  it('returns undefined when there is nothing to say', () => {
    expect(buildDescripcion({ notes: null, general_source: null, address: null, trapped_names: null })).toBeUndefined();
  });
});

describe('isMissingPersonReport', () => {
  it('flags pure "se busca" person posts with no building damage', () => {
    expect(isMissingPersonReport({ name: 'Nerys Ramos', notes: 'Se busca' })).toBe(true);
    expect(
      isMissingPersonReport({ name: 'Opp torre c brisas del mar', notes: 'Se busca' }),
    ).toBe(true);
  });

  it('flags a post that hid its "se busca" in the report source field', () => {
    expect(
      isMissingPersonReport({ name: 'Opp torre c brisas del mar', notes: null, general_source: 'Se busca' }),
    ).toBe(true);
  });

  it('flags a post whose name is a person sighting', () => {
    expect(
      isMissingPersonReport({
        name: 'Se vio por última vez en la guaira cerca de Caraballera',
        notes: 'Se encontraba vacacionando cerca de las residencias',
      }),
    ).toBe(true);
  });

  it('does NOT flag a real collapsed building that also mentions searching for people', () => {
    expect(
      isMissingPersonReport({
        name: 'Residencias Vistamar',
        notes:
          'Si alguien conoce el paradero de Maria y Arturo Cabrera comuniquense. Colapso Total. Destruccion total',
      }),
    ).toBe(false);
    expect(
      isMissingPersonReport({
        name: 'residencias sol y mar',
        notes: 'Edificio caido lateralmente, buscamos a personas que viven alli',
      }),
    ).toBe(false);
  });

  it('does NOT flag a collapse described with "se cayeron" that also names a missing resident', () => {
    expect(
      isMissingPersonReport({
        name: 'Costa Dorada',
        notes:
          'Se cayeron todos los departamentos A del edificio. Habita una persona que permanece desaparecida, Luis Cordero',
      }),
    ).toBe(false);
  });

  it('does NOT flag an ordinary damage report or a building info request', () => {
    expect(isMissingPersonReport({ name: 'Edificio El Mirador', notes: 'Grietas en columnas' })).toBe(
      false,
    );
    expect(
      isMissingPersonReport({ name: 'Anduriña Mar', notes: 'Si alguien tiene información de este edificio' }),
    ).toBe(false);
    expect(isMissingPersonReport({ name: 'Torre Norte', notes: null })).toBe(false);
  });
});

describe('transformBuilding', () => {
  const row = {
    id: '1bf67179-15fb-42a3-97bf-0059549d0980',
    name: 'Edificio Valdiana',
    address: 'G36W+868, Av. Panteón, Caracas 1010, Distrito Capital, Venezuela',
    city: 'Caracas',
    zone: 'San jose',
    lat: null,
    lng: null,
    damage_level: 'severo',
    notes: null,
    general_source: 'Vecino',
    trapped_names: null,
    main_photo_url: 'https://src/main.jpg',
    media_urls: ['https://src/2.jpg'],
  };

  it('produces a location payload matching our locations schema shape', () => {
    const out = transformBuilding(row);
    expect(out.location.nombre).toBe('Edificio Valdiana');
    expect(out.location.estado).toBe('Distrito Capital');
    expect(out.location.ciudad).toBe('Caracas');
    expect(out.location.zona).toBe('San jose');
    expect(out.location.status).toBe('danado');
    expect(out.location.lat).toBeNull();
    expect(out.location.lng).toBeNull();
  });

  it('carries a stable source_ref derived from the source id for idempotency', () => {
    const out = transformBuilding(row);
    expect(out.sourceRef).toContain('1bf67179-15fb-42a3-97bf-0059549d0980');
  });

  it('exposes the source photo urls to be re-hosted, capped at 4', () => {
    const out = transformBuilding(row);
    expect(out.sourceFotoUrls).toEqual(['https://src/main.jpg', 'https://src/2.jpg']);
  });
});
