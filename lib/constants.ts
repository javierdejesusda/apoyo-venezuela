/** App-wide constants shared across server and client components. */

/** Canonical site origin, overridable per environment. Public by design. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apoyovenezuela.com';

/** Sister project for missing-person reports after the earthquake. */
export const DESAPARECIDOS_URL = 'https://desaparecidosterremotovenezuela.com';
