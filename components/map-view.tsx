'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { Image as ImageIcon, LocateFixed } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { PersonasAtrapadasBadge } from '@/components/status-badges';
import { useTheme } from '@/components/theme-provider';
import { transformedFotoUrl } from '@/lib/data/foto-url';
import { resolveMapCoords } from '@/lib/data/geo';
import type { LocationWithNeeds } from '@/lib/data/types';
import { EMERGENCY_STATUSES } from '@/lib/data/types';
import {
  computePreviewPlacement,
  excerpt,
  type PlacementResult,
} from '@/lib/map/preview';
import { formatPlaceEs, relativeTimeEs } from '@/lib/sismos/format';
import { magnitudeStyle } from '@/lib/sismos/magnitude';
import type { Sismo } from '@/lib/sismos/types';
import { resolveStatusMeta, statusMeta, TONE_HEX } from '@/lib/status';
import { useNow } from '@/lib/use-now';
import { useMediaQuery, usePrefersReducedMotion } from '@/lib/use-prefers-dark';

// Cap on how many derrumbe pins may pulse so battery / GPU stays bounded.
const MAX_PULSING = 5;

export interface MapViewProps {
  locations: LocationWithNeeds[];
  /** Recent earthquakes to plot as epicenters, newest first. */
  sismos?: Sismo[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

/** Hover-preview state: the location under the cursor and the pin's pixel point. */
interface HoverState {
  loc: LocationWithNeeds;
  point: { x: number; y: number };
}

// Venezuela north-central default view when there are no points to fit.
const DEFAULT_CENTER: L.LatLngExpression = [10.2, -67.6];
const DEFAULT_ZOOM = 7;

/** Builds a circular div-based pin icon for a map marker. */
function buildPinIcon(hex: string, selected: boolean, pulse: boolean): L.DivIcon {
  const size = selected ? 22 : 16;
  const ring = selected
    ? `box-shadow:0 0 0 3px ${hex}55,0 0 0 6px ${hex}22,0 2px 6px rgba(15,20,30,0.4);`
    : 'box-shadow:0 1px 4px rgba(15,20,30,0.35);';
  // Collapse zones (danger) radiate a slow ring so they read first.
  const pulseEl = pulse
    ? `<span class="seismic-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.5px solid ${hex};"></span>`
    : '';
  const html = `<div style="position:relative;width:${size}px;height:${size}px;">
    ${pulseEl}
    <div style="
      position:relative;width:${size}px;height:${size}px;
      border-radius:50%;
      background:${hex};
      border:2px solid #fff;
      ${ring}
      box-sizing:border-box;
    "></div>
  </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

/**
 * Builds an epicenter marker: a hollow ring with a faint fill and a center dot,
 * deliberately distinct from the solid damage pins. Strong quakes radiate the
 * shared `seismic-ring` pulse.
 */
function buildEpicenterIcon(color: string, radiusPx: number, pulse: boolean): L.DivIcon {
  const size = radiusPx * 2;
  const pulseEl = pulse
    ? `<span class="seismic-ring" style="position:absolute;inset:-3px;border-radius:50%;border:1.5px solid ${color};"></span>`
    : '';
  const html = `<div style="position:relative;width:${size}px;height:${size}px;">
    ${pulseEl}
    <div style="
      position:absolute;inset:0;border-radius:50%;
      border:2px solid ${color};background:${color}22;
      box-shadow:0 0 0 1px rgba(255,255,255,0.5);
      box-sizing:border-box;
    "></div>
    <span style="
      position:absolute;top:50%;left:50%;width:3px;height:3px;
      transform:translate(-50%,-50%);border-radius:50%;background:${color};
    "></span>
  </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  });
}

interface ResolvedPoint {
  loc: LocationWithNeeds;
  lat: number;
  lng: number;
  approximate: boolean;
  accuracyM: number;
}

/** Resolves placeable coordinates for each location, including estado fallback. */
function resolvePoints(locations: LocationWithNeeds[]): ResolvedPoint[] {
  const points: ResolvedPoint[] = [];
  for (const loc of locations) {
    const resolved = resolveMapCoords({
      lat: loc.lat,
      lng: loc.lng,
      estado: loc.estado,
      accuracyM: loc.accuracyM,
    });
    if (resolved !== null) {
      points.push({
        loc,
        lat: resolved.lat,
        lng: resolved.lng,
        approximate: resolved.approximate,
        accuracyM: resolved.accuracyM,
      });
    }
  }
  return points;
}

