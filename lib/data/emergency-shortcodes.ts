/**
 * National emergency short codes for Venezuela, by carrier.
 *
 * No single code reaches emergency services from every network: it depends on
 * the line the call is placed from. The retired /telefonos page carried that
 * distinction, so the transition page has to carry it now, otherwise someone
 * on another carrier dials a dead line during an emergency.
 *
 * Provenance matters more than usual here, because this page is the last one
 * publishing these numbers and nobody is maintaining it. The pairing was
 * confirmed on 24-06-2026 against
 * https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/
 * and national emergency directories. Re-verify against a current source
 * before changing any of it.
 *
 * Pure data with no imports, so it can be validated in isolation and reused by
 * both the page and its tests.
 */

/**
 * The code the header shortcut dials. Declared on its own, and reused in the
 * list below, so that reordering the list for presentation can never change
 * which number a tap on the header places.
 */
export const PRIMARY_SHORTCODE = { code: '911', carrier: 'Movistar' } as const;

/** Every confirmed code, ordered by how widely each network is used. */
export const EMERGENCY_SHORTCODES = [
  PRIMARY_SHORTCODE,
  { code: '112', carrier: 'Digitel' },
  { code: '*1', carrier: 'Movilnet' },
  { code: '171', carrier: 'línea fija CANTV' },
] as const;
