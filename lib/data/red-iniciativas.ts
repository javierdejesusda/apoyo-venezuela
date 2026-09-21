/**
 * Red de Iniciativas: the network of independent technology efforts that
 * organized in the first 48 hours after the June 2026 earthquake to support
 * the emergency response in Venezuela.
 *
 * This is a pure data module (no React imports) so it can be validated in
 * isolation and reused by both the page and its tests. Category icons are
 * mapped in the page, keeping this layer free of UI concerns.
 */

/** A single category of need, with the external initiatives that cover it. */
export interface InitiativeCategory {
  /** URL-safe identifier, also used as the section anchor. */
  slug: string;
  /** Human-readable category title shown as the section heading. */
  title: string;
  /** Short, neutral description of what the category helps with. */
  description: string;
  /** Absolute https links to the initiatives covering this category. */
  urls: string[];
}

/** Single entry point that aggregates every initiative in one place. */
export const CENTRAL_PLATFORM = {
  name: 'Red Quipu',
  url: 'https://redquipu.com',
} as const;

/**
 * The published categories, in the priority order shared in the original
 * coordination message. Some sites appear under more than one category on
 * purpose: an initiative often serves several needs at once.
 */
export const INITIATIVE_CATEGORIES: InitiativeCategory[] = [
  {
    slug: 'personas-desaparecidas',
    title: 'Reporte de personas desaparecidas',
    description: 'Reporta o busca a personas no localizadas tras el sismo.',
    urls: [
      'https://venezuelareporta.org',
      'https://venezuelatebusca.com',
      'https://desaparecidosterremotovenezuela.com',
      'https://radarvzla.com',
      'https://www.unidosvenezuela.io',
      'https://tuia911.com',
    ],
  },
  {
    slug: 'danos-estructurales',
    title: 'Reporte de daños estructurales',
    description: 'Reporta edificaciones afectadas y consulta el estado de las zonas.',
    urls: [
      'https://terremotovenezuela.com',
      'https://tilinapp.com',
      'https://app.appcentinela.com/instalar',
    ],
  },
  {
    slug: 'apoyo-presencial-rescate',
    title: 'Apoyo presencial y rescate',
    description: 'Coordina equipos de apoyo en sitio y labores de rescate.',
    urls: ['https://rescate-ve.vercel.app'],
  },
  {
    slug: 'inspeccion-habitabilidad',
    title: 'Ingenieros para inspección de habitabilidad',
    description: 'Solicita la evaluación técnica de una vivienda antes de habitarla.',
    urls: [
      'https://habitable.lovable.app',
      'https://www.instagram.com/grupoavila.ve',
      'https://app.appcentinela.com/instalar',
    ],
  },
  {
    slug: 'centros-de-acopio',
    title: 'Centros de acopio',
    description: 'Encuentra dónde llevar o retirar donaciones de insumos.',
    urls: [
      'https://ayudaparavenezuela.com',
      'https://www.veneconnect.com/apoyo-terremoto',
      'https://tugruero.com',
      'https://zonasegura.up.railway.app',
      'https://t.me/redajeapoyobot',
      'https://tuia911.com',
      'https://avisave.com',
    ],
  },
  {
    slug: 'insumos-por-zona',
    title: 'Insumos requeridos por zona',
    description: 'Consulta qué insumos hacen falta en cada zona afectada.',
    urls: ['https://ayudaparavenezuela.com', 'https://redh.avapre.com'],
  },
  {
    slug: 'donaciones-y-pagos',
    title: 'Donaciones y redes de pago',
    description: 'Aporta de forma económica a través de canales de donación.',
    urls: ['https://donavenezuela.com'],
  },
  {
    slug: 'centros-de-alimentacion',
    title: 'Centros de alimentación',
    description: 'Ubica puntos donde se ofrece alimentación a damnificados.',
    urls: ['https://refugiosvenezuela.com'],
  },
  {
    slug: 'refugios-y-alojamiento',
    title: 'Refugios y alojamiento',
    description: 'Encuentra u ofrece refugio temporal y alojamiento.',
    urls: [
      'https://refugiosvenezuela.com',
      'https://zonasegura.up.railway.app',
      'https://puertasabiertasvzla.org',
    ],
  },
  {
    slug: 'pacientes-en-hospitales',
    title: 'Pacientes en hospitales',
    description: 'Ubica y da seguimiento a pacientes atendidos en hospitales.',
    urls: ['https://pacientesterremotovzla.lovable.app'],
  },
  {
    slug: 'mascotas',
    title: 'Información de mascotas',
    description: 'Reporta o busca mascotas extraviadas tras la emergencia.',
    urls: ['https://www.huellascan.com/terremoto'],
  },
  {
    slug: 'logistica-y-transporte',
    title: 'Logística y transporte',
    description: 'Coordina traslado de insumos, equipos y personas.',
    urls: ['https://rescate-ve.vercel.app'],
  },
  {
    slug: 'apoyo-medico-psicologico',
    title: 'Apoyo médico y psicológico',
    description: 'Accede a atención médica y acompañamiento psicológico.',
    urls: ['https://www.nueveonce.com', 'https://venemergencia.com'],
  },
];
