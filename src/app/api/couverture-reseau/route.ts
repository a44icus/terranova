import { NextRequest, NextResponse } from 'next/server'

export const runtime   = 'nodejs'
export const revalidate = 86400   // cache CDN 24h

// ── Types ─────────────────────────────────────────────────────────────────────
export type Generation  = '2G' | '3G' | '4G' | '5G'
export type Operateur   = 'Orange' | 'SFR' | 'Bouygues' | 'Free'
export type CouvertureResult = {
  operateurs: Record<string, Generation[]>   // { Orange: ['4G','5G'], SFR: ['4G'], … }
  generations: Generation[]                  // générations disponibles (union)
  antennes: number                           // nb d'antennes trouvées
  rayon_km: number                           // rayon utilisé
  disponible: boolean                        // false si appel ANFR échoué
}

// ── Constantes ────────────────────────────────────────────────────────────────
const ANFR_API = 'https://data.anfr.fr/anfr/api/records/1.0/search/'
const DATASET  = 'observatoire_du_deploiement_des_reseaux_mobiles_de_telephonie_mobile'
const RADII_M  = [2000, 5000]   // essaie 2 km puis 5 km

// Normalise les noms d'opérateurs (ANFR utilise des variantes)
function normalizeOp(raw: string): string {
  if (/orange/i.test(raw))        return 'Orange'
  if (/sfr/i.test(raw))           return 'SFR'
  if (/bouygues/i.test(raw))      return 'Bouygues'
  if (/free/i.test(raw) || /iliad/i.test(raw)) return 'Free'
  return raw
}

// Normalise la génération (ANFR stocke "4G", "5G NR", etc.)
function normalizeGen(raw: string): Generation | null {
  if (/5G/i.test(raw)) return '5G'
  if (/4G/i.test(raw)) return '4G'
  if (/3G/i.test(raw)) return '3G'
  if (/2G/i.test(raw)) return '2G'
  return null
}

async function fetchANFR(
  lat: number, lng: number, radiusM: number,
): Promise<CouvertureResult | null> {
  const url = new URL(ANFR_API)
  url.searchParams.set('dataset',           DATASET)
  url.searchParams.set('geofilter.distance', `${lat},${lng},${radiusM}`)
  url.searchParams.set('rows',              '200')
  url.searchParams.set('refine.statut',     'En service')

  const res = await fetch(url.toString(), {
    signal:  AbortSignal.timeout(10_000),
    headers: { 'User-Agent': 'JazzImmo/1.0 (immobilier fr)' },
  })
  if (!res.ok) return null

  const data = await res.json()
  const records: any[] = data.records ?? []
  if (records.length === 0) return null

  const opMap: Record<string, Set<Generation>> = {}
  const genSet = new Set<Generation>()

  for (const r of records) {
    const op  = normalizeOp(r.fields?.adm_lb_nom ?? '')
    const gen = normalizeGen(r.fields?.generation ?? '')
    if (!op || !gen) continue
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
    } catch { /* continue */ }
  }

  // Aucune antenne trouvée ou API indisponible
  return NextResponse.json(
    { operateurs: {}, generations: [], antennes: 0, rayon_km: 5, disponible: false } satisfies CouvertureResult,
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
  )
}
