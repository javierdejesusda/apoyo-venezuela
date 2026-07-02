/**
 * MCP server exposing the same read-only public data as the REST API v1
 * (`/app/api/v1/**`). Tools call the same store queries and DTO builders the
 * REST routes use, so the two surfaces can never drift apart. Streamable HTTP
 * only (no separate legacy SSE/message endpoints) at a single fixed path.
 *
 * Each tool's handler is exported as a plain async function (not inlined into
 * `registerTool`) so it can be unit-tested directly, the same way the REST
 * route handlers in `app/api/v1/**` are tested without going through the HTTP
 * transport.
 *
 * `GET` is handled directly in this file rather than delegated to
 * `mcp-handler`: per the Streamable HTTP transport spec, a client MAY probe
 * the MCP endpoint with GET to open a listening SSE stream before ever
 * sending POST, and a plain 405 is a legal response to that probe. In
 * practice, though, Claude.ai's and ChatGPT's remote-connector clients treat
 * that 405 as "unreachable" and refuse to connect at all, and `mcp-handler`
 * (as of 1.1.0) always answers GET on the streamable endpoint with 405 with
 * no way to configure otherwise. Since none of the tools below need
 * server-initiated pushes, this just opens an idle heartbeat stream to
 * satisfy that probe; all real request/response traffic still goes over
 * POST via `handler`.
 */
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';

import { clampPagination, parseUuid } from '@/lib/api/params';
import { listPublicPedidos } from '@/lib/api/pedidos';
import { buildPublicStats, toPublicCampana, toPublicZona } from '@/lib/api/public-shape';
import { getStore } from '@/lib/data/store';
import {
  EMERGENCY_STATUSES,
  FUENTE_REPORTE,
  NEED_CATEGORIES,
  NEED_STATUSES,
  PERSONAS_ATRAPADAS,
  URGENCIES,
} from '@/lib/data/types';
import type { LocationFilters } from '@/lib/data/types';

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

/**
 * A single `{ type: 'text' }` tool result carrying a JSON-encoded payload,
 * mirrored in `structuredContent` for the tools that declare an `outputSchema`
 * (required by the SDK whenever one is present, validated against it).
 */
function jsonResult(payload: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload };
}

/** Same non-leaking contract as `withApiError`: never surface the raw error. */
function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

/** Wraps a tool handler so a store/Supabase failure becomes a safe error result. */
function withToolError<A extends unknown[]>(
  handler: (...args: A) => Promise<ToolResult>,
) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch {
      return errorResult('Error interno.');
    }
  };
}

const paginationShape = {
  cursor: z.number().int().min(0).optional().describe('Desplazamiento para paginar.'),
  limit: z.number().int().min(1).max(100).optional().describe('Tamano de pagina (maximo 100).'),
};

interface PaginationArgs {
  cursor?: number;
  limit?: number;
}

interface ListZonasArgs extends PaginationArgs {
  estado?: string;
  ciudad?: string;
  status?: (typeof EMERGENCY_STATUSES)[number];
  categoria?: (typeof NEED_CATEGORIES)[number];
  urgencia?: (typeof URGENCIES)[number];
  texto?: string;
  soloConPedidos?: boolean;
}

export const listZonasTool = withToolError(
  async ({ estado, ciudad, status, categoria, urgencia, texto, soloConPedidos, cursor, limit }: ListZonasArgs) => {
    const filters: LocationFilters = {};
    if (estado) filters.estado = estado;
    if (ciudad) filters.ciudad = ciudad;
    if (status) filters.status = status;
    if (categoria) filters.categoria = categoria;
    if (urgencia) filters.urgencia = urgencia;
    if (texto) filters.texto = texto;
    if (soloConPedidos) filters.soloConPedidos = true;

    const { cursor: safeCursor, limit: safeLimit } = clampPagination(cursor, limit);
    const { items, total } = await getStore().listLocationsPage(filters, safeCursor, safeLimit);
    const data = items.map((loc) => toPublicZona(loc));
    const nextCursor = safeCursor + items.length < total ? safeCursor + items.length : null;
    return jsonResult({ data, pagination: { total, nextCursor } });
  },
);

