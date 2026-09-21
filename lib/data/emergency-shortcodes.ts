/**
 * National emergency short codes for Venezuela, by carrier.
 *
 * There is no single number that works on every network: the code depends on
 * the line the call is placed from. The retired /telefonos page carried this
 * distinction, so the transition page has to carry it now, otherwise someone
 * on another carrier dials a dead line during an emergency.
 *
 * Source: lib/data/emergency-contacts.ts as it stood before the shutdown,
 * where the entry was confirmed against the 24-06-2026 earthquake coverage and
 * national emergency directories.
 *
 * This is a pure data module (no React imports) so it can be validated in
 * isolation and reused by both the page and its tests.
 */
import { telHref } from '@/lib/utils';

/** One dialable emergency code and the network it is reachable from. */
export interface EmergencyShortcode {
  /** The code as a person dials it. */
  code: string;
  /** The carrier or line type the code works from. */
  carrier: string;
  /** Ready-to-use `tel:` target for the code. */
  href: string;
}

/** The confirmed codes, ordered by how widely each network is used. */
export const EMERGENCY_SHORTCODES: EmergencyShortcode[] = [
  { code: '911', carrier: 'Movistar', href: telHref('911') },
  { code: '112', carrier: 'Digitel', href: telHref('112') },
  { code: '*1', carrier: 'Movilnet', href: telHref('*1') },
  { code: '171', carrier: 'línea fija CANTV', href: telHref('171') },
];
