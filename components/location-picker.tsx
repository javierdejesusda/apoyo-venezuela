'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import React, { useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import { useTheme } from '@/components/theme-provider';
import { TONE_HEX } from '@/lib/status';
import { cn } from '@/lib/utils';

export interface LocationPickerProps {
  value: { lat: number | null; lng: number | null };
  onChange: (p: { lat: number; lng: number }) => void;
  className?: string;
}

const VENEZUELA_CENTER: L.LatLngExpression = [10.2, -67.6];
const DEFAULT_ZOOM = 6;
const BRAND_HEX = TONE_HEX.brand;

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

interface SelectedMarkerProps {
  lat: number;
  lng: number;
}

function SelectedMarker({ lat, lng }: SelectedMarkerProps): React.JSX.Element {
  const iconRef = useRef<L.DivIcon>(buildPickerIcon());
  return <Marker position={[lat, lng]} icon={iconRef.current} />;
}

export default function LocationPicker({
  value,
  onChange,
  className,
}: LocationPickerProps): React.JSX.Element {
  const hasCoords = value.lat !== null && value.lng !== null;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Match the muted CARTO basemap used on the home map for theme parity.
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p className="text-xs text-ink-faint">
        Toca el mapa para marcar el punto (opcional)
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
          <ClickHandler onChange={onChange} />
          {hasCoords && (
            <SelectedMarker lat={value.lat as number} lng={value.lng as number} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