export const getZonaTool = withToolError(async ({ id }: { id: string }) => {
  const uuid = parseUuid(id);
  if (!uuid) return errorResult('Zona no encontrada.');
  const location = await getStore().getLocation(uuid);
  if (!location) return errorResult('Zona no encontrada.');
  return jsonResult({ data: toPublicZona(location, true) });
});

interface ListPedidosArgs extends PaginationArgs {
  estado?: string;
  categoria?: (typeof NEED_CATEGORIES)[number];
  urgencia?: (typeof URGENCIES)[number];
  status?: (typeof NEED_STATUSES)[number];
}

export const listPedidosTool = withToolError(
  async ({ estado, categoria, urgencia, status, cursor, limit }: ListPedidosArgs) => {
    const { cursor: safeCursor, limit: safeLimit } = clampPagination(cursor, limit);
    const { data, total } = await listPublicPedidos({ estado, categoria, urgencia, status }, safeCursor, safeLimit);
    const nextCursor = safeCursor + data.length < total ? safeCursor + data.length : null;
    return jsonResult({ data, pagination: { total, nextCursor } });
  },
);

export const listCampanasTool = withToolError(async () => {
  const campanas = (await getStore().listFundraisers()).map(toPublicCampana);
  return jsonResult({ data: campanas, pagination: { total: campanas.length, nextCursor: null } });
});

export const getEstadisticasTool = withToolError(async () => {
  const locations = await getStore().listLocations();
  return jsonResult({ data: buildPublicStats(locations) });
});

/**
 * Zod mirrors of the `PublicX` DTOs in `lib/api/public-shape.ts`, used as each
 * tool's `outputSchema`. Kept separate from the JSON-Schema OpenAPI contract in
 * `lib/api/openapi.ts` because the MCP SDK requires `outputSchema` to be a Zod
 * raw shape (same convention as `inputSchema`), not a `$ref`-based JSON Schema.
 */
const ubicacionSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  precisionAprox: z.string(),
});

const contactoSchema = z.object({
  nombre: z.string().optional(),
  telefono: z.string().optional(),
});

const resumenSchema = z.object({
  totalPedidos: z.number().int(),
  pendientes: z.number().int(),
  enCamino: z.number().int(),
  cubiertos: z.number().int(),
  urgentes: z.number().int(),
});

