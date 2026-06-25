'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useTransition } from 'react';

import { CheckCircle2, HandCoins } from 'lucide-react';

import { createFundraiserAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';

interface FormValues {
  titulo: string;
  url: string;
  descripcion: string;
  organizador: string;
}

interface FieldErrors {
  titulo?: string;
  url?: string;
  descripcion?: string;
  organizador?: string;
}

const INITIAL_VALUES: FormValues = {
  titulo: '',
  url: '',
  descripcion: '',
  organizador: '',
};

export function AddFundraiserForm(): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (success) setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setSuccess(false);

    startTransition(async () => {
      const result = await createFundraiserAction({
        titulo: values.titulo.trim(),
        url: values.url.trim(),
        descripcion: values.descripcion.trim(),
        organizador: values.organizador.trim() || undefined,
      });

      if (result.ok) {
        setValues(INITIAL_VALUES);
        setSuccess(true);
        router.refresh();
      } else {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as FieldErrors);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field label="Título de la campaña" htmlFor="fr-titulo" required error={fieldErrors.titulo}>
        <Input
          id="fr-titulo"
          name="titulo"
          value={values.titulo}
          onChange={handleChange}
          placeholder="Ej. Ayuda para familias de San Felipe"
          maxLength={120}
          required
          aria-invalid={!!fieldErrors.titulo}
          aria-describedby={fieldErrors.titulo ? 'fr-titulo-error' : undefined}
          disabled={isPending}
        />
      </Field>

      <Field
        label="Enlace de GoFundMe"
        htmlFor="fr-url"
        hint="Pega el enlace de tu campaña de GoFundMe."
        required
        error={fieldErrors.url}
      >
        <Input
          id="fr-url"
          name="url"
          type="url"
          inputMode="url"
          value={values.url}
          onChange={handleChange}
          placeholder="https://www.gofundme.com/f/..."
          required
          aria-invalid={!!fieldErrors.url}
          aria-describedby={fieldErrors.url ? 'fr-url-error' : undefined}
          disabled={isPending}
        />
      </Field>

      <Field label="Descripción" htmlFor="fr-descripcion" required error={fieldErrors.descripcion}>
        <Textarea
          id="fr-descripcion"
          name="descripcion"
          value={values.descripcion}
          onChange={handleChange}
          placeholder="Explica brevemente a quién ayuda la campaña y para qué se usan los fondos."
          maxLength={500}
          rows={4}
          required
          aria-invalid={!!fieldErrors.descripcion}
          aria-describedby={fieldErrors.descripcion ? 'fr-descripcion-error' : undefined}
          disabled={isPending}
        />
      </Field>

      <Field
        label="Organizador"
        htmlFor="fr-organizador"
        hint="Opcional. Persona u organización que dirige la campaña."
        error={fieldErrors.organizador}
      >
        <Input
          id="fr-organizador"
          name="organizador"
          value={values.organizador}
          onChange={handleChange}
          placeholder="Ej. Vecinos de San Felipe"
          maxLength={80}
          aria-invalid={!!fieldErrors.organizador}
          aria-describedby={fieldErrors.organizador ? 'fr-organizador-error' : undefined}
          disabled={isPending}
        />
      </Field>

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-tone-danger-text"
        >
          {submitError}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-tone-success-text"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>¡Gracias! Tu recaudación ya aparece en la lista.</p>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="w-full">
        <HandCoins size={18} aria-hidden="true" />
        {isPending ? 'Publicando...' : 'Compartir recaudación'}
      </Button>
    </form>
  );
}