interface BoundsAndSelectionProps {
  locations: ResolvedPoint[];
  selectedId?: string | null;
  markerRefs: React.MutableRefObject<Map<string, L.Marker>>;
}

/** Inner component that responds to bounds/selection changes via useMap(). */
function BoundsAndSelection({
  locations,
  selectedId,
  markerRefs,
}: BoundsAndSelectionProps): null {
  const map = useMap();

  // Auto-fit whenever the set of placeable points changes.
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, locations]);

  // Pan to and open popup for the selected marker.
  useEffect(() => {
    if (!selectedId) return;
    const marker = markerRefs.current.get(selectedId);
    if (!marker) return;
    const latlng = marker.getLatLng();
    map.setView(latlng, Math.max(map.getZoom(), 12), { animate: true });
    marker.openPopup();
  }, [map, selectedId, markerRefs]);

  return null;
}

/** Button that uses the Geolocation API to pan the map to the user. */
function GeolocationButton(): React.JSX.Element {
  const map = useMap();
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const handleClick = useCallback(() => {
    if (!supported) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13, { animate: true });
      },
      // Denied or unavailable - silently ignore.
      () => undefined,
    );
  }, [map, supported]);

  if (!supported) return <></>;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Ubicar mi posición en el mapa"
      title="Ubícame"
      className={[
        'absolute bottom-10 right-3 z-[1000]',
        'flex items-center justify-center',
        'h-10 w-10 rounded-xl',
        'bg-surface border border-border-strong shadow-pop',
        'text-ink-soft hover:text-ink hover:border-border-strong',
        'transition-[color,transform] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-brand-600',
      ].join(' ')}
    >
      <LocateFixed size={16} aria-hidden="true" />
    </button>
  );
}

/**
 * Compact overlay listing all five statuses with color swatch + label.
 * Below sm it collapses to an "Estado" pill so it never covers top-right pins;
 * at sm and up it stays open.
 */
