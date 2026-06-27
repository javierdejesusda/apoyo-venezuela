/**
 * Normalizes the USGS FDSN GeoJSON feed into our Sismo domain type.
 *
 * The feed is an external, untrusted source, so each feature is validated with
 * Zod and silently dropped if it lacks a magnitude or point coordinates. The
 * result is sorted newest-first so the ticker and "latest quake" logic can read
 * index 0.
 */
import { z } from 'zod';

import type { Sismo } from './types';

const FeatureSchema = z.object({
  id: z.string(),
  properties: z.object({
    mag: z.number(),
    place: z.string().nullable().optional(),
    time: z.number(),
    url: z.string().optional(),
  }),
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number(), z.number()]),
  }),
});

/** Parses a raw USGS GeoJSON payload into newest-first Sismo records. */
export function parseUsgsFeed(raw: unknown): Sismo[] {
  const features = (raw as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];

  const sismos: Sismo[] = [];
  for (const feature of features) {
    const parsed = FeatureSchema.safeParse(feature);
    if (!parsed.success) continue;
    const { id, properties, geometry } = parsed.data;
    const [lng, lat, depthKm] = geometry.coordinates;
    sismos.push({
      id,
      magnitude: properties.mag,
      place: properties.place ?? '',
      time: properties.time,
      lat,
      lng,
      depthKm,
      url: properties.url ?? '',
    });
  }

  return sismos.sort((a, b) => b.time - a.time);
}
