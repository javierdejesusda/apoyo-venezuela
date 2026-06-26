/**
 * Pure transforms that map a terremotovenezuela.com `buildings` row onto our
 * `locations` schema. Kept side-effect free so they can be unit tested without
 * any network or database. The import runner re-hosts photos and inserts rows.
 */

const SOURCE_BASE = 'https://terremotovenezuela.com';
const DEFAULT_ESTADO = 'Distrito Capital';
const MAX_FOTOS = 4;

/** Lowercase, strip accents, collapse whitespace - for tolerant matching. */
function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Canonical Venezuelan states plus the aliases seen in the source addresses
// (English "Capital District", French "État de Vargas", legacy "Vargas").
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
    'capital district': 'Distrito Capital',
    'dtto capital': 'Distrito Capital',
    'distrito metropolitano': 'Distrito Capital',
    falcon: 'Falcón',
    guarico: 'Guárico',
    lara: 'Lara',
    merida: 'Mérida',
    miranda: 'Miranda',
    monagas: 'Monagas',
    'nueva esparta': 'Nueva Esparta',
    portuguesa: 'Portuguesa',
    sucre: 'Sucre',
    tachira: 'Táchira',
    trujillo: 'Trujillo',
    'la guaira': 'La Guaira',
    'estado la guaira': 'La Guaira',
    vargas: 'La Guaira',
    'estado vargas': 'La Guaira',
    'etat de vargas': 'La Guaira',
    yaracuy: 'Yaracuy',
    zulia: 'Zulia',
  }),
);

// City -> state fallback for the cities present in the source data (including
// the common misspellings), used only when the address has no state segment.
const CITY_TO_STATE = new Map(
  Object.entries({
    caracas: 'Distrito Capital',
    'caracas distrito capital': 'Distrito Capital',
    libertador: 'Distrito Capital',
    'distrito capital': 'Distrito Capital',
    caraballeda: 'La Guaira',
    cabaralleda: 'La Guaira',
    'caraballeda - la guaira': 'La Guaira',
    'caribe - la guaira': 'La Guaira',
    maiquetia: 'La Guaira',
    macuto: 'La Guaira',
    'catia la mar': 'La Guaira',
    'catia la mar / playa grande': 'La Guaira',
    'la guaira': 'La Guaira',
    'la guaira - playa grande': 'La Guaira',
    'la guira': 'La Guaira',
    'la guiara': 'La Guaira',
    'las guaira': 'La Guaira',
    'estado la guaira': 'La Guaira',
    vargas: 'La Guaira',
    'vargas catia la mar': 'La Guaira',
    carayaca: 'La Guaira',
    tanaguarena: 'La Guaira',
    'la sabana': 'La Guaira',
    valencia: 'Carabobo',
    'puerto cabello': 'Carabobo',
    'municipio puerto cabello': 'Carabobo',
    naguanagua: 'Carabobo',
    tucacas: 'Carabobo',
    moron: 'Carabobo',
    mariara: 'Carabobo',
    guacara: 'Carabobo',
    'san joaquin': 'Carabobo',
    tinaquillo: 'Carabobo',
    maracay: 'Aragua',
    turmero: 'Aragua',
    cagua: 'Aragua',
    'la victoria': 'Aragua',
    'el limon': 'Aragua',
    'las delicias': 'Aragua',
    guarenas: 'Miranda',
    guatire: 'Miranda',
    cua: 'Miranda',
    'santa teresa': 'Miranda',
    'santa teresa del tuy': 'Miranda',
    higuerote: 'Miranda',
    carrizal: 'Miranda',
    'municipio carrizal': 'Miranda',
    'san antonio de los altos': 'Miranda',
    'tacarigua de mamporal': 'Miranda',
    barquisimeto: 'Lara',
    cabudare: 'Lara',
    'san fernando de apure': 'Apure',
    'altagracia de orituco': 'Guárico',
    maracaibo: 'Zulia',
    merida: 'Mérida',
    'ciudad guayana': 'Bolívar',
    lecheria: 'Anzoátegui',
  }),
);

const SOURCE_MEDIA_PROXY = 'https://terremotovenezuela.com/api/public/media/';

/**
 * The source keeps photos in a private `damage-media` bucket and only serves
 * them through its own public proxy, so the raw storage URL 400s. Rewrite to
 * the proxy the site itself uses.
 */
