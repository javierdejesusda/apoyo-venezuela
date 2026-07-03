/**
 * Pure transforms for the refugios/centros-comida shelter and aid-center data.
 * Every source record becomes one locations row; centros-comida records that
 * carry a free-text needs string additionally produce one needs row.
 * Side-effect free for unit testing without any network or database dependency.
 */

const DEFAULT_ESTADO = 'Distrito Capital';
const MAX_DESCRIPCION = 1000;
const MIN_PHONE_DIGITS = 7;

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

/** Clamp a shelter name into our 3..120 char nombre bounds. */
export function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = 'Centro de ayuda';
  return value;
}

/** Clamp a city into our 2..80 char ciudad bounds. */
export function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, 80);
  return value.length >= 2 ? value : 'Desconocida';
}

/** Clamp an address into a zona string of at most 120 chars, null when absent. */
export function clampZona(zona) {
  const trimmed = String(zona ?? '').trim();
  if (!trimmed) return null;
  return trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed;
}

/**
 * Sanitize an institutional contact number: strip unicode bidi controls and
 * any character that is not a digit or common phone punctuation, collapse
 * whitespace, then reject anything with fewer than MIN_PHONE_DIGITS digits.
 * Returns null for absent or garbage values.
 */
export function cleanPhone(phone) {
  if (phone == null) return null;
  const stripped = String(phone)
    .replace(/[‪‫‬‎‏]/g, '')
    .replace(/[^0-9+()\-\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const digitCount = stripped.replace(/\D/g, '').length;
  if (digitCount < MIN_PHONE_DIGITS) return null;
  return stripped || null;
}

/**
 * Pick the institutional aid line for a record: prefer contact_phone, fall
 * back to contact_whatsapp, and never emit a reporter's personal number.
 */
export function pickPhone(record) {
  return cleanPhone(record?.contact_phone) ?? cleanPhone(record?.contact_whatsapp) ?? null;
}

const NEED_CATEGORY_KEYWORDS = [
  [/medic|farmacia|medicament|vendas|insulina|tratamiento/, 'medicinas'],
  [/pa[ñn]al|higiene|jab[oó]n|aseo|toalla sanitaria|cepillo|panal/, 'higiene'],
  [/ropa|abrigo|cobija|colch[oó]n|manta|zapato|calzado/, 'ropa'],
];

/**
 * Infer a need category from free-text supply requests. Defaults to
 * 'alimentos' because the needs field only exists on food/aid centers, where
 * food is the dominant request; only clear non-food signals override it.
 */
export function inferNeedCategoria(text) {
  const norm = normalize(text);
  if (!norm) return 'alimentos';
  for (const [pattern, categoria] of NEED_CATEGORY_KEYWORDS) {
    if (pattern.test(norm)) return categoria;
  }
  return 'alimentos';
}

const AMENITY_LABELS = [
  ['has_water', 'agua'],
  ['has_food', 'comida'],
  ['has_medical', 'atención médica'],
  ['has_electricity', 'electricidad'],
  ['pets_allowed', 'admite mascotas'],
];

/**
 * Build a location description from the source notes, enriched with a summary
 * of available services and capacity. Returns null when there is nothing to
 * describe so the nullable column stays null instead of holding empty text.
 */
export function buildDescripcion(record) {
  const parts = [];
  const notes = String(record?.notes ?? '').trim();
  if (notes) parts.push(notes);

  const servicios = AMENITY_LABELS.filter(([key]) => record?.[key]).map(([, label]) => label);
  if (servicios.length) parts.push(`Servicios: ${servicios.join(', ')}`);

  const capacity = Number(record?.capacity);
  if (Number.isFinite(capacity) && capacity > 0) parts.push(`Capacidad: ${capacity}`);

  const text = parts.join(' - ');
  if (!text) return null;
  return text.length > MAX_DESCRIPCION ? text.slice(0, MAX_DESCRIPCION) : text;
}

/** Parse a coordinate into a finite number, or null when absent/invalid. */
function toCoord(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Source identifier prefix shared by the import and rollback scripts. */
export const SOURCE_PREFIX = 'refugios';

/** Stable per-record location source_ref used for idempotency. */
export function locationSourceRef(id) {
  return `${SOURCE_PREFIX}:${id}`;
}

/** Stable per-record need source_ref used for idempotency. */
export function needSourceRef(id) {
  return `${SOURCE_PREFIX}:need:${id}`;
}

/** Clamp a need description to MAX_DESCRIPCION chars. */
function clampNeedDescripcion(text) {
  const trimmed = String(text ?? '').trim();
  return trimmed.length > MAX_DESCRIPCION ? trimmed.slice(0, MAX_DESCRIPCION) : trimmed;
}

/**
 * Transform a source shelter/aid-center record into a locations payload plus,
 * for food centers that list needs, a single needs payload. Reporter PII
 * (reporter_name, reporter_contact) is always dropped: contacto_nombre is null
 * and only the institutional aid line may become contacto_telefono. Returns the
 * locations payload, an optional needs payload, and stable idempotency refs.
 */
export function transformRefugio(record) {
  const location = {
    nombre: clampNombre(record.name),
    estado: normalizeEstado(record.state),
    ciudad: clampCiudad(record.city),
    zona: clampZona(record.address),
    status: 'desconocido',
    descripcion: buildDescripcion(record),
    contacto_nombre: null,
    contacto_telefono: pickPhone(record),
    lat: toCoord(record.latitude),
    lng: toCoord(record.longitude),
    fotos: [],
  };

  const needsText = String(record.needs ?? '').trim();
  const need =
    record.kind === 'comida' && needsText
      ? {
          categoria: inferNeedCategoria(needsText),
          descripcion: clampNeedDescripcion(needsText),
          cantidad: null,
          urgencia: 'media',
          status: 'pendiente',
        }
      : null;

  return {
    location,
    need,
    sourceRef: locationSourceRef(record.id),
    needSourceRef: needSourceRef(record.id),
  };
}
