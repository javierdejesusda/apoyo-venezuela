/**
 * Pure transforms that map ayudaencamino.com relief-coordination data onto our
 * schema: each organization becomes a `locations` row and each supply need
 * becomes a `needs` row attached to that organization's location. Kept side
 * effect free so they can be unit tested without any network or database.
 *
 * Unlike terremotovenezuela.com, this source has no building-damage status, no
 * coordinates and no photos: it is a directory of organizations (shelters,
 * collection centers, hospitals, NGOs, affected places) and the supplies they
 * are requesting.
 */

const SOURCE_BASE = 'https://ayudaencamino.com';
const DEFAULT_ESTADO = 'Distrito Capital';
const MAX_DESCRIPCION = 1000;

/** Lowercase, strip accents, collapse whitespace - for tolerant matching. */
function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// The 24 federal entities plus the legacy "Vargas" alias for La Guaira, keyed
// by their accent-stripped lowercase form so source casing/accents are tolerated.
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

/** Clamp an organization name into our 3..120 char `nombre` bounds. */
export function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = 'Organización sin nombre';
  return value;
}

/** Clamp a city into our 2..80 char `ciudad` bounds. */
export function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, 80);
  return value.length >= 2 ? value : 'Desconocida';
}

const TIPO_LABELS = new Map([
  ['hospital_centro_medico', 'Hospital / centro médico'],
  ['centro_acopio', 'Centro de acopio'],
  ['refugio', 'Refugio'],
  ['voluntarios', 'Voluntarios'],
  ['lugar_afectado', 'Lugar afectado'],
  ['ong', 'ONG'],
]);

/** Human-readable label for an organization type. */
export function orgTipoLabel(tipo) {
  return TIPO_LABELS.get(normalize(tipo).replace(/ /g, '_')) ?? 'Organización';
}

function clampDescripcion(text) {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return trimmed.length > MAX_DESCRIPCION ? trimmed.slice(0, MAX_DESCRIPCION) : trimmed;
}

/** Build a public description for an org from its own fields (no attribution). */
export function buildOrgDescripcion(org) {
  const lines = [orgTipoLabel(org?.tipo)];

  const direccion = String(org?.direccion ?? '').trim();
  if (direccion) lines.push(`Dirección: ${direccion}`);

  const horario = String(org?.horario ?? '').trim();
  if (horario) lines.push(`Horario: ${horario}`);

  const email = String(org?.contactoEmail ?? '').trim();
  if (email) lines.push(`Correo: ${email}`);

  return clampDescripcion(lines.join('\n'));
}

// Our NEED_CATEGORIES (kept inline so the transform stays dependency free).
const CATEGORIA_SET = new Set([
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

/** Map a source need category onto our enum, defaulting to otro. */
export function mapNeedCategoria(categoria) {
  const value = normalize(categoria);
  return CATEGORIA_SET.has(value) ? value : 'otro';
}

const URGENCIA_MAP = new Map([
  ['critica', 'alta'],
  ['alta', 'alta'],
  ['media', 'media'],
  ['baja', 'baja'],
]);

/** Map the source urgency onto our enum; the source-only "critica" -> "alta". */
export function mapNeedUrgencia(urgencia) {
  return URGENCIA_MAP.get(normalize(urgencia)) ?? 'media';
}

const STATUS_MAP = new Map([
  ['activa', 'pendiente'],
  ['parcial', 'en_camino'],
  ['cumplida', 'cubierto'],
]);

/** Map the source need lifecycle onto ours. */
export function mapNeedStatus(status) {
  return STATUS_MAP.get(normalize(status)) ?? 'pendiente';
}

/** Build a non-empty need description (our needs.descripcion is NOT NULL). */
export function buildNeedDescripcion(need) {
  const articulo = String(need?.nombreArticulo ?? '').trim();
  const detalle = String(need?.descripcion ?? '').trim();
  const text = detalle && detalle !== articulo ? `${articulo}: ${detalle}` : articulo;
  return (text.length > MAX_DESCRIPCION ? text.slice(0, MAX_DESCRIPCION) : text) || 'Necesidad';
}

/** Free-text quantity from the requested amount, or undefined when none. */
export function buildNeedCantidad(need) {
  const necesaria = Number(need?.cantidadNecesaria);
  if (!Number.isFinite(necesaria) || necesaria <= 0) return undefined;
  return String(necesaria);
}

/** Stable per-organization source_ref used for idempotency. */
export function orgSourceRef(orgId) {
  return `${SOURCE_BASE}/organizacion/${orgId}`;
}

/** Stable per-need source_ref used for idempotency. */
export function needSourceRef(needId) {
  return `${SOURCE_BASE}/need/${needId}`;
}

/** An org row is importable when it has a real name. */
export function isImportableOrg(org) {
  return String(org?.nombre ?? '').trim().length > 0;
}

/** A need row is importable when it names an article. */
export function isImportableNeed(need) {
  return String(need?.nombreArticulo ?? '').trim().length > 0;
}

/**
 * Transform a source organization into a `locations` payload (no coordinates,
 * no photos, unknown structural status) plus a stable source_ref. Contact
 * details are retained per the import decision.
 */
export function transformOrg(org) {
  return {
    location: {
      nombre: clampNombre(org?.nombre),
      estado: normalizeEstado(org?.estado),
      ciudad: clampCiudad(org?.ciudad),
      zona: undefined,
      status: 'desconocido',
      descripcion: buildOrgDescripcion(org),
      contactoNombre: String(org?.contactoNombre ?? '').trim() || undefined,
      contactoTelefono: String(org?.contactoTelefono ?? '').trim() || undefined,
      lat: null,
      lng: null,
      fotos: [],
    },
    sourceRef: orgSourceRef(org?.id),
  };
}

/**
 * Transform a source need into a `needs` payload plus a stable source_ref. The
 * `orgId` is surfaced so the runner can link it to the org's imported location.
 */
export function transformNeed(need) {
  return {
    need: {
      categoria: mapNeedCategoria(need?.categoria),
      descripcion: buildNeedDescripcion(need),
      cantidad: buildNeedCantidad(need),
      urgencia: mapNeedUrgencia(need?.urgencia),
      status: mapNeedStatus(need?.status),
    },
    orgId: need?.orgId,
    sourceRef: needSourceRef(need?.id),
  };
}

export { SOURCE_BASE };
