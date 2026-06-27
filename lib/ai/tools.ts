import { tool } from 'ai';
import { z } from 'zod';

import { getStore } from '@/lib/data/store';
import type { DataStore } from '@/lib/data/store';
import { NEED_CATEGORIES } from '@/lib/data/types';
import type { EmergencyStatus, LocationFilters, LocationWithNeeds, NeedCategory, NeedStatus, Urgency } from '@/lib/data/types';

/** Maximum zones returned per buscarZonas call (keeps token usage bounded). */
const MAX_RESULTS = 8;

/** Need shape exposed to the LLM (no IDs or timestamps). */
export interface ModelNeed {
  categoria: NeedCategory;
  urgencia: Urgency;
  status: NeedStatus;
  descripcion: string;
}

/** Zone shape exposed to the LLM - strips PII and infrastructure fields. */
export interface ModelZona {
  nombre: string;
  estado: string;
  ciudad: string;
  zona?: string;
  status: EmergencyStatus;
  needs: ModelNeed[];
}

/** Converts a full LocationWithNeeds to a PII-stripped shape safe to send to the LLM. */
export function toModelZona(z_: LocationWithNeeds): ModelZona {
  const result: ModelZona = {
    nombre: z_.nombre,
    estado: z_.estado,
    ciudad: z_.ciudad,
    status: z_.status,
    needs: z_.needs.map((n) => ({
      categoria: n.categoria,
      urgencia: n.urgencia,
      status: n.status,
      descripcion: n.descripcion,
    })),
  };
  if (z_.zona !== undefined) {
    result.zona = z_.zona;
  }
  return result;
}

/**
 * Queries the data store and returns PII-stripped zones capped to MAX_RESULTS.
 * All query dimensions come from LocationFilters; no extra params are added.
 */
export async function buscarZonasQuery(
  store: DataStore,
  filters: LocationFilters,
): Promise<ModelZona[]> {
  const locations = await store.listLocations(filters);
  return locations.slice(0, MAX_RESULTS).map(toModelZona);
}

/**
 * Tool exposed to the LLM for searching relief zones.
 * Parameters map to LocationFilters; soloUrgentes maps to urgencia='alta'.
 */
export const buscarZonas = tool({
  description:
    'Busca zonas de emergencia en Venezuela que necesitan ayuda. ' +
    'Usa esta herramienta antes de responder cualquier pregunta sobre zonas o necesidades.',
  inputSchema: z.object({
    categoria: z
      .enum(NEED_CATEGORIES)
      .optional()
      .describe('Tipo de ayuda que necesita la zona (agua, medicinas, etc.)'),
    estado: z
      .string()
      .optional()
      .describe('Estado venezolano para filtrar (p.ej. Carabobo, Zulia)'),
    soloUrgentes: z
      .boolean()
      .optional()
      .describe('Si es verdadero, retorna solo zonas con necesidades de urgencia alta'),
    texto: z
      .string()
      .optional()
      .describe('Texto libre para buscar por nombre, ciudad o descripcion'),
  }),
  execute: async ({ categoria, estado, soloUrgentes, texto }) => {
    const filters: LocationFilters = {};
    if (categoria) filters.categoria = categoria;
    if (estado) filters.estado = estado;
    if (soloUrgentes) filters.urgencia = 'alta';
    if (texto) filters.texto = texto;
    return buscarZonasQuery(getStore(), filters);
  },
});
