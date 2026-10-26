/**
 * GET /api/icone?taille=192|512 — Icône de l'application (manifeste PWA, écran d'accueil mobile).
 */
import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'

const TAILLES = new Set([192, 512])

export async function GET(req: NextRequest) {
  const demandee = Number(req.nextUrl.searchParams.get('taille'))
  const taille = TAILLES.has(demandee) ? demandee : 512

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0F172A', color: 'white', fontSize: taille * 0.5, fontFamily: 'serif',
      }}>
        J<span style={{ color: '#818CF8', fontStyle: 'italic' }}>i</span>
      </div>
    ),
    { width: taille, height: taille, headers: { 'Cache-Control': 'public, max-age=604800, immutable' } },
  )
}
