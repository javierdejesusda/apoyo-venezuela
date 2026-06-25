import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { VE_PATHS } from '@/components/ui/venezuela-silhouette';

/** Dimensions for the social share cards (OpenGraph and Twitter). */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Static Bricolage Grotesque (weight 700) used for the headline wordmark.
 * The image routes prerender at build time, where process.cwd() is the repo
 * root. next.config outputFileTracingIncludes also ships the font for any
 * runtime render of these routes.
 */
const bricolageBold = readFileSync(
  join(process.cwd(), 'assets/fonts/BricolageGrotesque-Bold.ttf'),
);

/** Inline national silhouette for the social card (Satori-friendly). */
function Venezuela({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024">
      <g transform="translate(0,1024) scale(0.1,-0.1)" fill={fill}>
        {VE_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/** Renders the shared branded social card used by both image routes. */
export function renderOgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0d1320 0%, #16203a 100%)',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* Thin emergency signal line across the top. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundImage: 'linear-gradient(to right, #e5484d, #e8930c, #5d86fb)',
          }}
        />

        {/* National silhouette watermark, bleeding off the right edge. */}
        <div style={{ position: 'absolute', top: 30, right: -150, display: 'flex', opacity: 0.08 }}>
          <Venezuela size={780} fill="#ffffff" />
        </div>

        {/* Brand mark + eyebrow. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              width: 88,
              height: 88,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #2a5cff, #1a39bd)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Venezuela size={60} fill="#ffffff" />
          </div>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#aeb8cd', fontWeight: 600 }}>
            EMERGENCIA · SISMO 24 JUN 2026
          </div>
        </div>

        {/* Headline. */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Bricolage Grotesque',
              fontSize: 94,
              fontWeight: 800,
              color: '#f5f7fc',
              letterSpacing: -2,
              lineHeight: 1.04,
            }}
          >
            Apoyo Venezuela
          </div>
          <div style={{ display: 'flex', fontSize: 40, color: '#aeb8cd', marginTop: 20 }}>
            Coordina la ayuda tras el terremoto, zona por zona
          </div>
        </div>

        {/* Domain. */}
        <div style={{ display: 'flex', fontSize: 28, color: '#74809a', letterSpacing: 1 }}>
          apoyovenezuela.com
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: 'Bricolage Grotesque',
          data: bricolageBold,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );
}
