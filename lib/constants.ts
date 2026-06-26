/** App-wide constants shared across server and client components. */

/** Canonical site origin, overridable per environment. Public by design. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apoyovenezuela.com';

/** Sister project for missing-person reports after the earthquake. */
export const DESAPARECIDOS_URL = 'https://desaparecidosterremotovenezuela.com';

/** Public source repository: the project is open source and contributions are welcome. */
export const GITHUB_URL = 'https://github.com/javierdejesusda/apoyo-venezuela';

/** Campaign hashtag used in social share text. */
export const CAMPAIGN_HASHTAG = '#TerremotoVenezuela';
