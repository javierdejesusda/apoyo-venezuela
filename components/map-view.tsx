'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { Image as ImageIcon, LocateFixed } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import { useTheme } from '@/components/theme-provider';
import type { LocationWithNeeds } from '@/lib/data/types';
import { EMERGENCY_STATUSES } from '@/lib/data/types';
import { statusMeta, TONE_HEX } from '@/lib/status';
import { usePrefersReducedMotion } from '@/lib/use-prefers-dark';

// Cap on how many derrumbe pins may pulse so battery / GPU stays bounded.
const MAX_PULSING = 5;

export interface MapViewProps {
  locations: LocationWithNeeds[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
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

/** Filters locations to those that have valid lat/lng coordinates. */
function validLocations(
  locations: LocationWithNeeds[],
): (LocationWithNeeds & { lat: number; lng: number })[] {
  return locations.filter(
    (loc): loc is LocationWithNeeds & { lat: number; lng: number } =>
      loc.lat !== null && loc.lng !== null,
  );
}

interface BoundsAndSelectionProps {
  locations: (LocationWithNeeds & { lat: number; lng: number })[];
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

  // Auto-fit whenever the set of valid points changes.
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
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
 * Compact overlay listing all four statuses with color swatch + label.
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

export default function MapView({
  locations,
  selectedId,
  onSelect,
  className,
}: MapViewProps): React.JSX.Element {
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const valid = useMemo(() => validLocations(locations), [locations]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reducedMotion = usePrefersReducedMotion();
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
      .filter((loc) => loc.status === 'derrumbe')
      .sort(
        (a, b) =>
          b.summary.urgentes - a.summary.urgentes ||
          b.summary.total - a.summary.total,
      )
      .slice(0, MAX_PULSING);
    for (const loc of topDerrumbe) ids.add(loc.id);
    return ids;
  }, [valid, selectedId, reducedMotion]);

  // Memoize icons so markers do not rebuild a DivIcon on every render.
  const iconCache = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const loc of valid) {
      const hex = TONE_HEX[statusMeta[loc.status].tone];
      const isSelected = loc.id === selectedId;
      const shouldPulse = pulsingIds.has(loc.id);
      cache.set(loc.id, buildPinIcon(hex, isSelected, shouldPulse));
    }
    return cache;
  }, [valid, selectedId, pulsingIds]);

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

        {valid.map((loc) => {
          const meta = statusMeta[loc.status];
          const hex = TONE_HEX[meta.tone];
          // Built from the same `valid` array in this render, so always present.
          const icon = iconCache.get(loc.id) as L.DivIcon;
          const fotoCount = loc.fotos?.length ?? 0;

          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={icon}
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
      </MapContainer>
    </div>
  );
}