const pedidoSchema = z.object({
  id: z.string(),
  categoria: z.enum(NEED_CATEGORIES),
  descripcion: z.string(),
  cantidad: z.string().optional(),
  urgencia: z.enum(URGENCIES),
  status: z.enum(NEED_STATUSES),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

const pedidoConZonaSchema = pedidoSchema.extend({
  zonaId: z.string(),
  zonaNombre: z.string(),
  ciudad: z.string(),
  estado: z.string(),
});

const zonaSchema = z.object({
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
  /** Present only on the detail tool (`get_zona`); omitted on bulk lists. */
  contacto: contactoSchema.nullable().optional(),
  fotos: z.array(z.string()),
  resumen: resumenSchema,
  pedidos: z.array(pedidoSchema),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

const campanaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  url: z.string(),
  organizador: z.string().optional(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

const statsSchema = z.object({
  zonas: z.number().int(),
  zonasPorStatus: z.record(z.string(), z.number().int()),
  pedidosTotales: z.number().int(),
  pedidosAbiertos: z.number().int(),
  pedidosPorCategoria: z.record(z.string(), z.number().int()),
  pedidosPorUrgencia: z.record(z.string(), z.number().int()),
});

const paginationSchema = z.object({
  total: z.number().int(),
  nextCursor: z.number().int().nullable(),
});

/** All tools here are read-only, closed-world queries against our own store: no writes, no side effects, no open-world/web access. */
const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_zonas',
      {
        title: 'Listar zonas afectadas',
        description:
          'Lista zonas afectadas por el terremoto en Venezuela, con estado estructural, ' +
          'ubicacion aproximada y sus pedidos de ayuda. Equivalente a GET /api/v1/zonas.',
        inputSchema: {
          estado: z.string().optional().describe('Filtra por estado de Venezuela.'),
          ciudad: z.string().optional().describe('Filtra por ciudad.'),
          status: z.enum(EMERGENCY_STATUSES).optional().describe('Filtra por estado estructural.'),
          categoria: z.enum(NEED_CATEGORIES).optional().describe('Filtra zonas con un pedido de esta categoria.'),
          urgencia: z.enum(URGENCIES).optional().describe('Filtra zonas con un pedido de esta urgencia.'),
          texto: z.string().optional().describe('Busca por texto libre en nombre/descripcion.'),
          soloConPedidos: z.boolean().optional().describe('Si es true, excluye zonas sin pedidos abiertos.'),
          ...paginationShape,
        },
        outputSchema: {
          data: z.array(zonaSchema),
          pagination: paginationSchema,
        },
        annotations: readOnlyAnnotations,
      },
      listZonasTool,
    );

    server.registerTool(
      'get_zona',
      {
        title: 'Obtener zona por id',
        description:
          'Obtiene el detalle de una zona afectada por su id, incluyendo el contacto del ' +
          'reportero. Equivalente a GET /api/v1/zonas/{id}.',
        inputSchema: {
          id: z.string().describe('UUID de la zona.'),
        },
        outputSchema: {
          data: zonaSchema,
        },
        annotations: readOnlyAnnotations,
      },
      getZonaTool,
    );

    server.registerTool(
      'list_pedidos',
      {
        title: 'Listar pedidos de ayuda',
        description:
          'Lista, en formato plano, los pedidos de ayuda (agua, alimentos, medicinas, etc.) de ' +
          'todas las zonas, con el contexto minimo de su zona. Equivalente a GET /api/v1/pedidos.',
        inputSchema: {
          estado: z.string().optional().describe('Filtra por estado de Venezuela.'),
          categoria: z.enum(NEED_CATEGORIES).optional(),
          urgencia: z.enum(URGENCIES).optional(),
          status: z.enum(NEED_STATUSES).optional(),
          ...paginationShape,
        },
        outputSchema: {
          data: z.array(pedidoConZonaSchema),
          pagination: paginationSchema,
        },
        annotations: readOnlyAnnotations,
      },
      listPedidosTool,
    );

    server.registerTool(
      'list_campanas',
      {
        title: 'Listar campanas de recaudacion',
        description:
          'Lista las campanas de recaudacion de fondos (GoFundMe) registradas. Equivalente a ' +
          'GET /api/v1/campanas.',
        inputSchema: {},
        outputSchema: {
          data: z.array(campanaSchema),
          pagination: paginationSchema,
        },
        annotations: readOnlyAnnotations,
      },
      listCampanasTool,
    );

    server.registerTool(
      'get_estadisticas',
      {
        title: 'Obtener estadisticas agregadas',
        description:
          'Devuelve conteos agregados de zonas y pedidos (por estado estructural, categoria y ' +
          'urgencia). Equivalente a GET /api/v1/estadisticas.',
        inputSchema: {},
        outputSchema: {
          data: statsSchema,
        },
        annotations: readOnlyAnnotations,
      },
      getEstadisticasTool,
    );
  },
  {},
  { basePath: '/api', disableSse: true },
);

export const runtime = 'nodejs';
export const maxDuration = 30;

const SSE_HEARTBEAT_MS = 20_000;

/** Idle SSE stream so GET-probing connectors see a live server, not a 405. */
export function GET(request: Request): Response {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, SSE_HEARTBEAT_MS);
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Stream already closed.
        }
      });
    },
    cancel() {
      clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

export { handler as POST };
