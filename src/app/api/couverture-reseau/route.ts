import { NextRequest, NextResponse } from 'next/server'

// Edge Runtime = Cloudflare network (IPs différentes d'AWS/Vercel Lambda)
// → contourne les restrictions IP des APIs ANFR/ARCEP sur Vercel Node.js
export const runtime = 'edge'

// ── Types ─────────────────────────────────────────────────────────────────────
export type Generation = '2G' | '3G' | '4G' | '5G'
export type CouvertureResult = {
  operateurs:   Record<string, Generation[]>
  generations:  Generation[]
  antennes:     number
  rayon_km:     number
  disponible:   boolean
  fibre_arcep:  boolean | null   // null = données indisponibles chez ARCEP
}

// ── Constantes ANFR ───────────────────────────────────────────────────────────
const ANFR_BASE = 'https://data.anfr.fr/d4c/api/records/1.0/search/'
const DATASET   = 'observatoire_2g_3g_4g'
const RADII_M   = [2000, 5000]
const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']

// ── Constantes ARCEP fibre ────────────────────────────────────────────────────
// data.arcep.fr = OpenDataSoft v2.1 — POINT(lng lat) en WKT
const ARCEP_BASE    = 'https://data.arcep.fr/api/explore/v2.1/catalog/datasets'
const ARCEP_DATASET = 'oc-deploiement-ftth'   // Observatoire du déploiement FTTH
const FIBRE_RADIUS  = 300                      // mètres autour du point

// ── Normalisation mobile ──────────────────────────────────────────────────────
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

// ── Fetch ANFR (mobile) ───────────────────────────────────────────────────────
async function fetchANFR(lat: number, lng: number, radiusM: number) {
  // ⚠️ geofilter.distance doit avoir des virgules LITTÉRALES (pas %2C)
  const params = new URLSearchParams({
    dataset:          DATASET,
    rows:             '200',
    'exclude.statut': 'Projet approuvé',
  })
  const rawUrl = `${ANFR_BASE}?${params.toString()}&geofilter.distance=${lat},${lng},${radiusM}`

  const res = await fetch(rawUrl, {
    headers: {
      'Accept':     'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; JazzImmo/1.0)',
      'Referer':    'https://data.anfr.fr/',
      'Origin':     'https://data.anfr.fr',
    },
  })

  if (!res.ok) throw new Error(`ANFR HTTP ${res.status}`)
  const data = await res.json()
  return { records: (data.records ?? []) as any[], url: rawUrl }
}

// ── Fetch ARCEP (fibre fixe) ──────────────────────────────────────────────────
async function fetchARCEPFibre(
  lat: number, lng: number
): Promise<{ fibre: boolean | null; url: string; nhits: number; statuts: string[]; error?: string }> {
  // WKT POINT = (longitude latitude)
  const where  = `within_distance(geo_point_2d, geom'POINT(${lng} ${lat})', ${FIBRE_RADIUS}m)`
  const rawUrl = `${ARCEP_BASE}/${ARCEP_DATASET}/records`
    + `?where=${encodeURIComponent(where)}`
    + `&select=statut_avancement,operateur`
    + `&limit=10`

  try {
    const res = await fetch(rawUrl, {
      headers: {
        'Accept':     'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; JazzImmo/1.0)',
        'Referer':    'https://data.arcep.fr/',
        'Origin':     'https://data.arcep.fr',
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!res.ok) return { fibre: null, url: rawUrl, nhits: 0, statuts: [], error: `HTTP ${res.status}` }

    const data  = await res.json()
    const results: any[] = data.results ?? []
    const nhits = data.total_count ?? results.length

    if (results.length === 0) return { fibre: false, url: rawUrl, nhits: 0, statuts: [] }

    // Collecte des statuts présents
    const statuts = [...new Set(
      results.map((r: any) => (r.statut_avancement ?? '').trim()).filter(Boolean)
    )] as string[]

    // Statuts qui confirment la disponibilité fibre
    const STATUTS_OK = ['raccordable', 'déployé', 'en service', 'operationnel', 'opérationnel']
    const estDisponible = statuts.some(s =>
      STATUTS_OK.some(ok => s.toLowerCase().includes(ok))
    )

    // Si aucun statut renseigné mais des records existent → on considère disponible
    const fibre = statuts.length === 0 ? true : estDisponible

    return { fibre, url: rawUrl, nhits, statuts }
  } catch (err: any) {
    return { fibre: null, url: rawUrl, nhits: 0, statuts: [], error: String(err) }
  }
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

  // ── Fibre ARCEP (lancé en parallèle, indépendant du rayon mobile) ──────────
  const fibrePromise = fetchARCEPFibre(lat, lng)

  for (const radiusM of RADII_M) {
    try {
      const [{ records, url }, fibreResult] = await Promise.all([
        fetchANFR(lat, lng, radiusM),
        fibrePromise,
      ])

      if (debug) {
        return NextResponse.json({
          runtime: 'edge', radiusM, url,
          nhits: records.length,
          sample: records.slice(0, 2).map((r: any) => r.fields),
          fibre: {
            url:    fibreResult.url,
            nhits:  fibreResult.nhits,
            statuts: fibreResult.statuts,
            result: fibreResult.fibre,
            error:  fibreResult.error,
          },
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
        fibre_arcep: fibreResult.fibre,
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

  // Aucune antenne trouvée — on retourne quand même la fibre si dispo
  const fibreResult = await fibrePromise
  return NextResponse.json(
    {
      operateurs: {}, generations: [], antennes: 0, rayon_km: 5,
      disponible: false,
      fibre_arcep: fibreResult.fibre,
    } satisfies CouvertureResult,
    { headers: { 'Cache-Control': 'public, s-maxage=60' } },
  )
}
