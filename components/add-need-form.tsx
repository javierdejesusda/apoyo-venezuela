'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { NEED_CATEGORIES, URGENCIES } from '@/lib/data/types';
import { categoryMeta, urgencyMeta } from '@/lib/status';
import { createNeedAction } from '@/app/actions';
import { Field, Input, Textarea, Select } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

interface AddNeedFormProps {
  locationId: string;
}

interface FormErrors {
  _?: string;
  categoria?: string;
  descripcion?: string;
  cantidad?: string;
  urgencia?: string;
}

const DEFAULT_CATEGORIA = NEED_CATEGORIES[0];
const DEFAULT_URGENCIA = 'media' as const;

export function AddNeedForm({ locationId }: AddNeedFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const categoriaRef = useRef<HTMLSelectElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const urgenciaRef = useRef<HTMLSelectElement>(null);

  function clearForm() {
    if (categoriaRef.current) categoriaRef.current.value = DEFAULT_CATEGORIA;
    if (descripcionRef.current) descripcionRef.current.value = '';
    if (cantidadRef.current) cantidadRef.current.value = '';
    if (urgenciaRef.current) urgenciaRef.current.value = DEFAULT_URGENCIA;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    const input = {
      locationId,
      categoria: categoriaRef.current?.value ?? DEFAULT_CATEGORIA,
      descripcion: descripcionRef.current?.value ?? '',
      cantidad: cantidadRef.current?.value || undefined,
      urgencia: urgenciaRef.current?.value ?? DEFAULT_URGENCIA,
    };

    startTransition(async () => {
      const result = await createNeedAction(input);
      if (result.ok) {
        clearForm();
        router.refresh();
      } else {
        setGlobalError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as FormErrors);
        }
      }
    });
  }

  return (
    <section aria-label="Agregar necesidad">
      <h2 className="mb-3 text-base font-semibold text-ink">Reportar una necesidad</h2>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-xl border border-border bg-surface p-4 space-y-4"
      >
        {globalError && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger" role="alert">
            {globalError}
          </p>
        )}

        <Field
          label="Categoría"
          htmlFor="add-need-categoria"
          error={fieldErrors.categoria}
          required
        >
          <Select
            id="add-need-categoria"
            name="categoria"
            ref={categoriaRef}
            defaultValue={DEFAULT_CATEGORIA}
            aria-invalid={fieldErrors.categoria ? true : undefined}
            disabled={isPending}
          >
            {NEED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryMeta[c].label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Descripción"
          htmlFor="add-need-descripcion"
          error={fieldErrors.descripcion}
          hint="Describe qué se necesita con el mayor detalle posible."
          required
        >
          <Textarea
            id="add-need-descripcion"
            name="descripcion"
            ref={descripcionRef}
            placeholder="Ej: Agua potable para 50 familias, medicamentos para heridos..."
            aria-invalid={fieldErrors.descripcion ? true : undefined}
            disabled={isPending}
          />
        </Field>

        <Field
          label="Cantidad (opcional)"
          htmlFor="add-need-cantidad"
          error={fieldErrors.cantidad}
          hint="Ej: 200 litros, 10 cajas, 3 voluntarios..."
        >
          <Input
            id="add-need-cantidad"
            name="cantidad"
            type="text"
            ref={cantidadRef}
            placeholder="Ej: 200 litros"
            aria-invalid={fieldErrors.cantidad ? true : undefined}
            disabled={isPending}
          />
        </Field>

        <Field
          label="Urgencia"
          htmlFor="add-need-urgencia"
          error={fieldErrors.urgencia}
          required
        >
          <Select
            id="add-need-urgencia"
            name="urgencia"
            ref={urgenciaRef}
            defaultValue={DEFAULT_URGENCIA}
            aria-invalid={fieldErrors.urgencia ? true : undefined}
            disabled={isPending}
          >
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {urgencyMeta[u].label}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" variant="primary" size="md" disabled={isPending} className="w-full">
          <Plus className="h-4 w-4" aria-hidden />
          {isPending ? 'Guardando...' : 'Agregar necesidad'}
        </Button>
      </form>
    </section>
  );
}
