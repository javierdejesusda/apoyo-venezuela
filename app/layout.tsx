import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

import './globals.css';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ThemeProvider } from '@/components/theme-provider';
import { WebAnalytics } from '@/components/web-analytics';
import { SITE_URL } from '@/lib/constants';
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
  title: 'Apoyo Venezuela dejó de operar',
  description:
    'Apoyo Venezuela dejó de operar. La coordinación de ayuda tras el sismo de junio de 2026 en Venezuela continúa en la red de iniciativas, con Red Quipu como plataforma central.',
  applicationName: 'Apoyo Venezuela',
  keywords: ['terremoto', 'Venezuela', 'ayuda', 'emergencia', 'sismo', 'red de iniciativas', 'Red Quipu'],
  authors: [{ name: 'Apoyo Venezuela' }],
  creator: 'Apoyo Venezuela',
  publisher: 'Apoyo Venezuela',
  category: 'public safety',
  formatDetection: { telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    url: SITE_URL,
    siteName: 'Apoyo Venezuela',
    title: 'Apoyo Venezuela dejó de operar',
    description:
      'La coordinación de ayuda continúa en la red de iniciativas, con Red Quipu como plataforma central.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apoyo Venezuela dejó de operar',
    description:
      'La coordinación de ayuda continúa en la red de iniciativas, con Red Quipu como plataforma central.',
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
      className={`${display.variable} ${sans.variable} h-full overflow-x-clip`}
    >
      <head>
        {/* Apply the persisted theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink antialiased">
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-4">{children}</main>
          <SiteFooter />
          <WebAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
