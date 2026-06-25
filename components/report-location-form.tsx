'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useTransition, useState } from 'react';
import { MapPin, Send } from 'lucide-react';

import { createLocationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { EMERGENCY_STATUSES, VENEZUELA_STATES } from '@/lib/data/types';
import { statusMeta } from '@/lib/status';

const LocationPicker = dynamic(() => import('@/components/location-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full animate-pulse rounded-xl bg-surface-2 border border-border-strong" />
  ),
});

interface FormValues {
  nombre: string;
  estado: string;
  ciudad: string;
  zona: string;
  status: string;
  descripcion: string;
  contactoNombre: string;
  contactoTelefono: string;
}

interface FieldErrors {
  nombre?: string;
  estado?: string;
  ciudad?: string;
  zona?: string;
  status?: string;
  descripcion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  lat?: string;
  lng?: string;
  _?: string;
}

const INITIAL_VALUES: FormValues = {
  nombre: '',
  estado: '',
  ciudad: '',
  zona: '',
  status: 'desconocido',
  descripcion: '',
  contactoNombre: '',
  contactoTelefono: '',
};

export default function ReportLocationForm(): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleUseMyLocation(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Tu dispositivo no soporta geolocalización.');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGeoError('No se pudo obtener tu ubicación. Verifica los permisos.');
      },
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const input = {
        nombre: values.nombre.trim(),
        estado: values.estado,
        ciudad: values.ciudad.trim(),
        zona: values.zona.trim() || undefined,
        status: values.status,
        descripcion: values.descripcion.trim() || undefined,
        contactoNombre: values.contactoNombre.trim() || undefined,
        contactoTelefono: values.contactoTelefono.trim() || undefined,
        lat: coords.lat ?? null,
        lng: coords.lng ?? null,
      };

      const result = await createLocationAction(input);

      if (result.ok) {
        router.push(`/zona/${result.data.id}`);
      } else {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors as FieldErrors);
        }
      }
    });
  }

  const hasCoords = coords.lat !== null && coords.lng !== null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Nombre */}
      <Field
        label="Nombre de la zona"
        htmlFor="nombre"
        required
        error={fieldErrors.nombre}
      >
        <Input
          id="nombre"
          name="nombre"
          value={values.nombre}
          onChange={handleChange}
          placeholder="Ej. Urbanización Las Flores, Sector 3"
          maxLength={120}
          required
          aria-invalid={!!fieldErrors.nombre}
          aria-describedby={fieldErrors.nombre ? 'nombre-error' : undefined}
          disabled={isPending}
        />
      </Field>

      {/* Estado */}
      <Field
        label="Estado"
        htmlFor="estado"
        required
        error={fieldErrors.estado}
      >
        <Select
          id="estado"
          name="estado"
          value={values.estado}
          onChange={handleChange}
          required
          aria-invalid={!!fieldErrors.estado}
          disabled={isPending}
        >
          <option value="">Selecciona un estado</option>
          {VENEZUELA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      {/* Ciudad */}
      <Field
        label="Ciudad o municipio"
        htmlFor="ciudad"
        required
        error={fieldErrors.ciudad}
      >
        <Input
          id="ciudad"
          name="ciudad"
          value={values.ciudad}
          onChange={handleChange}
          placeholder="Ej. Caracas"
          maxLength={80}
          required
          aria-invalid={!!fieldErrors.ciudad}
          disabled={isPending}
        />
      </Field>

      {/* Zona (opcional) */}
      <Field
        label="Zona o sector"
        htmlFor="zona"
        hint="Opcional. Agrega detalles como nombre del barrio o sector."
        error={fieldErrors.zona}
      >
        <Input
          id="zona"
          name="zona"
          value={values.zona}
          onChange={handleChange}
          placeholder="Ej. Barrio El Carmen, Calle 5"
          maxLength={120}
          aria-invalid={!!fieldErrors.zona}
          disabled={isPending}
        />
      </Field>

      {/* Estado estructural */}
      <Field
        label="Estado estructural"
        htmlFor="status"
        required
        error={fieldErrors.status}
      >
        <Select
          id="status"
          name="status"
          value={values.status}
          onChange={handleChange}
          required
          aria-invalid={!!fieldErrors.status}
          disabled={isPending}
        >
          {EMERGENCY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusMeta[s].label}
            </option>
          ))}
        </Select>
      </Field>

      {/* Descripcion (opcional) */}
      <Field
        label="Descripción"
        htmlFor="descripcion"
        hint="Opcional. Describe brevemente la situación (hasta 1000 caracteres)."
        error={fieldErrors.descripcion}
      >
        <Textarea
          id="descripcion"
          name="descripcion"
          value={values.descripcion}
          onChange={handleChange}
          placeholder="Describe el estado de la zona, daños visibles, número aproximado de personas afectadas..."
          maxLength={1000}
          rows={4}
          aria-invalid={!!fieldErrors.descripcion}
          disabled={isPending}
        />
      </Field>

      {/* Contacto nombre (opcional) */}
      <Field
        label="Nombre del contacto"
        htmlFor="contactoNombre"
        hint="Opcional. Persona de referencia en la zona."
        error={fieldErrors.contactoNombre}
      >
        <Input
          id="contactoNombre"
          name="contactoNombre"
          value={values.contactoNombre}
          onChange={handleChange}
          placeholder="Ej. Juan Pérez"
          maxLength={80}
          aria-invalid={!!fieldErrors.contactoNombre}
          disabled={isPending}
        />
      </Field>

      {/* Contacto teléfono (opcional) */}
      <Field
        label="Teléfono de contacto"
        htmlFor="contactoTelefono"
        hint="Opcional. Incluye el código de área."
        error={fieldErrors.contactoTelefono}
      >
        <Input
          id="contactoTelefono"
          name="contactoTelefono"
          value={values.contactoTelefono}
          onChange={handleChange}
          placeholder="Ej. 0212-555-0101"
          maxLength={40}
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={!!fieldErrors.contactoTelefono}
          disabled={isPending}
        />
      </Field>

      {/* Mapa selector de coordenadas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Ubicación en el mapa</span>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleUseMyLocation}
            disabled={isPending}
          >
            <MapPin size={16} aria-hidden="true" />
            Usar mi ubicación
          </Button>
        </div>

        <LocationPicker
          value={coords}
          onChange={(p) => setCoords(p)}
        />

        {hasCoords && (
          <p className="text-xs text-ink-faint tabular-nums">
            {coords.lat!.toFixed(5)}, {coords.lng!.toFixed(5)}
          </p>
        )}

        {geoError && (
          <p className="text-xs font-medium text-danger" role="alert">
            {geoError}
          </p>
        )}
      </div>

      {/* Error general */}
      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {submitError}
        </div>
      )}

      {/* Botón de envío */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isPending}
        className="w-full"
      >
        <Send size={18} aria-hidden="true" />
        {isPending ? 'Publicando...' : 'Publicar reporte'}
      </Button>
    </form>
  );
}
