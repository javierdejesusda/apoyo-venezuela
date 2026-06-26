'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useRef, useState, useTransition } from 'react';
import {
  CircleDashed,
  Crosshair,
  ImagePlus,
  MapPin,
  Send,
  X,
} from 'lucide-react';

import { createLocationAction } from '@/app/actions';
import { geocodeReverseAction } from '@/app/geocode-actions';
import { Button } from '@/components/ui/button';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/form';
import { MapSkeleton } from '@/components/ui/map-skeleton';
import { getBrowserSupabase } from '@/lib/data/supabase-browser';
import { validateFotoFile } from '@/lib/data/foto-validation';
import {
  EMERGENCY_STATUSES,
  FUENTE_REPORTE,
  FUENTE_REPORTE_LABELS,
  MAX_FOTO_MB,
  MAX_FOTOS,
  PERSONAS_ATRAPADAS,
  PERSONAS_ATRAPADAS_DEFAULT,
  VENEZUELA_STATES,
} from '@/lib/data/types';
import { APPROXIMATE_THRESHOLD_M } from '@/lib/geocoding/types';
import {
  detectInAppBrowser,
  geolocationErrorMessage,
} from '@/lib/geolocation/errors';
import { statusMeta } from '@/lib/status';
import { useRevokeObjectUrlsOnUnmount } from '@/lib/use-revoke-object-urls';

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

// VENEZUELA_STATES is an `as const` tuple, so widen it for membership checks
// against free-form geocoder strings.
function isVenezuelanState(value: string | null): value is string {
  return value !== null && (VENEZUELA_STATES as readonly string[]).includes(value);
}

/** Human-readable uncertainty radius: meters under 1 km, kilometers above. */
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
}

const LocationPicker = dynamic(() => import('@/components/location-picker'), {
  ssr: false,
  loading: () => <MapSkeleton className="h-56 rounded-xl border border-border-strong" />,
});

interface FormValues {
  nombre: string;
  estado: string;
  ciudad: string;
  zona: string;
  status: string;
  personas_atrapadas: string;
  fuente_reporte: string;
  tipo_construccion: string;
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
  personas_atrapadas: PERSONAS_ATRAPADAS_DEFAULT,
  fuente_reporte: '',
  tipo_construccion: '',
  descripcion: '',
  contactoNombre: '',
  contactoTelefono: '',
};

const PERSONAS_ATRAPADAS_LABELS: Record<string, string> = {
  si: 'Sí',
  no: 'No',
  no_se: 'No se sabe',
};

