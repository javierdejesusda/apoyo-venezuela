/**
 * Domain types for the Ayuda Venezuela relief coordination app.
 *
 * The enum-like values are declared as `as const` tuples so they can be the
 * single source of truth shared between TypeScript unions (here) and the Zod
 * validation schemas (see `schemas.ts`).
 */

/** Structural condition reported for an emergency zone. */
export const EMERGENCY_STATUSES = [
  'derrumbe', // building(s) collapsed - people may be trapped
  'danado', // damaged but standing - risk present
  'estable', // structurally stable / safe to approach
  'desconocido', // not yet confirmed
] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];

/** How urgent a specific need is. */
export const URGENCIES = ['alta', 'media', 'baja'] as const;
export type Urgency = (typeof URGENCIES)[number];

/** What kind of help/supply a zone is requesting. */
export const NEED_CATEGORIES = [
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
] as const;
export type NeedCategory = (typeof NEED_CATEGORIES)[number];

/** Lifecycle of a single need. */
export const NEED_STATUSES = [
  'pendiente', // nobody is covering it yet
  'en_camino', // someone committed to bring/do it
  'cubierto', // resolved
] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];

/** The 24 federal entities of Venezuela (for the report form). */
export const VENEZUELA_STATES = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
] as const;
export type VenezuelaState = (typeof VENEZUELA_STATES)[number];

/** A reported emergency zone. */
export interface LocationRecord {
  id: string;
  nombre: string;
  estado: string;
  ciudad: string;
  zona?: string;
  lat: number | null;
  lng: number | null;
  /** Saved coordinate uncertainty radius in meters; null means exact. */
  accuracyM?: number | null;
  status: EmergencyStatus;
  descripcion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  fotos?: string[];
  createdAt: string;
  updatedAt: string;
}

/** A single need attached to a zone. */
export interface NeedRecord {
  id: string;
  locationId: string;
  categoria: NeedCategory;
  descripcion: string;
  cantidad?: string;
  urgencia: Urgency;
  status: NeedStatus;
  createdAt: string;
  updatedAt: string;
}

/** A zone together with its needs and a small derived summary. */
export interface LocationWithNeeds extends LocationRecord {
  needs: NeedRecord[];
  summary: NeedSummary;
}

/** Counts derived from a zone's needs, used across cards and the map. */
export interface NeedSummary {
  total: number;
  pendientes: number;
  enCamino: number;
  cubiertos: number;
  urgentes: number;
}

export interface CreateLocationInput {
  nombre: string;
  estado: string;
  ciudad: string;
  zona?: string;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  status: EmergencyStatus;
  descripcion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  fotos?: string[];
}

/** Maximum number of photos a single zone report may attach. */
export const MAX_FOTOS = 4;

/** Maximum size of a single uploaded photo, in megabytes (used in UI copy). */
export const MAX_FOTO_MB = 10;

/**
 * Maximum size of a single uploaded photo, in bytes. Kept in sync with the
 * Storage bucket's `file_size_limit` (see the fotos migrations).
 */
export const MAX_FOTO_BYTES = MAX_FOTO_MB * 1024 * 1024;

export interface CreateNeedInput {
  locationId: string;
  categoria: NeedCategory;
  descripcion: string;
  cantidad?: string;
  urgencia: Urgency;
}

/** Filters applied to the zone list/map on the home screen. */
export interface LocationFilters {
  estado?: string;
  status?: EmergencyStatus;
  categoria?: NeedCategory;
  soloUrgentes?: boolean;
  texto?: string;
}

/** Category of an emergency phone contact (matches research output). */
export const CONTACT_CATEGORIES = [
  'hotline',
  'proteccion_civil',
  'bomberos',
  'cruz_roja',
  'policia',
  'hospital',
  'medico',
  'rescate',
  'apoyo_psicologico',
  'otro',
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface EmergencyContact {
  organization: string;
  category: ContactCategory;
  phones: string[];
  verified: boolean;
  notes?: string;
  source?: string;
}

export interface StateContacts {
  state: string;
  areaCode?: string;
  contacts: EmergencyContact[];
}

/** A community-submitted GoFundMe fundraiser campaign. */
export interface Fundraiser {
  id: string;
  titulo: string;
  descripcion: string;
  /** Normalized GoFundMe link (https, no query/hash). Unique per campaign. */
  url: string;
  organizador?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFundraiserInput {
  titulo: string;
  descripcion: string;
  url: string;
  organizador?: string;
}

/** Generic resource entry (aid orgs, shelters, supply guidance, national lines). */
export interface ResourceItem {
  name: string;
  category?: string;
  description?: string;
  phones?: string[];
  urls?: string[];
  location?: string;
  verified?: boolean;
  source?: string;
}