function Legend(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-[1000]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="map-legend-list"
        className={[
          'sm:hidden inline-flex items-center justify-center',
          'min-h-11 rounded-xl px-3 py-2',
          'bg-surface/95 backdrop-blur-sm border border-border shadow-pop',
          'eyebrow text-ink-faint',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        ].join(' ')}
      >
        Estado
      </button>

      <div
        className={[
          open ? 'block' : 'hidden',
          'sm:block mt-1 sm:mt-0',
          'bg-surface/95 backdrop-blur-sm',
          'border border-border rounded-xl',
          'px-3 py-2.5 shadow-pop',
          'text-xs text-ink',
        ].join(' ')}
      >
        <p id="map-legend-heading" className="eyebrow text-ink-faint mb-1.5">
          Estado
        </p>
        <ul id="map-legend-list" aria-labelledby="map-legend-heading" className="space-y-1" role="list">
          {EMERGENCY_STATUSES.map((s) => {
            const meta = statusMeta[s];
            const hex = TONE_HEX[meta.tone];
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: hex }}
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                />
                <span className="text-ink-soft leading-none">{meta.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Clears the hover preview whenever the map starts panning or zooming. */
function ClearHoverOnMove({ onClear }: { onClear: () => void }): null {
  useMapEvents({ movestart: onClear, zoomstart: onClear });
  return null;
}

/**
 * Floating preview shown while hovering a damage pin (pointer devices only).
 * It measures itself, then positions above the pin, flipping below and clamping
 * to the map edges so it never spills out. Decorative: the accessible detail
 * lives in the click/tap Popup, so the card is aria-hidden and click-through.
 */
function HoverPreviewCard({
  loc,
  point,
  reducedMotion,
}: {
  loc: LocationWithNeeds;
  point: { x: number; y: number };
  reducedMotion: boolean;
}): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PlacementResult | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // offsetParent is the relative map wrapper; measure it for viewport clamping.
    const parent = el.offsetParent as HTMLElement | null;
    const viewport = parent
      ? { width: parent.clientWidth, height: parent.clientHeight }
      : { width: rect.width, height: rect.height };
    setPos(
      computePreviewPlacement({
        anchor: point,
        card: { width: rect.width, height: rect.height },
        viewport,
        gap: 14,
      }),
    );
  }, [point]);

  const meta = resolveStatusMeta(loc.status);
  const hex = TONE_HEX[meta.tone];
  const foto = loc.fotos?.[0];
  const description = excerpt(loc.descripcion, 96);
  const { total, urgentes } = loc.summary;

  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      className="pointer-events-none absolute z-[1100] w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        opacity: pos ? 1 : 0,
        transition: reducedMotion ? undefined : 'opacity 120ms ease-out',
      }}
    >
      {foto && !imgFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={transformedFotoUrl(foto, { width: 360, height: 180, resize: 'cover' })}
          alt=""
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="img-outline h-24 w-full object-cover"
        />
      )}
      <div className="p-3">
        <p className="font-semibold leading-tight text-ink">{loc.nombre}</p>
        <p className="mb-1.5 text-xs text-ink-faint">
          {loc.ciudad}, {loc.estado}
          {loc.zona ? ` - ${loc.zona}` : ''}
        </p>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span
            aria-hidden="true"
            style={{ backgroundColor: hex }}
            className="inline-block h-2 w-2 shrink-0 rounded-full"
          />
          <span className="text-xs text-ink-soft">{meta.label}</span>
        </div>
        <p className="text-xs text-ink-soft">
          <span className="tabular">{total}</span> {total === 1 ? 'necesidad' : 'necesidades'}
          {urgentes > 0 && (
            <span className="text-danger">
              {' '}
              · <span className="tabular">{urgentes}</span> urgente{urgentes !== 1 ? 's' : ''}
            </span>
          )}
        </p>
        {description && (
          <p className="mt-1.5 text-xs leading-snug text-ink-soft">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function MapView({
  locations,
  sismos = [],
  selectedId,
  onSelect,
  className,
}: MapViewProps): React.JSX.Element {
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const valid = useMemo(() => resolvePoints(locations), [locations]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reducedMotion = usePrefersReducedMotion();
  // Hover preview is a pointer-only enhancement; touch keeps the tap Popup.
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const clearHover = useCallback(() => setHovered(null), []);
  const now = useNow();
  // Muted CARTO basemap reads as an instrument and lets the semaphore pins pop.
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

  // Bound the pulse to the selected pin plus the most urgent derrumbe zones so
  // we never run dozens of infinite animations at once.
  const pulsingIds = useMemo(() => {
    const ids = new Set<string>();
    if (reducedMotion) return ids;
    if (selectedId) ids.add(selectedId);
    const topDerrumbe = valid
      .filter((p) => p.loc.status === 'derrumbe')
      .sort(
        (a, b) =>
          b.loc.summary.urgentes - a.loc.summary.urgentes ||
          b.loc.summary.total - a.loc.summary.total,
      )
      .slice(0, MAX_PULSING);
    for (const p of topDerrumbe) ids.add(p.loc.id);
    return ids;
  }, [valid, selectedId, reducedMotion]);

  // Memoize icons so markers do not rebuild a DivIcon on every render.
  const iconCache = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const { loc } of valid) {
      const hex = TONE_HEX[resolveStatusMeta(loc.status).tone];
      const isSelected = loc.id === selectedId;
      const shouldPulse = pulsingIds.has(loc.id);
      cache.set(loc.id, buildPinIcon(hex, isSelected, shouldPulse));
    }
    return cache;
  }, [valid, selectedId, pulsingIds]);

  // Epicenter icons sized/colored by magnitude; the newest and strong quakes
  // pulse. Memoized so DivIcons are not rebuilt on every render.
  const epicenterIcons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    sismos.forEach((s, i) => {
      const style = magnitudeStyle(s.magnitude);
      const pulse = !reducedMotion && (style.pulse || i === 0);
      cache.set(s.id, buildEpicenterIcon(style.color, style.radiusPx, pulse));
    });
    return cache;
  }, [sismos, reducedMotion]);

  return (
    <div
      className={[
        'relative min-h-[320px]',
        className ?? '',
      ].join(' ').trim()}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
      >
        <TileLayer
          key={tileUrl}
          url={tileUrl}
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />

        <BoundsAndSelection
          locations={valid}
          selectedId={selectedId}
          markerRefs={markerRefs}
        />

        <GeolocationButton />

        <Legend />

        {canHover && <ClearHoverOnMove onClear={clearHover} />}

        {valid.map(({ loc, lat, lng, approximate, accuracyM }) => {
          if (!approximate || accuracyM <= 0) return null;
          const hex = TONE_HEX[resolveStatusMeta(loc.status).tone];
          return (
            <Circle
              key={`area-${loc.id}`}
              center={[lat, lng]}
              radius={accuracyM}
              pathOptions={{
                color: hex,
                weight: 1,
                opacity: 0.5,
                fillColor: hex,
                fillOpacity: 0.08,
                dashArray: '4 4',
              }}
            />
          );
        })}

        {valid.map(({ loc, lat, lng, approximate }) => {
          const meta = resolveStatusMeta(loc.status);
          const hex = TONE_HEX[meta.tone];
          // Built from the same `valid` array in this render, so always present.
          const icon = iconCache.get(loc.id) as L.DivIcon;
          const fotoCount = loc.fotos?.length ?? 0;

          return (
            <Marker
              key={loc.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={
                canHover
                  ? {
                      mouseover: (e) =>
                        setHovered({
                          loc,
                          point: { x: e.containerPoint.x, y: e.containerPoint.y },
                        }),
                      mouseout: clearHover,
                      click: clearHover,
                    }
                  : undefined
              }
              ref={(m) => {
                if (m) {
                  markerRefs.current.set(loc.id, m);
                } else {
                  markerRefs.current.delete(loc.id);
                }
              }}
            >
              <Popup>
                <div className="min-w-[180px] max-w-[240px] text-sm text-ink">
                  <p className="font-semibold text-ink leading-tight mb-0.5">
                    {loc.nombre}
                  </p>
                  <p className="text-ink-faint text-xs mb-1.5">
                    {loc.ciudad}, {loc.estado}
                    {loc.zona ? ` - ${loc.zona}` : ''}
                  </p>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: hex }}
                      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                    />
                    <span className="text-ink-soft text-xs">{meta.label}</span>
                  </div>

                  <p className="text-ink-soft text-xs mb-2">
                    {loc.summary.total}{' '}
                    {loc.summary.total === 1 ? 'necesidad' : 'necesidades'}
                    {loc.summary.urgentes > 0 && (
                      <span className="text-danger">
                        {' '}· {loc.summary.urgentes} urgente
                        {loc.summary.urgentes !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>

                  {fotoCount > 0 && (
                    <p className="flex items-center gap-1 text-ink-faint text-xs mb-2">
                      <ImageIcon size={12} aria-hidden="true" />
                      <span>
                        {fotoCount} {fotoCount === 1 ? 'foto' : 'fotos'}
                      </span>
                    </p>
                  )}

                  {approximate && (
                    <p className="text-ink-faint text-xs mb-1.5">
                      Ubicación aproximada (área)
                    </p>
                  )}

                  {loc.personas_atrapadas === 'si' && (
                    <div className="mb-2">
                      <PersonasAtrapadasBadge value={loc.personas_atrapadas} />
                    </div>
                  )}

                  <a
                    href={`/zona/${loc.id}`}
                    onClick={() => onSelect?.(loc.id)}
                    className="inline-block text-brand-600 text-xs font-medium hover:underline"
                  >
                    Ver zona &rarr;
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {sismos.map((s) => {
          const icon = epicenterIcons.get(s.id);
          if (!icon) return null;
          return (
            <Marker
              key={`sismo-${s.id}`}
              position={[s.lat, s.lng]}
              icon={icon}
              zIndexOffset={-500}
            >
              <Popup>
                <div className="min-w-[160px] max-w-[220px] text-sm text-ink">
                  <p className="mb-0.5 font-semibold leading-tight text-ink">
                    Sismo · <span className="tabular">M{s.magnitude.toFixed(1)}</span>
                  </p>
                  <p className="mb-1 text-xs text-ink-soft">{formatPlaceEs(s.place)}</p>
                  <p className="text-xs text-ink-faint">
                    {now !== null && <>{relativeTimeEs(s.time, now)} · </>}
                    <span className="tabular">{Math.round(s.depthKm)}</span> km prof.
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {canHover && hovered && (
        <HoverPreviewCard
          key={hovered.loc.id}
          loc={hovered.loc}
          point={hovered.point}
          reducedMotion={reducedMotion}
        />
      )}
    </div>
  );
}
