/**
 * Zod validation schemas for all user-submitted input. These are the single
 * trust boundary: every server action validates with these before touching the
 * data store. Enum sources of truth live in `types.ts`.
 */
import { z } from 'zod';

import { normalizeFundraiserUrl } from './fundraiser-url';
import {
  EMERGENCY_STATUSES,
  FUENTE_REPORTE,
  MAX_FOTOS,
  NEED_CATEGORIES,
  NEED_STATUSES,
  PERSONAS_ATRAPADAS,
  PERSONAS_ATRAPADAS_DEFAULT,
  URGENCIES,
} from './types';

export const emergencyStatusSchema = z.enum(EMERGENCY_STATUSES);
export const personasAtrapadasSchema = z.enum(PERSONAS_ATRAPADAS).default(PERSONAS_ATRAPADAS_DEFAULT);
export const urgencySchema = z.enum(URGENCIES);
export const needCategorySchema = z.enum(NEED_CATEGORIES);
export const needStatusSchema = z.enum(NEED_STATUSES);

/**
 * Accepts any valid fuente value, maps empty string and null to undefined
 * so an unselected <select> does not fail validation.
 */
export const fuenteReporteSchema = z.preprocess(
  (v) => (v == null || v === '' ? undefined : v),
  z.enum(FUENTE_REPORTE).optional(),
);

/** Treats empty strings as "not provided" so optional form fields validate. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value));

/** Accepts public http(s) URLs and inline data:image URLs (demo mode). */
const fotoUrl = z.string().refine((value) => {
  // Production: only https URLs (Supabase Storage public URLs).
  if (/^https:\/\//i.test(value)) return true;
  // Demo only (no Supabase configured, never the shared DB): inline raster
  // data URLs, never SVG (which can carry scripts).
  const demo = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return demo && /^data:image\//i.test(value) && !/^data:image\/svg/i.test(value);
}, 'URL de imagen no valida');

export const createLocationSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre del lugar es muy corto')
    .max(120, 'El nombre es muy largo'),
  estado: z.string().trim().min(2, 'Indica el estado').max(60),
  ciudad: z.string().trim().min(2, 'Indica la ciudad o municipio').max(80),
  zona: optionalText(120),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  accuracyM: z.number().nonnegative().nullable().optional(),
  status: emergencyStatusSchema,
  personas_atrapadas: personasAtrapadasSchema,
  fuente_reporte: fuenteReporteSchema,
  tipo_construccion: optionalText(200),
  descripcion: optionalText(1000),
  contactoNombre: optionalText(80),
  contactoTelefono: optionalText(40),
  fotos: z.array(fotoUrl).max(MAX_FOTOS, `Maximo ${MAX_FOTOS} fotos`).optional(),
});

export const createNeedSchema = z.object({
  locationId: z.string().trim().min(1),
  categoria: needCategorySchema,
  descripcion: z
    .string()
    .trim()
    .min(3, 'Describe brevemente lo que se necesita')
    .max(500, 'La descripcion es muy larga'),
  cantidad: optionalText(60),
  urgencia: urgencySchema,
});

export const updateNeedStatusSchema = z.object({
  id: z.string().min(1),
  status: needStatusSchema,
});

export const updateLocationStatusSchema = z.object({
  id: z.string().min(1),
  status: emergencyStatusSchema,
});

export const createFundraiserSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'El titulo es muy corto')
    .max(120, 'El titulo es muy largo'),
  descripcion: z
    .string()
    .trim()
    .min(10, 'La descripcion es muy corta'),
  url: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizeFundraiserUrl(value);
      if (normalized === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Debe ser un enlace de GoFundMe (gofundme.com).',
        });
        return z.NEVER;
      }
      return normalized;
    }),
  organizador: optionalText(80),
});

export type CreateLocationValues = z.infer<typeof createLocationSchema>;
export type CreateNeedValues = z.infer<typeof createNeedSchema>;
export type CreateFundraiserValues = z.infer<typeof createFundraiserSchema>;
