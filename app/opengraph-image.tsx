import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Apoyo Venezuela - coordinación de ayuda tras el terremoto'

export default async function Image(): Promise<ImageResponse> {
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
        {/* Brand mark - simple circle with "A" initial */}
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
          <span
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1,
            }}
          >
            A
          </span>
        </div>

        {/* Main title */}
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

        {/* Subtitle */}
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

        {/* Domain */}
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
    { ...size },
  )
}
