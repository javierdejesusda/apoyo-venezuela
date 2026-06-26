export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function buildOsmUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`;
}

export function buildDirectionsLinks(
  lat: number | null,
  lng: number | null,
): { google: string; osm: string } | null {
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  return {
    google: buildGoogleMapsUrl(lat, lng),
    osm: buildOsmUrl(lat, lng),
  };
}
