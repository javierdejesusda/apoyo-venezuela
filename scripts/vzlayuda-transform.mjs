/**
 * Pure transforms for vzlayuda.com relief-request data.
 * Each aviso of tipo 'necesidad' becomes one locations row and one needs row.
 * Side-effect free for unit testing without any network or database dependency.
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

/** Clamp a request titulo into our 3..120 char nombre bounds. */
export function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = 'Solicitud de ayuda';
  return value;
}

/** Clamp a city into our 2..80 char ciudad bounds. */
export function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, 80);
  return value.length >= 2 ? value : 'Desconocida';
}

/** Clamp a zona string to 120 chars, returning null when absent. */
export function clampZona(zona) {
  const trimmed = String(zona ?? '').trim();
  if (!trimmed) return null;
  return trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed;
}

const SUBCAT_MAP = new Map([
  ['agua potable', 'agua'],
  ['medicamentos', 'medicinas'],
  ['medico', 'medicinas'],
  ['primeros auxilios', 'medicinas'],
  ['traslado de personas', 'transporte'],
  ['busco alojamiento', 'refugio'],
  ['viveres', 'alimentos'],
  ['electricidad', 'energia'],
]);

const CATEGORIA_MAP = new Map([
  ['salud', 'medicinas'],
  ['alimentos', 'alimentos'],
  ['transporte', 'transporte'],
  ['alojamiento', 'refugio'],
  ['comunicacion', 'comunicacion'],
  ['materiales', 'otro'],
  ['estructural', 'otro'],
  ['exterior', 'otro'],
  ['oficios', 'otro'],
  ['mascotas', 'otro'],
]);

/**
 * Map a source category and subcategory onto our need category enum.
 * Subcategoria overrides take priority over the base categoria map.
 */
export function mapCategoria(categoria, subcategoria) {
  const normSub = normalize(subcategoria);
  const mapped = normSub ? SUBCAT_MAP.get(normSub) : undefined;
  if (mapped) return mapped;
  return CATEGORIA_MAP.get(normalize(categoria)) ?? 'otro';
}

/**
 * Build a non-empty need description by joining the non-empty parts of titulo,
 * descripcion and subcategoria. Falls back to 'Solicitud de ayuda'.
 */
export function buildNeedDescripcion(titulo, descripcion, subcategoria) {
  const parts = [titulo, descripcion, subcategoria]
    .map((s) => String(s ?? '').trim())
    .filter((s) => s.length > 0);
  const text = parts.join(' - ');
  if (!text) return 'Solicitud de ayuda';
  return text.length > MAX_DESCRIPCION ? text.slice(0, MAX_DESCRIPCION) : text;
}

/** Source identifier prefix shared by the import and rollback scripts. */
export const SOURCE_PREFIX = 'vzlayuda';

/** Stable per-aviso location source_ref used for idempotency. */
export function avisoSourceRef(id) {
  return `${SOURCE_PREFIX}:${id}`;
}

/** Stable per-aviso need source_ref used for idempotency. */
export function needSourceRef(id) {
  return `${SOURCE_PREFIX}:need:${id}`;
}

/**
 * Transform a source aviso into a locations payload and a needs payload plus
 * stable source refs. Contact is never included per platform privacy policy.
 */
export function transformAviso(aviso) {
  return {
    location: {
      nombre: clampNombre(aviso.titulo || 'Solicitud de ayuda'),
      estado: normalizeEstado(aviso.estado),
      ciudad: clampCiudad(aviso.ciudad || aviso.estado || 'Desconocida'),
      zona: clampZona(aviso.zona),
      status: 'desconocido',
      descripcion: null,
      contacto_nombre: null,
      contacto_telefono: null,
      lat: null,
      lng: null,
      fotos: [],
    },
    need: {
      categoria: mapCategoria(aviso.categorias?.[0], aviso.subcategoria),
      descripcion: buildNeedDescripcion(aviso.titulo, aviso.descripcion, aviso.subcategoria),
      cantidad: null,
      urgencia: 'media',
      status: 'pendiente',
    },
    sourceRef: avisoSourceRef(aviso.id),
    needSourceRef: needSourceRef(aviso.id),
  };
}

/**
 * An aviso is importable when it is a necesidad and has at least a titulo or
 * descripcion (blank avisos carry no actionable content).
 */
export function isImportableAviso(aviso) {
  if (aviso?.tipo !== 'necesidad') return false;
  return (
    String(aviso?.titulo ?? '').trim().length > 0 ||
    String(aviso?.descripcion ?? '').trim().length > 0
  );
}
