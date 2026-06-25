import { ImageResponse } from 'next/og';

/** Dimensions for the social share cards (OpenGraph and Twitter). */
export const OG_SIZE = { width: 1200, height: 630 };

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
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1c2f79 0%, #1f47df 60%, #5d86fb 100%)',
          padding: '80px 96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
            border: '3px solid rgba(255,255,255,0.4)',
          }}
        >
          <span style={{ fontSize: 52, fontWeight: 700, color: 'white', lineHeight: 1 }}>A</span>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          Apoyo Venezuela
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: 'rgba(255,255,255,0.80)',
            marginTop: 24,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Coordina ayuda tras el terremoto
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: 'rgba(255,255,255,0.55)',
            marginTop: 16,
            letterSpacing: '0.5px',
          }}
        >
          apoyovenezuela.com
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
