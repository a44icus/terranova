import { NextRequest, NextResponse } from 'next/server'

export const runtime    = 'nodejs'
export const revalidate = 86400   // cache CDN 24h

// ── Types ─────────────────────────────────────────────────────────────────────
export type Generation  = '2G' | '3G' | '4G' | '5G'
export type Operateur   = 'Orange' | 'SFR' | 'Bouygues' | 'Free'
export type CouvertureResult = {
  operateurs: Record<string, Generation[]>   // { Orange: ['4G','5G'], SFR: ['4G'], … }
  generations: Generation[]                  // générations disponibles (union)
  antennes:   number                         // nb d'antennes trouvées
  rayon_km:   number                         // rayon utilisé
  disponible: boolean                        // false si appel ANFR échoué
}

// ── Constantes ────────────────────────────────────────────────────────────────
// URL confirmée : préfixe /d4c/ obligatoire sur le portail ANFR
// Statuts : "En service" pour 2G/3G/4G · "Techniquement opérationnel" pour 5G
// → pas de filtre statut pour capturer toutes les générations
const ANFR_API = 'https://data.anfr.fr/d4c/api/records/1.0/search/'
const DATASET  = 'observatoire_2g_3g_4g'
const RADII_M  = [2000, 5000]   // essaie 2 km, puis 5 km

// ── Normalisation ─────────────────────────────────────────────────────────────

// ANFR : "ORANGE", "BOUYGUES TELECOM", "FREE MOBILE", "SFR", "SOCIETE FRANCAISE…"
function normalizeOp(raw: string): string {
  const u = raw.toUpperCase()
  if (u.includes('ORANGE'))   return 'Orange'
  if (u.includes('BOUYGUES')) return 'Bouygues'
  if (u.includes('FREE') || u.includes('ILIAD')) return 'Free'
  if (u.includes('SFR'))      return 'SFR'
  return raw
}

// ANFR : "2G" | "3G" | "4G" | "5G"  (parfois "4G+" ou "5G NR")
function normalizeGen(raw: string): Generation | null {
  const u = raw.toUpperCase()
  if (u.includes('5G') || u.includes('NR'))   return '5G'
  if (u.includes('4G') || u.includes('LTE'))  return '4G'
  if (u.includes('3G') || u.includes('UMTS')) return '3G'
  if (u.includes('2G') || u.includes('GSM'))  return '2G'
  return null
}

// ── Fetch ANFR ────────────────────────────────────────────────────────────────
async function fetchANFR(
  lat: number, lng: number, radiusM: number,
): Promise<CouvertureResult | null> {
  const url = new URL(ANFR_API)
  url.searchParams.set('dataset',            DATASET)
  url.searchParams.set('geofilter.distance', `${lat},${lng},${radiusM}`)
  url.searchParams.set('rows',               '200')
  // Pas de filtre statut : 2G/3G/4G = "En service", 5G = "Techniquement opérationnel"

  const res = await fetch(url.toString(), {
    signal:  AbortSignal.timeout(12_000),
    headers: { 'User-Agent': 'JazzImmo/1.0 (immobilier fr)' },
    next:    { revalidate: 86400 },
  })

  if (!res.ok) {
    console.error('[couverture-reseau] ANFR HTTP', res.status, url.toString())
    return null
  }

  const data = await res.json()
  const records: any[] = data.records ?? []

  if (records.length === 0) return null

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

  const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']
  const sortGens = (s: Set<Generation>): Generation[] =>
    GEN_ORDER.filter(g => s.has(g))

  return {
    operateurs:  Object.fromEntries(Object.entries(opMap).map(([op, s]) => [op, sortGens(s)])),
    generations: sortGens(genSet),
    antennes:    records.length,
    rayon_km:    radiusM / 1000,
    disponible:  true,
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get('lat') ?? '')
  const lng = parseFloat(req.nextUrl.searchParams.get('lng') ?? '')

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat/lng invalides' }, { status: 400 })
  }

  for (const radiusM of RADII_M) {
    try {
      const result = await fetchANFR(lat, lng, radiusM)
      if (result) {
        return NextResponse.json(result, {
          headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
        })
      }
    } catch (err) {
      console.error('[couverture-reseau] fetch error at radius', radiusM, err)
      // continue au rayon suivant
    }
  }

  // Aucune antenne trouvée dans aucun rayon
  return NextResponse.json(
    { operateurs: {}, generations: [], antennes: 0, rayon_km: RADII_M[RADII_M.length - 1] / 1000, disponible: false } satisfies CouvertureResult,
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
  )
}
