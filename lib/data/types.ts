/**
 * Domain types for the Ayuda Venezuela relief coordination app.
 *
 * The enum-like values are declared as `as const` tuples so they can be the
 * single source of truth shared between TypeScript unions (here) and the Zod
 * validation schemas (see `schemas.ts`).
 */

/** Structural condition reported for an emergency zone (ordered most-to-least critical). */
export const EMERGENCY_STATUSES = [
  'derrumbe',    // rank 0: building(s) collapsed - people may be trapped
  'dano_grave',  // rank 1: severe structural damage - imminent risk
  'dano_parcial', // rank 2: partial damage - risk present (replaces legacy 'danado')
  'desconocido', // rank 3: not yet confirmed
  'estable',     // rank 4: structurally stable / safe to approach
] as const;
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];

/** Whether trapped persons are reported at this zone. */
export const PERSONAS_ATRAPADAS = ['si', 'no', 'no_se'] as const;
export type PersonasAtrapadas = (typeof PERSONAS_ATRAPADAS)[number];
/** Default value when no information is available about trapped persons. */
export const PERSONAS_ATRAPADAS_DEFAULT: PersonasAtrapadas = 'no_se';

/** Source channel for a zone report. */
export const FUENTE_REPORTE = ['vecino', 'video', 'noticia', 'organismo', 'otro'] as const;
export type FuenteReporte = (typeof FUENTE_REPORTE)[number];

/** Human-readable es_VE labels for each fuente_reporte value. */
export const FUENTE_REPORTE_LABELS: Record<FuenteReporte, string> = {
  vecino: 'Vecino',
  video: 'Video',
  noticia: 'Noticia',
  organismo: 'Organismo oficial',
  otro: 'Otro',
};

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
  /** Whether trapped persons are reported; absent/null treated as 'no_se' by consumers. */
  personas_atrapadas?: PersonasAtrapadas;
  /** Whether this location accepts volunteers; absent treated as false (the
   *  store always sets it, mirroring personas_atrapadas/fuente_reporte). */
  acepta_voluntarios?: boolean;
  /** Source channel for this report; null when not specified. */
  fuente_reporte?: FuenteReporte | null;
  /** Construction type of the affected structure; null when not specified. */
  tipo_construccion?: string | null;
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
  personas_atrapadas?: PersonasAtrapadas;
  /** Whether this location accepts volunteers; absent treated as false. */
  acepta_voluntarios?: boolean;
  fuente_reporte?: FuenteReporte | null;
  tipo_construccion?: string | null;
  descripcion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  fotos?: string[];
}

/** Maximum reports allowed per key within the quota sliding window. */
export const REPORT_QUOTA_LIMIT = 20;

/** Sliding window duration for the per-key report quota, in milliseconds (10 minutes). */
export const REPORT_QUOTA_WINDOW_MS = 10 * 60 * 1000;

/** Maximum number of photos a single zone report may attach. */
export const MAX_FOTOS = 8;

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

/** Which half of the explorer the user is browsing. */
export type ExplorerMode = 'ayuda' | 'danos';

/** Filters applied to the zone list/map on the home screen. */
export interface LocationFilters {
  estado?: string;
  /** Ciudad filter (applied in a later release; param plumbing available now). */
  ciudad?: string;
  status?: EmergencyStatus;
  categoria?: NeedCategory;
  urgencia?: Urgency;
  texto?: string;
  /** Ayuda mode: exclude zones with no open (pendiente or en_camino) needs. */
  soloConPedidos?: boolean;
  /** Keep only locations flagged as accepting volunteers. */
  soloVoluntarios?: boolean;
}

/** Default number of locations per page for the bounded home list. */
export const PAGE_SIZE = 20;

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

/** Reason categories a person can choose when asking that a report be removed. */
export const REMOVAL_REASONS = ['resuelto', 'duplicado', 'incorrecto', 'otro'] as const;
export type RemovalReason = (typeof REMOVAL_REASONS)[number];

/** Human-readable es_VE labels for each removal reason (kept >= 5 chars so the
 *  composed motivo always satisfies the removal_requests length CHECK). */
export const REMOVAL_REASON_LABELS: Record<RemovalReason, string> = {
  resuelto: 'Ya fue atendido o resuelto',
  duplicado: 'Es un duplicado de otro reporte',
  incorrecto: 'La informacion es incorrecta',
  otro: 'Otro motivo',
};

/** Input for queueing a public report-removal request. */
export interface RequestRemovalInput {
  locationId: string;
  motivo: string;
  contacto?: string;
}

/**
 * A queued request to take a report down. Reviewed by the maintainer out of
 * band; it never deletes anything by itself (deletion stays manual via
 * `npm run delete-report`).
 */
export interface RemovalRequestRecord {
  id: string;
  locationId: string;
  motivo: string;
  contacto?: string;
  createdAt: string;
}

// Zone clustering (secret infrastructure; see 20260630000000_zone_clustering.sql).

/** A canonical cluster grouping co-located zone reports. */
export interface ZoneCluster {
  id: string;
  canonicalLocationId: string;
  createdAt: string;
  updatedAt: string;
}

/** Membership record linking a location to its cluster. */
export interface ZoneClusterMember {
  clusterId: string;
  locationId: string;
}

/** Discriminated union of auditable events within a cluster. */
export type ZoneUpdateKind = 'report_added' | 'status_changed' | 'merged_duplicate';

/** Audit event stored on the cluster when its members or status changes. */
export interface ZoneUpdate {
  id: string;
  clusterId: string;
  kind: ZoneUpdateKind;
  note: string | null;
  createdAt: string;
}

/** Flattened timeline entry used in the canonical cluster view. */
export interface TimelineEntry {
  id: string;
  kind: ZoneUpdateKind;
  note: string | null;
  createdAt: string;
}

/**
 * Canonical view of a cluster, aggregated from the cluster's members.
 * NOTE: no 'verificado' field - the app never claims verification.
 */
export interface ClusterCanonicalView {
  canonicalLocationId: string;
  status: EmergencyStatus;
  personas_atrapadas: PersonasAtrapadas;
  fotos: string[];
  updatedAt: string;
  memberCount: number;
  timeline: TimelineEntry[];
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
