import { NextRequest, NextResponse } from 'next/server'
import {
  POI_CATEGORIES,
  OVERPASS_QUERY,
  OVERPASS_SERVERS,
  SEARCH_RADII,
  detectCategory,
  computeNeighborhoodScore,
} from '@/lib/poi'

export const runtime = 'nodejs'
// Cache CDN 24h, browser 1h, stale-while-revalidate 7 jours
export const revalidate = 86400

type POIResult = { name: string; distance: number; emoji: string }

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchAtRadius(
  lat: number, lng: number, deg: number, maxDistM: number,
): Promise<Record<string, POIResult> | null> {
  const bbox  = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
  const query = OVERPASS_QUERY(bbox)

  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method:  'POST',
        body:    `data=${encodeURIComponent(query)}`,
        signal:  AbortSignal.timeout(9000),
        headers: { 'User-Agent': 'Terranova/1.0 (immobilier)' },
      })
      if (!res.ok) continue

      const data = await res.json()
      const best: Record<string, POIResult> = {}

      for (const el of data.elements ?? []) {
        const cat = detectCategory(el.tags ?? {})
        if (!cat) continue
        const dist = Math.round(haversineM(lat, lng, el.lat, el.lon))
        if (dist > maxDistM) continue
        const name = el.tags?.name || el.tags?.['name:fr'] || ''
        if (!best[cat] || dist < best[cat].distance) {
          best[cat] = {
            name,
            distance: dist,
            emoji: POI_CATEGORIES.find(c => c.key === cat)?.emoji ?? '📍',
          }
        }
      }
      return Object.keys(best).length > 0 ? best : null
    } catch {
      continue
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') ?? '')

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 })
  }

  // Optionnel : poids personnalisés en JSON dans ?weights=
  const weightsRaw = req.nextUrl.searchParams.get('weights')
  let poiWeights: Record<string, number> | undefined
  if (weightsRaw) {
    try { poiWeights = JSON.parse(weightsRaw) } catch { /* noop */ }
  }

  for (const { km, deg } of SEARCH_RADII) {
    const best = await fetchAtRadius(lat, lng, deg, km * 1000)
    if (best) {
      const score = computeNeighborhoodScore(best, poiWeights)
      return NextResponse.json(
        { best, score, radiusKm: km },
        { headers: {
          // CDN Vercel : 24h, stale-while-revalidate 7j
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        } },
      )
    }
  }

  // Aucun POI trouvé même au rayon max
  return NextResponse.json(
    { best: {}, score: 0, radiusKm: SEARCH_RADII[SEARCH_RADII.length - 1].km },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
  )
}
