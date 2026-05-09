import { NextRequest, NextResponse } from 'next/server'

// Edge Runtime = Cloudflare network (IPs différentes d'AWS/Vercel Lambda)
// → contourne les restrictions IP de l'API ANFR sur Vercel Node.js
export const runtime = 'edge'

// ── Types ─────────────────────────────────────────────────────────────────────
export type Generation = '2G' | '3G' | '4G' | '5G'
export type CouvertureResult = {
  operateurs:  Record<string, Generation[]>
  generations: Generation[]
  antennes:    number
  rayon_km:    number
  disponible:  boolean
}

// ── Constantes ────────────────────────────────────────────────────────────────
const ANFR_BASE = 'https://data.anfr.fr/d4c/api/records/1.0/search/'
const DATASET   = 'observatoire_2g_3g_4g'
const RADII_M   = [2000, 5000]
const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']

// ── Normalisation ─────────────────────────────────────────────────────────────
function normalizeOp(raw: string): string {
  const u = (raw ?? '').toUpperCase()
  if (u.includes('ORANGE'))                        return 'Orange'
  if (u.includes('BOUYGUES'))                      return 'Bouygues'
  if (u.includes('FREE') || u.includes('ILIAD'))   return 'Free'
  if (u.includes('SFR'))                           return 'SFR'
  return raw
}

function normalizeGen(raw: string): Generation | null {
  const u = (raw ?? '').toUpperCase()
  if (u.includes('5G') || u.includes('NR'))    return '5G'
  if (u.includes('4G') || u.includes('LTE'))   return '4G'
  if (u.includes('3G') || u.includes('UMTS'))  return '3G'
  if (u.includes('2G') || u.includes('GSM'))   return '2G'
  return null
}

function sortGens(s: Set<Generation>): Generation[] {
  return GEN_ORDER.filter(g => s.has(g))
}

// ── Fetch ANFR ────────────────────────────────────────────────────────────────
async function fetchANFR(lat: number, lng: number, radiusM: number) {
  // ⚠️ geofilter.distance doit avoir des virgules LITTÉRALES (pas %2C)
  // → on ne passe pas par URLSearchParams pour ce paramètre
  const params = new URLSearchParams({
    dataset:          DATASET,
    rows:             '200',
    'exclude.statut': 'Projet approuvé',
  })
  const rawUrl = `${ANFR_BASE}?${params.toString()}&geofilter.distance=${lat},${lng},${radiusM}`

  const res = await fetch(rawUrl, {
    headers: {
      'Accept':       'application/json',
      'User-Agent':   'Mozilla/5.0 (compatible; JazzImmo/1.0)',
      'Referer':      'https://data.anfr.fr/',
      'Origin':       'https://data.anfr.fr',
    },
  })

  if (!res.ok) throw new Error(`ANFR HTTP ${res.status}`)

  const data = await res.json()
  return { records: (data.records ?? []) as any[], url: rawUrl }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat   = parseFloat(searchParams.get('lat')   ?? '')
  const lng   = parseFloat(searchParams.get('lng')   ?? '')
  const debug = searchParams.get('debug') === '1'

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat/lng invalides' }, { status: 400 })
  }

  for (const radiusM of RADII_M) {
    try {
      const { records, url } = await fetchANFR(lat, lng, radiusM)

      if (debug) {
        return NextResponse.json({
          runtime: 'edge', radiusM, url,
          nhits: records.length,
          sample: records.slice(0, 2).map((r: any) => r.fields),
        })
      }

      if (records.length === 0) continue

      const opMap: Record<string, Set<Generation>> = {}
      const genSet = new Set<Generation>()

      for (const r of records) {
        const op  = normalizeOp(r.fields?.adm_lb_nom ?? '')
        const gen = normalizeGen(r.fields?.generation ?? '')
        if (!gen) continue
        if (!opMap[op]) opMap[op] = new Set()
        opMap[op].add(gen)
        genSet.add(gen)
      }

      const result: CouvertureResult = {
        operateurs:  Object.fromEntries(Object.entries(opMap).map(([op, s]) => [op, sortGens(s)])),
        generations: sortGens(genSet),
        antennes:    records.length,
        rayon_km:    radiusM / 1000,
        disponible:  true,
      }

      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      })

    } catch (err: any) {
      if (debug) {
        return NextResponse.json({ runtime: 'edge', error: String(err), radiusM })
      }
    }
  }

  return NextResponse.json(
    { operateurs: {}, generations: [], antennes: 0, rayon_km: 5, disponible: false } satisfies CouvertureResult,
    { headers: { 'Cache-Control': 'public, s-maxage=60' } },
  )
}
