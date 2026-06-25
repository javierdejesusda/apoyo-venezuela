'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import { useTheme } from '@/components/theme-provider';
import { APPROXIMATE_THRESHOLD_M } from '@/lib/geocoding/types';
import { TONE_HEX } from '@/lib/status';
import { cn } from '@/lib/utils';

export interface LocationPickerProps {
  value: { lat: number | null; lng: number | null };
  /** Uncertainty radius in meters for the current point, when known. */
  accuracyM?: number | null;
  onChange: (p: { lat: number; lng: number }) => void;
  className?: string;
}

const VENEZUELA_CENTER: L.LatLngExpression = [10.2, -67.6];
const DEFAULT_ZOOM = 6;
const EXACT_ZOOM = 15;
const APPROXIMATE_ZOOM = 12;
const BRAND_HEX = TONE_HEX.brand;

// Hoisted so the uncertainty circle keeps a stable style reference across renders.
const UNCERTAINTY_CIRCLE_STYLE = {
  color: BRAND_HEX,
  fillColor: BRAND_HEX,
  fillOpacity: 0.1,
  weight: 1.5,
  dashArray: '5 5',
};

function buildPickerIcon(): L.DivIcon {
  const size = 20;
  const html = `<div style="
    width:${size}px;height:${size}px;
    border-radius:50%;
    background:${BRAND_HEX};
    border:2.5px solid rgba(255,255,255,0.95);
    box-shadow:0 0 0 3px ${BRAND_HEX}55,0 2px 6px rgba(0,0,0,0.25);
    box-sizing:border-box;
  "></div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ClickHandlerProps {
  onChange: (p: { lat: number; lng: number }) => void;
}

function ClickHandler({ onChange }: ClickHandlerProps): null {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface RecenterProps {
  lat: number | null;
  lng: number | null;
  isApproximate: boolean;
  /** Last coordinate the map was centered on, keyed as `lat,lng`. */
  centeredRef: React.MutableRefObject<string | null>;
}

/**
 * Recenters the map when `value` becomes a coordinate the map has not already
 * centered on. Local interactions (click, drag) stamp `centeredRef` first, so
 * this only fires for external changes (e.g. an autocomplete pick) and never
 * fights the user mid-drag.
 */
function Recenter({ lat, lng, isApproximate, centeredRef }: RecenterProps): null {
  const map = useMap();

  useEffect(() => {
    if (lat === null || lng === null) return;
    const key = `${lat},${lng}`;
    if (centeredRef.current === key) return;
    centeredRef.current = key;
    map.setView([lat, lng], isApproximate ? APPROXIMATE_ZOOM : EXACT_ZOOM, {
      animate: true,
    });
  }, [map, lat, lng, isApproximate, centeredRef]);

  return null;
}

interface SelectedMarkerProps {
  lat: number;
  lng: number;
  onChange: (p: { lat: number; lng: number }) => void;
}

function SelectedMarker({
  lat,
  lng,
  onChange,
}: SelectedMarkerProps): React.JSX.Element {
  const icon = useMemo(() => buildPickerIcon(), []);
  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const next = (e.target as L.Marker).getLatLng();
        onChange({ lat: next.lat, lng: next.lng });
      },
    }),
    [onChange],
  );
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      draggable
      eventHandlers={eventHandlers}
    />
  );
}

export default function LocationPicker({
  value,
  accuracyM,
  onChange,
  className,
}: LocationPickerProps): React.JSX.Element {
  const hasCoords = value.lat !== null && value.lng !== null;
  const isApproximate =
    accuracyM != null && accuracyM >= APPROXIMATE_THRESHOLD_M;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Match the muted CARTO basemap used on the home map for theme parity.
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

  // Stamped before each local change so Recenter skips drag/click updates.
  const centeredRef = useRef<string | null>(null);
  const handleLocalChange = useCallback(
    (p: { lat: number; lng: number }) => {
      centeredRef.current = `${p.lat},${p.lng}`;
      onChange(p);
    },
    [onChange],
  );

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-xs text-ink-faint">
        Toca el mapa o arrastra el pin para marcar el punto exacto
      </p>
      <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border-strong">
        <MapContainer
          center={VENEZUELA_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
        >
          <TileLayer
            key={tileUrl}
            url={tileUrl}
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />
          <ClickHandler onChange={handleLocalChange} />
          <Recenter
            lat={value.lat}
            lng={value.lng}
            isApproximate={isApproximate}
            centeredRef={centeredRef}
          />
          {hasCoords && isApproximate && accuracyM != null && (
            <Circle
              center={[value.lat as number, value.lng as number]}
              radius={accuracyM}
              pathOptions={UNCERTAINTY_CIRCLE_STYLE}
            />
          )}
          {hasCoords && (
            <SelectedMarker
              lat={value.lat as number}
              lng={value.lng as number}
              onChange={handleLocalChange}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
