/**
 * GET /api/biens-proches?lat=..&lng=..
 * Biens publiés les plus proches d'une position (bouton « Me localiser » de l'accueil),
 * avec le nom de la commune correspondante.
 *
 * La position n'est ni stockée ni journalisée.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBiensProches } from '@/lib/biensProches'

/** Commune d'une position, via la Base Adresse Nationale (France uniquement). */
async function communeDe(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}&limit=1`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const p = data.features?.[0]?.properties
    return p?.city ?? p?.municipality ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'))
  const lng = Number(req.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Position invalide' }, { status: 400 })
  }

  // ~1 km de précision suffit pour trier par proximité, et évite de manipuler la position exacte
  const latR = Math.round(lat * 100) / 100
  const lngR = Math.round(lng * 100) / 100

  const supabase = await createClient()
  const [biens, ville] = await Promise.all([
    getBiensProches(supabase, latR, lngR, 6),
    communeDe(latR, lngR),
  ])

  return NextResponse.json({ biens, ville })
}
