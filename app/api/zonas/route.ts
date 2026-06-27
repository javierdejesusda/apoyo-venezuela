/**
 * Dynamic Route Handler for paginated zone fetches.
 * Used by HomeExplorer when the full set exceeds PAGE_SIZE and when the
 * user requests additional pages via the "Ver más" button.
 * Supports ?all=true to return every matching zone for the map surface.
 */
import { stripContactPii } from '@/lib/data/selectors';
import { getStore, PAGE_SIZE } from '@/lib/data/store';
import type { LocationFilters } from '@/lib/data/types';
import { EMERGENCY_STATUSES, NEED_CATEGORIES, URGENCIES } from '@/lib/data/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const estado = searchParams.get('estado') ?? undefined;
  const ciudad = searchParams.get('ciudad') ?? undefined;
  const rawStatus = searchParams.get('status');
  const rawCategoria = searchParams.get('categoria');
  const rawUrgencia = searchParams.get('urgencia');
  const texto = searchParams.get('texto') ?? undefined;
  const all = searchParams.get('all') === 'true';
  const cursor = Math.max(0, parseInt(searchParams.get('cursor') ?? '0', 10) || 0);

  const filters: LocationFilters = {};
  if (estado) filters.estado = estado;
  if (ciudad) filters.ciudad = ciudad;
  if (rawStatus && (EMERGENCY_STATUSES as readonly string[]).includes(rawStatus)) {
    filters.status = rawStatus as LocationFilters['status'];
  }
  if (rawCategoria && (NEED_CATEGORIES as readonly string[]).includes(rawCategoria)) {
    filters.categoria = rawCategoria as LocationFilters['categoria'];
  }
  if (rawUrgencia && (URGENCIES as readonly string[]).includes(rawUrgencia)) {
    filters.urgencia = rawUrgencia as LocationFilters['urgencia'];
  }
  if (texto) filters.texto = texto;
  if (searchParams.get('soloConPedidos') === 'true') filters.soloConPedidos = true;

  // all=true: map surface needs every matching zone; Infinity tells the store
  // to skip slicing. Paginated mode uses the cursor offset and PAGE_SIZE limit.
  const offset = all ? 0 : cursor;
  const limit = all ? Infinity : PAGE_SIZE;
  const { items, total } = await getStore().listLocationsPage(filters, offset, limit);
  // The list/map surfaces never display reporter contact details; strip them so
  // phone numbers are not served in bulk to every visitor.
  const publicItems = items.map(stripContactPii);
  const nextCursor = all ? null : offset + items.length < total ? offset + items.length : null;

  return Response.json({ items: publicItems, total, nextCursor });
}
