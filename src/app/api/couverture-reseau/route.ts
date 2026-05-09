import { NextRequest, NextResponse } from 'next/server'

export const runtime   = 'nodejs'
export const dynamic   = 'force-dynamic'   // jamais de cache Next.js sur cette route
// Le cache HTTP est géré manuellement via Cache-Control dans la réponse

// ── Types ─────────────────────────────────────────────────────────────────────
export type Generation  = '2G' | '3G' | '4G' | '5G'
export type CouvertureResult = {
  operateurs: Record<string, Generation[]>
  generations: Generation[]
  antennes:   number
  rayon_km:   number
  disponible: boolean
}

// ── Constantes ────────────────────────────────────────────────────────────────
// URL confirmée via documentation ANFR : préfixe /d4c/ obligatoire
// Statuts actifs : "En service" (2G/3G/4G) et "Techniquement opérationnel" (5G)
const ANFR_BASE = 'https://data.anfr.fr/d4c/api/records/1.0/search/'
const DATASET   = 'observatoire_2g_3g_4g'
const RADII_M   = [2000, 5000]

// ── Normalisation ─────────────────────────────────────────────────────────────
function normalizeOp(raw: string): string {
  const u = (raw ?? '').toUpperCase()
  if (u.includes('ORANGE'))                     return 'Orange'
  if (u.includes('BOUYGUES'))                   return 'Bouygues'
  if (u.includes('FREE') || u.includes('ILIAD'))return 'Free'
  if (u.includes('SFR'))                        return 'SFR'
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

// ── Fetch ANFR ────────────────────────────────────────────────────────────────
async function fetchANFR(lat: number, lng: number, radiusM: number) {
  const url = new URL(ANFR_BASE)
  url.searchParams.set('dataset',            DATASET)
  url.searchParams.set('geofilter.distance', `${lat},${lng},${radiusM}`)
  url.searchParams.set('rows',               '200')
  // Exclure les projets non encore en service
  url.searchParams.set('exclude.statut',     'Projet approuvé')

  const res = await fetch(url.toString(), {
    signal:  AbortSignal.timeout(12_000),
    cache:   'no-store',
    headers: {
      'Accept':          'application/json, text/plain, */*',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      'Origin':          'https://data.anfr.fr',
      'Referer':         'https://data.anfr.fr/explore/dataset/observatoire_2g_3g_4g/',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  })

  if (!res.ok) throw new Error(`ANFR HTTP ${res.status}`)

  const data       = await res.json()
  const records: any[] = data.records ?? []
  return { records, nhits: data.nhits ?? 0, url: url.toString() }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const lat   = parseFloat(req.nextUrl.searchParams.get('lat')   ?? '')
  const lng   = parseFloat(req.nextUrl.searchParams.get('lng')   ?? '')
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat/lng invalides' }, { status: 400 })
  }

  const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']
  const sortGens = (s: Set<Generation>): Generation[] => GEN_ORDER.filter(g => s.has(g))

  for (const radiusM of RADII_M) {
    let rawUrl = ''
    try {
      const { records, nhits, url } = await fetchANFR(lat, lng, radiusM)
      rawUrl = url

      if (debug) {
        return NextResponse.json({
          debug: true, nhits, radiusM, url,
          sample: records.slice(0, 3).map((r: any) => r.fields),
        })
      }

      if (records.length === 0) continue   // essaie le rayon suivant

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
      console.error('[couverture-reseau]', radiusM, 'm :', err?.message ?? err, rawUrl)
      if (debug) {
        return NextResponse.json({ debug: true, error: String(err), radiusM, url: rawUrl })
      }
    }
  }

  return NextResponse.json(
    { operateurs: {}, generations: [], antennes: 0, rayon_km: 5, disponible: false } satisfies CouvertureResult,
    { headers: { 'Cache-Control': 'public, s-maxage=60' } },
  )
}
