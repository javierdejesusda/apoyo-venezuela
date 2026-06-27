/**
 * Maps an earthquake magnitude to its epicenter marker style.
 *
 * Epicenters read as hollow rings (distinct from the solid damage pins): the
 * radius grows with magnitude and the color climbs a warm amber-to-red ramp.
 * Only strong quakes pulse, reusing the page's `seismic-ring` animation.
 */

export interface MagnitudeStyle {
  /** Radius of the epicenter ring in pixels. */
  radiusPx: number;
  /** Ring/fill color for this magnitude band. */
  color: string;
  /** Whether this quake is strong enough to radiate a pulse. */
  pulse: boolean;
}

/** Magnitude at or above which an epicenter pulses. */
export const STRONG_MAGNITUDE = 4.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Returns the size, color and pulse flag for a given magnitude. */
export function magnitudeStyle(mag: number): MagnitudeStyle {
  const radiusPx = Math.round(clamp(8 + Math.max(0, mag - 2.5) * 4, 8, 36));

  let color: string;
  if (mag < 3.5) color = '#f59e0b'; // amber
  else if (mag < 4.5) color = '#f97316'; // orange
  else if (mag < 5.5) color = '#ef4444'; // red
  else color = '#b91c1c'; // deep red

  return { radiusPx, color, pulse: mag >= STRONG_MAGNITUDE };
}
