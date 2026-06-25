'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import type { LocationWithNeeds } from '@/lib/data/types';
import { EMERGENCY_STATUSES } from '@/lib/data/types';
import { statusMeta, TONE_HEX } from '@/lib/status';

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
function buildPinIcon(hex: string, selected: boolean): L.DivIcon {
  const size = selected ? 22 : 16;
  const ring = selected
    ? `box-shadow:0 0 0 3px ${hex}66,0 0 0 5px ${hex}33;`
    : '';
  const html = `<div style="
    width:${size}px;height:${size}px;
    border-radius:50%;
    background:${hex};
    border:2px solid rgba(255,255,255,0.9);
    ${ring}
    box-sizing:border-box;
  "></div>`;
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
        'h-9 w-9 rounded-lg',
        'bg-surface border border-border-strong shadow-md',
        'text-ink-soft hover:text-ink hover:border-border-strong',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-brand-600',
      ].join(' ')}
    >
      <LocateFixed size={16} aria-hidden="true" />
    </button>
  );
}

/** Compact overlay listing all four statuses with color swatch + label. */
function Legend(): React.JSX.Element {
  return (
    <div
      aria-label="Leyenda de estado de zonas"
      className={[
        'absolute top-3 right-3 z-[1000]',
        'bg-surface/95 backdrop-blur-sm',
        'border border-border rounded-lg',
        'px-3 py-2 shadow-md',
        'text-xs text-ink',
      ].join(' ')}
    >
      <p className="font-semibold text-ink mb-1.5 text-xs uppercase tracking-wide">
        Estado
      </p>
      <ul className="space-y-1" role="list">
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
  );
}

export default function MapView({
  locations,
  selectedId,
  onSelect,
  className,
}: MapViewProps): React.JSX.Element {
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const valid = validLocations(locations);

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
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
          const isSelected = loc.id === selectedId;
          const icon = buildPinIcon(hex, isSelected);

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
