/**
 * Anti-corruption layer for the public REST API (v1).
 *
 * Pure, framework-free transformers that map the internal domain model to the
 * public DTOs returned by /api/v1. They build every output object field by
 * field from an explicit allowlist, so any internal column (source_ref, cluster
 * ids, throttle hashes, exact accuracy) can never leak into a public response,
 * even if it is later added to the domain model.
 *
 * Each `PublicX` interface has a matching `xSchema` Zod mirror declared right
 * beneath it, consumed by the MCP route (`app/api/mcp/route.ts`) as tool
 * `outputSchema`s. They're kept side by side so a field never gets added to
 * one and forgotten in the other. `lib/api/openapi.ts` still hand-authors its
 * own JSON Schema for the REST docs; that's the last copy of this shape left,
 * and could be replaced with `z.toJSONSchema(xSchema)` (native since Zod v4)
 * to collapse it down to one definition too.
 */
import { z } from 'zod';

import {
  EMERGENCY_STATUSES,
  FUENTE_REPORTE,
  NEED_CATEGORIES,
  NEED_STATUSES,
  PERSONAS_ATRAPADAS,
  PERSONAS_ATRAPADAS_DEFAULT,
  URGENCIES,
} from '@/lib/data/types';
import type {
  EmergencyStatus,
  FuenteReporte,
  Fundraiser,
  LocationWithNeeds,
  NeedCategory,
  NeedRecord,
  NeedStatus,
  NeedSummary,
  PersonasAtrapadas,
  Urgency,
} from '@/lib/data/types';

/** Number of decimal places kept for public coordinates (3 decimals is ~110m). */
const COORD_DECIMALS = 3;

/** Human-readable label for the reduced coordinate precision. */
const COORD_PRECISION_LABEL = '~110m';

export interface PublicUbicacion {
  lat: number;
  lng: number;
  precisionAprox: string;
}

export const ubicacionSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  precisionAprox: z.string(),
});

export interface PublicContacto {
  nombre?: string;
  telefono?: string;
}

export const contactoSchema = z.object({
  nombre: z.string().optional(),
  telefono: z.string().optional(),
});

export interface PublicResumen {
  totalPedidos: number;
  pendientes: number;
  enCamino: number;
  cubiertos: number;
  urgentes: number;
}

export const resumenSchema = z.object({
  totalPedidos: z.number().int(),
  pendientes: z.number().int(),
  enCamino: z.number().int(),
  cubiertos: z.number().int(),
  urgentes: z.number().int(),
});

export interface PublicPedido {
  id: string;
  categoria: NeedCategory;
  descripcion: string;
  cantidad?: string;
  urgencia: Urgency;
  status: NeedStatus;
  creadoEn: string;
  actualizadoEn: string;
}

