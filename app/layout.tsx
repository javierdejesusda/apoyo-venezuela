import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

import './globals.css';

import { BottomNav } from '@/components/bottom-nav';
import { ConnectionStatus } from '@/components/connection-status';
import { DemoBanner } from '@/components/demo-banner';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ThemeProvider } from '@/components/theme-provider';
import { SITE_URL } from '@/lib/constants';
import { isDemoMode } from '@/lib/data/store';
import { themeInitScript } from '@/lib/theme';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
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
  creator: 'Apoyo Venezuela',
  publisher: 'Apoyo Venezuela',
  category: 'public safety',
  formatDetection: { telephone: false },
  alternates: { canonical: '/' },
  appleWebApp: {
    capable: true,
    title: 'Apoyo VE',
    statusBarStyle: 'black-translucent',
  },
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#1f47df',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} h-full`}
    >
      <head>
        {/* Apply the persisted theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink antialiased">
        <ThemeProvider>
          <DemoBanner show={isDemoMode()} />
          <ConnectionStatus />
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 md:pb-12">{children}</main>
          <SiteFooter />
          <BottomNav />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
