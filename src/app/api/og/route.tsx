/**
 * GET /api/og — Image de partage par défaut (1200×630), utilisée quand l'admin n'a pas
 * renseigné d'image dans les réglages et que la page n'a pas d'image propre.
 */
import { ImageResponse } from 'next/og'
import { SITE_DOMAIN } from '@/lib/site'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '80px', background: '#0F172A', color: 'white',
      }}>
        <div style={{ display: 'flex', fontSize: 96, fontFamily: 'serif', letterSpacing: 2 }}>
          Jazz<span style={{ color: '#818CF8', fontStyle: 'italic' }}>Immo</span>
        </div>
        <div style={{ display: 'flex', fontSize: 40, marginTop: 24, color: 'rgba(255,255,255,0.75)' }}>
          L&apos;immobilier sur une carte, sans intermédiaire
        </div>
        <div style={{ display: 'flex', fontSize: 28, marginTop: 48, color: '#818CF8' }}>{SITE_DOMAIN}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}
