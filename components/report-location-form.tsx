'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState, useTransition } from 'react';
import { ImagePlus, MapPin, Send, X } from 'lucide-react';

import { createLocationAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/form';
import { getBrowserSupabase } from '@/lib/data/supabase-browser';
import { EMERGENCY_STATUSES, MAX_FOTOS, VENEZUELA_STATES } from '@/lib/data/types';
import { statusMeta } from '@/lib/status';

const MAX_FOTO_BYTES = 5 * 1024 * 1024;

interface SelectedFoto {
  id: string;
  file: File;
  previewUrl: string;
}

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

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
  const [fotos, setFotos] = useState<SelectedFoto[]>([]);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Revoke any object URLs still held when the form unmounts to avoid leaks.
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  useEffect(
    () => () => {
      fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.previewUrl));
    },
    [],
  );

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

  function handleFotosSelected(e: React.ChangeEvent<HTMLInputElement>): void {
    const input = e.target;
    const picked = Array.from(input.files ?? []);
    input.value = '';
    if (picked.length === 0) return;

    setFotoError(null);
    const accepted: SelectedFoto[] = [];
    let rejected: string | null = null;

    for (const file of picked) {
      if (fotos.length + accepted.length >= MAX_FOTOS) {
        rejected = `Solo puedes adjuntar hasta ${MAX_FOTOS} fotos.`;
        break;
      }
      if (!file.type.startsWith('image/')) {
        rejected = 'Solo se permiten imágenes.';
        continue;
      }
      if (file.size > MAX_FOTO_BYTES) {
        rejected = 'Cada imagen debe pesar 5 MB o menos.';
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setFotos((prev) => [...prev, ...accepted]);
    }
    if (rejected) {
      setFotoError(rejected);
    }
  }

  function handleRemoveFoto(id: string): void {
    setFotos((prev) => {
      const target = prev.find((foto) => foto.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((foto) => foto.id !== id);
    });
    setFotoError(null);
  }

  async function uploadFotos(): Promise<string[]> {
    if (fotos.length === 0) return [];
    const client = getBrowserSupabase();

    if (!client) {
      // Demo/local mode: embed images as data URLs so it works without Supabase.
      return Promise.all(fotos.map((foto) => readFileAsDataUrl(foto.file)));
    }

    return Promise.all(
      fotos.map(async (foto) => {
        const path = `${crypto.randomUUID()}-${sanitizeFilename(foto.file.name)}`;
        const { error } = await client.storage
          .from('fotos')
          .upload(path, foto.file, { upsert: false });
        if (error) {
          throw new Error('No se pudieron subir las fotos. Intenta de nuevo.');
        }
        return client.storage.from('fotos').getPublicUrl(path).data.publicUrl;
      }),
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      let fotoUrls: string[];
      try {
        fotoUrls = await uploadFotos();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'No se pudieron subir las fotos.',
        );
        return;
      }

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
        fotos: fotoUrls.length > 0 ? fotoUrls : undefined,
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

      {/* Fotos (opcional) */}
      <div className="space-y-2">
        <Label htmlFor="fotos">Fotos</Label>
        <p className="text-xs text-ink-faint">
          Opcional. Hasta {MAX_FOTOS} imágenes de 5 MB como máximo cada una.
        </p>

        {fotos.length > 0 && (
          <ul className="grid grid-cols-4 gap-2">
            {fotos.map((foto, index) => (
              <li key={foto.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.previewUrl}
                  alt={`Foto adjunta ${index + 1}`}
                  className="img-outline aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFoto(foto.id)}
                  disabled={isPending}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink shadow-sm outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-50"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {fotos.length < MAX_FOTOS && (
          <label
            htmlFor="fotos"
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-3 text-sm font-medium text-ink-soft outline-none transition-colors hover:border-brand-500 hover:text-ink focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 aria-disabled:opacity-50"
            aria-disabled={isPending}
          >
            <ImagePlus size={18} aria-hidden="true" />
            Agregar fotos
            <input
              id="fotos"
              name="fotos"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFotosSelected}
              disabled={isPending}
              className="sr-only"
            />
          </label>
        )}

        {fotoError && (
          <p className="text-xs font-medium text-danger" role="alert">
            {fotoError}
          </p>
        )}
      </div>

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
        {isPending
          ? fotos.length > 0
            ? 'Subiendo fotos...'
            : 'Publicando...'
          : 'Publicar reporte'}
      </Button>
    </form>
  );
}
