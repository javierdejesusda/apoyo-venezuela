/**
 * Pure transforms for conecta-salud medical-supplies data.
 * Groups source rows by hospital into one location per distinct hospital and
 * one need per insumo row. Side-effect free for unit testing without any
 * network or database dependency.
 */

const DEFAULT_ESTADO = 'Distrito Capital';
const MAX_DESCRIPCION = 1000;

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const STATE_BY_NORM = new Map(
  Object.entries({
    amazonas: 'Amazonas',
    anzoategui: 'Anzoátegui',
    apure: 'Apure',
    aragua: 'Aragua',
    barinas: 'Barinas',
    bolivar: 'Bolívar',
    carabobo: 'Carabobo',
    cojedes: 'Cojedes',
    'delta amacuro': 'Delta Amacuro',
    'distrito capital': 'Distrito Capital',
    falcon: 'Falcón',
    guarico: 'Guárico',
    'la guaira': 'La Guaira',
    vargas: 'La Guaira',
    lara: 'Lara',
    merida: 'Mérida',
    miranda: 'Miranda',
    monagas: 'Monagas',
    'nueva esparta': 'Nueva Esparta',
    portuguesa: 'Portuguesa',
    sucre: 'Sucre',
    tachira: 'Táchira',
    trujillo: 'Trujillo',
    yaracuy: 'Yaracuy',
    zulia: 'Zulia',
  }),
);

/** Resolve the source estado against the canonical state list, else default. */
export function normalizeEstado(estado) {
  return STATE_BY_NORM.get(normalize(estado)) ?? DEFAULT_ESTADO;
}

/** Clamp a hospital name into our 3..120 char nombre bounds. */
export function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = 'Centro de salud';
  return value;
}

/** Clamp a city into our 2..80 char ciudad bounds. */
export function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, 80);
  return value.length >= 2 ? value : 'Desconocida';
}

/**
 * Strip unicode bidi and directional control characters, trim, and collapse
 * internal whitespace. Returns null when the result is empty.
 * NEVER called on a phone from a row where contacto_oculto===true.
 */
export function cleanPhone(phone) {
  if (phone == null) return null;
  const stripped = String(phone)
    .replace(/[‪‫‬‎‏]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  return stripped || null;
}

const URGENCIA_MAP = new Map([
  ['urgente', 'alta'],
  ['alta', 'alta'],
  ['mediana', 'media'],
]);

/** Map source urgency values onto our schema enum. */
export function mapUrgencia(urgencia) {
  return URGENCIA_MAP.get(normalize(urgencia)) ?? 'media';
}

/**
 * Build a non-empty need description from the insumo name and optional notes.
 * Falls back to 'Insumo medico' so the NOT NULL column is always satisfied.
 */
export function buildNeedDescripcion(insumo, notas) {
  const ins = String(insumo ?? '').trim();
  const notes = String(notas ?? '').trim();
  const text = [ins, notes].filter(Boolean).join(' - ');
  if (!text) return 'Insumo medico';
  return text.length > MAX_DESCRIPCION ? text.slice(0, MAX_DESCRIPCION) : text;
}

/** Return the trimmed quantity string, or undefined when none is recorded. */
export function buildCantidad(cantidad) {
  const trimmed = String(cantidad ?? '').trim();
  return trimmed || undefined;
}

/** Source identifier prefix shared by the import and rollback scripts. */
export const SOURCE_PREFIX = 'conecta-salud';

/** Stable per-hospital source_ref used for idempotency. */
export function hospitalSourceRef(slug) {
  return `${SOURCE_PREFIX}:hosp:${slug}`;
}

/** Stable per-row source_ref used for idempotency on the needs table. */
export function needSourceRef(id) {
  return `${SOURCE_PREFIX}:need:${id}`;
}

/**
 * Group source rows by hospital and transform each group into a locations
 * payload plus an array of needs payloads. Each need includes its own
 * sourceRef so the runner can perform idempotent inserts.
 *
 * Phone privacy: a phone is only used from a row that is EXPLICITLY marked
 * visible (contacto_oculto === false). Any other value (true, null, missing)
 * fails closed so an unexpected source shape never leaks a number.
 */
export function mapHospitals(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = normalize(row.hospital);
    const arr = groups.get(key);
    if (arr) {
      arr.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const result = [];
  for (const [key, groupRows] of groups) {
    const first = groupRows[0];
    const slug = key.replace(/\s+/g, '-');
    const sourceRef = hospitalSourceRef(slug);

    let phone = null;
    for (const r of groupRows) {
      if (r.contacto_oculto !== false) continue;
      const candidate = cleanPhone(r.contacto);
      if (candidate) {
        phone = candidate;
        break;
      }
    }

    const location = {
      nombre: clampNombre(first.hospital),
      estado: normalizeEstado(first.estado),
      ciudad: clampCiudad(first.ciudad || 'Caracas'),
      zona: null,
      status: 'desconocido',
      descripcion: null,
      contacto_nombre: null,
      contacto_telefono: phone,
      lat: null,
      lng: null,
      fotos: [],
    };

    const needs = groupRows.map((row) => ({
      categoria: 'medicinas',
      descripcion: buildNeedDescripcion(row.insumo, row.notas),
      cantidad: buildCantidad(row.cantidad) ?? null,
      urgencia: mapUrgencia(row.urgencia),
      status: 'pendiente',
      sourceRef: needSourceRef(row.id),
    }));

    result.push({ location, needs, sourceRef });
  }
  return result;
}