export default function ReportLocationForm(): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  // Latest-wins guard for in-flight reverse lookups.
  const reverseSeqRef = useRef(0);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fotos, setFotos] = useState<SelectedFoto[]>([]);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Revoke any object URLs still held when the form unmounts to avoid leaks.
  useRevokeObjectUrlsOnUnmount(fotos.map((foto) => foto.previewUrl));

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  // Fill estado/ciudad/zona from a reverse lookup, never clobbering a field the
  // user already filled. Degrades silently when reverse geocoding is unavailable.
  async function reverseFill(lat: number, lng: number): Promise<void> {
    const seq = ++reverseSeqRef.current;
    const reverse = await geocodeReverseAction(lat, lng);
    if (!reverse) return;
    // A newer pin drop, suggestion pick, or geolocation superseded this lookup.
    if (seq !== reverseSeqRef.current) return;
    setValues((prev) => {
      const next = { ...prev };
      if (!prev.estado && isVenezuelanState(reverse.estado)) next.estado = reverse.estado;
      if (!prev.ciudad && reverse.ciudad) next.ciudad = reverse.ciudad;
      if (!prev.zona && reverse.zona) next.zona = reverse.zona;
      return next;
    });
  }

  // A click or drag is the user pinning the spot, so it wins as an exact point.
  function handlePickerChange(p: { lat: number; lng: number }): void {
    setCoords(p);
    setAccuracyM(0);
    void reverseFill(p.lat, p.lng);
  }

  function handleUseMyLocation(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Tu dispositivo no soporta geolocalización.');
      return;
    }
    setGeoError(null);
    const inAppBrowser = detectInAppBrowser(navigator.userAgent);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setAccuracyM(Math.round(pos.coords.accuracy));
        void reverseFill(lat, lng);
      },
      (error) => {
        setGeoError(geolocationErrorMessage(error, inAppBrowser));
      },
      // iOS never resolves a hung lookup on its own, so cap the wait and let a
      // slightly stale fix through rather than blocking the user.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
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
      const problem = validateFotoFile(file);
      if (problem) {
        rejected = problem;
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
        personas_atrapadas: values.personas_atrapadas,
        fuente_reporte: values.fuente_reporte || undefined,
        tipo_construccion: values.tipo_construccion.trim() || undefined,
        descripcion: values.descripcion.trim() || undefined,
        contactoNombre: values.contactoNombre.trim() || undefined,
        contactoTelefono: values.contactoTelefono.trim() || undefined,
        lat: coords.lat ?? null,
        lng: coords.lng ?? null,
        accuracyM,
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
  const isApproximate = accuracyM != null && accuracyM >= APPROXIMATE_THRESHOLD_M;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Nombre */}
      <Field
        label="Nombre de la zona"
        htmlFor="nombre"
        required
        hint="Incluye el edificio, los pisos o una referencia (ej. edificio Rita, 6 pisos, frente a la Av Los Próceres)."
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

      {/* Ubicación: búsqueda, mapa y campos de estado/ciudad/zona autocompletados */}
      <section className="space-y-4 rounded-xl border border-border-strong bg-surface p-4 shadow-card sm:p-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Ubicación</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Indica el estado, la ciudad y la zona. Si puedes, toca o arrastra el pin
            en el mapa para marcar el punto exacto. Si no marcas un punto, la zona se
            mostrará solo en la lista, con la información de ubicación que escribas.
          </p>
        </div>

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
            accuracyM={accuracyM}
            onChange={handlePickerChange}
          />

          {hasCoords ? (
            isApproximate ? (
              <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                <CircleDashed size={14} aria-hidden="true" />
                Ubicación aproximada (~{formatDistance(accuracyM ?? 0)}). Arrastra el pin
                para precisarla.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-medium text-brand-600">
                <Crosshair size={14} aria-hidden="true" />
                Ubicación exacta
              </p>
            )
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-ink-faint">
              <MapPin size={14} aria-hidden="true" />
              Opcional: toca el mapa para marcar el punto exacto.
            </p>
          )}

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

        {/* Estado */}
        <Field label="Estado" htmlFor="estado" required error={fieldErrors.estado}>
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
      </section>

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

      {/* Personas atrapadas */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Personas atrapadas</legend>
        <p className="text-xs text-ink-faint">
          Indica si hay personas atrapadas según el reporte. Esta información no es verificada.
        </p>
        <div className="flex flex-wrap gap-4">
          {PERSONAS_ATRAPADAS.map((val) => (
              <label
                key={val}
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft"
              >
                <input
                  type="radio"
                  name="personas_atrapadas"
                  value={val}
                  checked={values.personas_atrapadas === val}
                  onChange={handleChange}
                  disabled={isPending}
                  className="accent-brand-600"
                />
                {PERSONAS_ATRAPADAS_LABELS[val]}
              </label>
            ))}
        </div>
      </fieldset>

      {/* Fuente del reporte (opcional) */}
      <Field
        label="Fuente del reporte"
        htmlFor="fuente_reporte"
        hint="Opcional. ¿Cómo se supo de esta situación?"
      >
        <Select
          id="fuente_reporte"
          name="fuente_reporte"
          value={values.fuente_reporte}
          onChange={handleChange}
          disabled={isPending}
        >
          <option value="">Selecciona una fuente</option>
          {FUENTE_REPORTE.map((val) => (
            <option key={val} value={val}>
              {FUENTE_REPORTE_LABELS[val]}
            </option>
          ))}
        </Select>
      </Field>

      {/* Tipo de construcción (opcional) */}
      <Field
        label="Tipo de construcción"
        htmlFor="tipo_construccion"
        hint="Opcional. Indica el tipo de estructura afectada."
      >
        <Input
          id="tipo_construccion"
          name="tipo_construccion"
          value={values.tipo_construccion}
          onChange={handleChange}
          placeholder="Ej: edificio de concreto, casa"
          maxLength={200}
          disabled={isPending}
        />
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
          placeholder="Ej. 0414-1234567"
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
          Opcional. Hasta {MAX_FOTOS} imágenes de {MAX_FOTO_MB} MB como máximo cada una.
        </p>

        {fotos.length > 0 && (
          <ul className="grid grid-cols-4 gap-2">
            {fotos.map((foto, index) => (
              <li key={foto.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.previewUrl}
                  alt={`Foto adjunta ${index + 1}`}
                  className="img-outline aspect-square w-full rounded-lg bg-surface-2 object-contain"
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