export function toProxyUrl(url) {
  const str = String(url ?? '');
  if (str.includes('/api/public/media/')) return str;
  const at = str.indexOf('/damage-media/');
  if (at !== -1) {
    return SOURCE_MEDIA_PROXY + str.slice(at + '/damage-media/'.length).split(/[?#]/)[0];
  }
  return str;
}

const DAMAGE_TO_STATUS = new Map([
  ['total', 'derrumbe'],
  ['severo', 'danado'],
  ['parcial', 'danado'],
]);

/** Map the source damage level onto our EmergencyStatus enum. */
export function mapDamageToStatus(damageLevel) {
  return DAMAGE_TO_STATUS.get(normalize(damageLevel)) ?? 'desconocido';
}

/**
 * Resolve the Venezuelan state. Prefers an exact state segment in the address
 * (scanned from the end so the trailing "..., Estado, Venezuela" wins over a
 * street named after a state), then a city map, then a safe default.
 */
export function deriveEstado(row) {
  const segments = String(row?.address ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const hit = STATE_BY_NORM.get(normalize(segments[i]));
    if (hit) return hit;
  }

  const byCity = CITY_TO_STATE.get(normalize(row?.city));
  if (byCity) return byCity;

  return DEFAULT_ESTADO;
}

/** Clamp a building name into our 3..120 char `nombre` bounds. */
export function clampNombre(name) {
  let value = String(name ?? '').trim();
  if (value.length > 120) value = value.slice(0, 120);
  if (value.length < 3) value = `Edificio ${value}`.trim();
  if (value.length < 3) value = 'Edificio sin nombre';
  return value;
}

/** Clamp a city into our 2..80 char `ciudad` bounds. */
function clampCiudad(city) {
  const value = String(city ?? '').trim().slice(0, 80);
  return value.length >= 2 ? value : 'Desconocida';
}

/** Keep coordinates only when both are finite and in range, else null both. */
export function sanitizeCoords(lat, lng) {
  const ok =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  return ok ? { lat, lng } : { lat: null, lng: null };
}

/** Ordered, deduped, https-only source photo URLs, capped at `max`. */
export function selectFotos(row, max = MAX_FOTOS) {
  const candidates = [row?.main_photo_url, ...(Array.isArray(row?.media_urls) ? row.media_urls : [])];
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    if (!/^https:\/\//i.test(candidate)) continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    out.push(candidate);
    if (out.length >= max) break;
  }
  return out;
}

/** Build a public description from the report's own content (no attribution). */
export function buildDescripcion(row) {
  const lines = [];
  const notes = String(row?.notes ?? '').trim();
  if (notes) lines.push(notes);

  const trapped = String(row?.trapped_names ?? '').trim();
  if (trapped) lines.push(`Posibles personas atrapadas: ${trapped}`);

  const source = String(row?.general_source ?? '').trim();
  if (source) lines.push(`Reporte: ${source}`);

  const address = String(row?.address ?? '').trim();
  if (address) lines.push(`Dirección: ${address}`);

  const text = lines.join('\n').trim();
  if (!text) return undefined;
  return text.length > 1000 ? text.slice(0, 1000) : text;
}

// Stems are matched as substrings (no word boundaries) so "colaps" matches
// "colapso" and "desaparec" matches "desaparecido".
const PERSON_SEARCH = /(se busca|desaparec|paradero|ultima vez|extraviad|persona perdida)/;
const DAMAGE_SIGNAL =
  /(colaps|derrumb|caid|cay|griet|agrietad|danad|estructural|destrucc|inclinad|fisura|fractura|desplom|escombro|se vino abajo|perdida total)/;

/**
 * A few source rows are missing-person notices ("se busca") rather than damage
 * reports and do not belong on a building map. Flag a row only when it has a
 * person-search signal AND no building-damage signal, so a real collapsed
 * building that happens to also seek its residents is kept.
 */
export function isMissingPersonReport(row) {
  // general_source is included because some posts hid "se busca" in that field.
  const text = normalize(`${row?.name ?? ''} ${row?.notes ?? ''} ${row?.general_source ?? ''}`);
  return PERSON_SEARCH.test(text) && !DAMAGE_SIGNAL.test(text);
}

/**
 * Transform a source `buildings` row into a `locations` payload, a stable
 * source_ref for idempotency, and the source photo URLs still to be re-hosted.
 */
export function transformBuilding(row) {
  const { lat, lng } = sanitizeCoords(row?.lat, row?.lng);
  const zona = String(row?.zone ?? '').trim().slice(0, 120) || undefined;
  return {
    location: {
      nombre: clampNombre(row?.name),
      estado: deriveEstado(row),
      ciudad: clampCiudad(row?.city),
      zona,
      status: mapDamageToStatus(row?.damage_level),
      descripcion: buildDescripcion(row),
      lat,
      lng,
      fotos: [],
    },
    sourceRef: `${SOURCE_BASE}/edificio/${row?.id}`,
    sourceFotoUrls: selectFotos(row, MAX_FOTOS),
  };
}

export { MAX_FOTOS, SOURCE_BASE };
