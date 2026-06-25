import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

import './globals.css';

import { BottomNav } from '@/components/bottom-nav';
import { DemoBanner } from '@/components/demo-banner';
import { RealtimeRefresher } from '@/components/realtime-refresher';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SITE_URL } from '@/lib/constants';
import { isDemoMode } from '@/lib/data/store';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Apoyo Venezuela - coordina ayuda tras el terremoto',
    template: '%s | Apoyo Venezuela',
  },
  description:
    'Mapa colaborativo para reportar zonas afectadas por el terremoto en Venezuela, publicar necesidades por ubicación y consultar teléfonos de emergencia verificados.',
  applicationName: 'Apoyo Venezuela',
  keywords: ['terremoto', 'Venezuela', 'ayuda', 'emergencia', 'sismo', 'damnificados', 'San Felipe', 'Carabobo'],
  authors: [{ name: 'Apoyo Venezuela' }],
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    url: SITE_URL,
    siteName: 'Apoyo Venezuela',
    title: 'Apoyo Venezuela - coordina ayuda tras el terremoto',
    description:
      'Reporta zonas afectadas, publica necesidades por ubicación y consulta teléfonos de emergencia verificados.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apoyo Venezuela',
    description: 'Coordina ayuda tras el terremoto en Venezuela.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#1f47df',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink antialiased">
        <DemoBanner show={isDemoMode()} />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 md:pb-12">{children}</main>
        <SiteFooter />
        <BottomNav />
        <RealtimeRefresher />
      </body>
    </html>
  );
}