export const pedidoSchema = z.object({
  id: z.string(),
  categoria: z.enum(NEED_CATEGORIES),
  descripcion: z.string(),
  cantidad: z.string().optional(),
  urgencia: z.enum(URGENCIES),
  status: z.enum(NEED_STATUSES),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

export interface PublicPedidoConZona extends PublicPedido {
  zonaId: string;
  zonaNombre: string;
  ciudad: string;
  estado: string;
}

export const pedidoConZonaSchema = pedidoSchema.extend({
  zonaId: z.string(),
  zonaNombre: z.string(),
  ciudad: z.string(),
  estado: z.string(),
});

export interface PublicZona {
  id: string;
  nombre: string;
  estado: string;
  ciudad: string;
  zona?: string;
  ubicacion: PublicUbicacion | null;
  status: EmergencyStatus;
  personasAtrapadas: PersonasAtrapadas;
  aceptaVoluntarios: boolean;
  fuenteReporte: FuenteReporte | null;
  tipoConstruccion: string | null;
  descripcion?: string;
  /** Present only on the detail endpoint; omitted entirely on bulk surfaces. */
  contacto?: PublicContacto | null;
  fotos: string[];
  resumen: PublicResumen;
  pedidos: PublicPedido[];
  creadoEn: string;
  actualizadoEn: string;
}

export const zonaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  estado: z.string(),
  ciudad: z.string(),
  zona: z.string().optional(),
  ubicacion: ubicacionSchema.nullable(),
  status: z.enum(EMERGENCY_STATUSES),
  personasAtrapadas: z.enum(PERSONAS_ATRAPADAS),
  aceptaVoluntarios: z.boolean(),
  fuenteReporte: z.enum(FUENTE_REPORTE).nullable(),
  tipoConstruccion: z.string().nullable(),
  descripcion: z.string().optional(),
  /** Present only on the detail endpoint; omitted entirely on bulk surfaces. */
  contacto: contactoSchema.nullable().optional(),
  fotos: z.array(z.string()),
  resumen: resumenSchema,
  pedidos: z.array(pedidoSchema),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

export interface PublicCampana {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  organizador?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export const campanaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  url: z.string(),
  organizador: z.string().optional(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

export interface PublicStats {
  zonas: number;
  zonasPorStatus: Record<EmergencyStatus, number>;
  pedidosTotales: number;
  pedidosAbiertos: number;
  pedidosPorCategoria: Record<NeedCategory, number>;
  pedidosPorUrgencia: Record<Urgency, number>;
}

export const statsSchema = z.object({
  zonas: z.number().int(),
  zonasPorStatus: z.record(z.string(), z.number().int()),
  pedidosTotales: z.number().int(),
  pedidosAbiertos: z.number().int(),
  pedidosPorCategoria: z.record(z.string(), z.number().int()),
  pedidosPorUrgencia: z.record(z.string(), z.number().int()),
});

export interface PublicPagination {
  total: number;
  nextCursor: number | null;
}

export const paginationSchema = z.object({
  total: z.number().int(),
  nextCursor: z.number().int().nullable(),
});

/** Rounds a single coordinate to the public precision (3 decimals). */
export function roundCoord(value: number): number {
  const factor = 10 ** COORD_DECIMALS;
  return Math.round(value * factor) / factor;
}

function toUbicacion(lat: number | null, lng: number | null): PublicUbicacion | null {
  if (lat === null || lng === null) return null;
  return { lat: roundCoord(lat), lng: roundCoord(lng), precisionAprox: COORD_PRECISION_LABEL };
}

function toContacto(nombre?: string, telefono?: string): PublicContacto | null {
  if (!nombre && !telefono) return null;
  const contacto: PublicContacto = {};
  if (nombre) contacto.nombre = nombre;
  if (telefono) contacto.telefono = telefono;
  return contacto;
}

function toResumen(summary: NeedSummary): PublicResumen {
  return {
    totalPedidos: summary.total,
    pendientes: summary.pendientes,
    enCamino: summary.enCamino,
    cubiertos: summary.cubiertos,
    urgentes: summary.urgentes,
  };
}

export function toPublicPedido(need: NeedRecord): PublicPedido {
  const pedido: PublicPedido = {
    id: need.id,
    categoria: need.categoria,
    descripcion: need.descripcion,
    urgencia: need.urgencia,
    status: need.status,
    creadoEn: need.createdAt,
    actualizadoEn: need.updatedAt,
  };
  if (need.cantidad) pedido.cantidad = need.cantidad;
  return pedido;
}

export function toPublicPedidoConZona(
  loc: LocationWithNeeds,
  need: NeedRecord,
): PublicPedidoConZona {
  return {
    ...toPublicPedido(need),
    zonaId: loc.id,
    zonaNombre: loc.nombre,
    ciudad: loc.ciudad,
    estado: loc.estado,
  };
}

/**
 * Maps a zone to its public DTO. `includeContacto` (default false) mirrors the
 * web: reporter contact is shown only on the single-zona detail page, never on
 * bulk surfaces, so only the /api/v1/zonas/{id} route opts in.
 */
export function toPublicZona(loc: LocationWithNeeds, includeContacto = false): PublicZona {
  const zona: PublicZona = {
    id: loc.id,
    nombre: loc.nombre,
    estado: loc.estado,
    ciudad: loc.ciudad,
    ubicacion: toUbicacion(loc.lat, loc.lng),
    status: loc.status,
    personasAtrapadas: loc.personas_atrapadas ?? PERSONAS_ATRAPADAS_DEFAULT,
    aceptaVoluntarios: loc.acepta_voluntarios ?? false,
    fuenteReporte: loc.fuente_reporte ?? null,
    tipoConstruccion: loc.tipo_construccion ?? null,
    fotos: loc.fotos ?? [],
    resumen: toResumen(loc.summary),
    pedidos: loc.needs.map(toPublicPedido),
    creadoEn: loc.createdAt,
    actualizadoEn: loc.updatedAt,
  };
  if (loc.zona) zona.zona = loc.zona;
  if (loc.descripcion) zona.descripcion = loc.descripcion;
  if (includeContacto) {
    zona.contacto = toContacto(loc.contactoNombre, loc.contactoTelefono);
  }
  return zona;
}

export function toPublicCampana(f: Fundraiser): PublicCampana {
  const campana: PublicCampana = {
    id: f.id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    url: f.url,
    creadoEn: f.createdAt,
    actualizadoEn: f.updatedAt,
  };
  if (f.organizador) campana.organizador = f.organizador;
  return campana;
}

function zeroedRecord<T extends string>(keys: readonly T[]): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const key of keys) out[key] = 0;
  return out;
}

export function buildPublicStats(locations: LocationWithNeeds[]): PublicStats {
  const zonasPorStatus = zeroedRecord(EMERGENCY_STATUSES);
  const pedidosPorCategoria = zeroedRecord(NEED_CATEGORIES);
  const pedidosPorUrgencia = zeroedRecord(URGENCIES);
  let pedidosTotales = 0;
  let pedidosAbiertos = 0;

  for (const loc of locations) {
    zonasPorStatus[loc.status] += 1;
    for (const need of loc.needs) {
      pedidosTotales += 1;
      if (need.status !== 'cubierto') pedidosAbiertos += 1;
      pedidosPorCategoria[need.categoria] += 1;
      pedidosPorUrgencia[need.urgencia] += 1;
    }
  }

  return {
    zonas: locations.length,
    zonasPorStatus,
    pedidosTotales,
    pedidosAbiertos,
    pedidosPorCategoria,
    pedidosPorUrgencia,
  };
}
