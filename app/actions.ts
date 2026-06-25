'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { DuplicateFundraiserError } from '@/lib/data/fundraiser-url';
import {
  createFundraiserSchema,
  createLocationSchema,
  createNeedSchema,
  updateLocationStatusSchema,
  updateNeedStatusSchema,
} from '@/lib/data/schemas';
import { getStore } from '@/lib/data/store';

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createLocationAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos del formulario.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  try {
    const location = await getStore().createLocation(parsed.data);
    revalidatePath('/');
    return { ok: true, data: { id: location.id } };
  } catch {
    return { ok: false, error: 'No se pudo guardar la zona. Intenta de nuevo.' };
  }
}

export async function createFundraiserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createFundraiserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos del formulario.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  try {
    const fundraiser = await getStore().createFundraiser(parsed.data);
    revalidatePath('/recaudaciones');
    return { ok: true, data: { id: fundraiser.id } };
  } catch (err) {
    if (err instanceof DuplicateFundraiserError) {
      return {
        ok: false,
        error: 'Revisa los datos del formulario.',
        fieldErrors: { url: 'Esta recaudacion ya esta publicada.' },
      };
    }
    return { ok: false, error: 'No se pudo guardar la recaudacion. Intenta de nuevo.' };
  }
}

export async function createNeedAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createNeedSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los datos.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  try {
    const need = await getStore().createNeed(parsed.data);
    revalidatePath('/');
    revalidatePath(`/zona/${parsed.data.locationId}`);
    return { ok: true, data: { id: need.id } };
  } catch {
    return { ok: false, error: 'No se pudo agregar la necesidad.' };
  }
}

export async function updateNeedStatusAction(input: {
  id: string;
  status: string;
  locationId?: string;
}): Promise<ActionResult> {
  const parsed = updateNeedStatusSchema.safeParse({
    id: input?.id,
    status: input?.status,
  });
  if (!parsed.success) return { ok: false, error: 'Datos invalidos.' };
  try {
    const updated = await getStore().updateNeedStatus(parsed.data.id, parsed.data.status);
    if (!updated) return { ok: false, error: 'No se encontro la necesidad.' };
    revalidatePath('/');
    if (input.locationId) revalidatePath(`/zona/${input.locationId}`);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo actualizar.' };
  }
}

export async function updateLocationStatusAction(input: {
  id: string;
  status: string;
}): Promise<ActionResult> {
  const parsed = updateLocationStatusSchema.safeParse({
    id: input?.id,
    status: input?.status,
  });
  if (!parsed.success) return { ok: false, error: 'Datos invalidos.' };
  try {
    const updated = await getStore().updateLocationStatus(
      parsed.data.id,
      parsed.data.status,
    );
    if (!updated) return { ok: false, error: 'No se encontro la zona.' };
    revalidatePath('/');
    revalidatePath(`/zona/${parsed.data.id}`);
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: 'No se pudo actualizar.' };
  }
}
