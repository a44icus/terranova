import { NextRequest, NextResponse } from 'next/server'
import {
  POI_CATEGORIES,
  OVERPASS_QUERY,
  OVERPASS_SERVERS,
  SEARCH_RADII,
  detectCategory,
  poiEmoji,
  poiSubtype,
  computeNeighborhoodScore,
} from '@/lib/poi'

export const runtime = 'nodejs'

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
) {
  const bbox  = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
  const query = OVERPASS_QUERY(bbox)

  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(9000),
        headers: { 'User-Agent': 'Terranova/1.0 (immobilier)' },
      })
      if (!res.ok) continue

      const data = await res.json()
      const bestByCategory: Record<string, any> = {}

      for (const el of data.elements ?? []) {
        if (!el.lat || !el.lon) continue
        const distance = Math.round(haversineM(lat, lng, el.lat, el.lon))
        if (distance > maxDistM) continue
        const categoryKey = detectCategory(el.tags ?? {})
        if (!categoryKey) continue
        const tags = el.tags ?? {}
        const cat = POI_CATEGORIES.find(c => c.key === categoryKey)
        if (!bestByCategory[categoryKey] || distance < bestByCategory[categoryKey].distance) {
          bestByCategory[categoryKey] = {
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            tags,
            distance,
            categoryKey,
            name: tags.name || tags['name:fr'] || cat?.label || categoryKey,
            emoji: poiEmoji(tags),
            subtype: poiSubtype(tags),
          }
        }
      }

      const pois = Object.values(bestByCategory).sort((a, b) => a.distance - b.distance)
      if (pois.length > 0) return { pois, best: bestByCategory, score: computeNeighborhoodScore(bestByCategory) }
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

  for (const { km, deg } of SEARCH_RADII) {
    const result = await fetchAtRadius(lat, lng, deg, km * 1000)
    if (result) {
      return NextResponse.json(
        { ...result, radiusKm: km, score: result.score },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
      )
    }
  }

  return NextResponse.json(
    { pois: [], best: {}, radiusKm: SEARCH_RADII[SEARCH_RADII.length - 1].km },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
  )
}
