import { NextRequest, NextResponse } from 'next/server'
import { fetchPOIFromOverpass } from '@/lib/poiFetch'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') ?? '')

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 })
  }

  const result = await fetchPOIFromOverpass(lat, lng)

  if (!result) {
    // Overpass injoignable : erreur explicite, jamais mise en cache
    return NextResponse.json(
      { error: 'Service POI indisponible' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(result, {
    headers: {
      // Cache CDN 24 h, puis resservi pendant 7 jours le temps de se rafraîchir
      'Cache-Control': result.pois.length > 0
        ? 'public, s-maxage=86400, stale-while-revalidate=604800'
        : 'public, s-maxage=3600',
    },
  })
}
