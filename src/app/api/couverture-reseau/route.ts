import { NextRequest, NextResponse } from 'next/server'

// Edge Runtime = Cloudflare (IPs différentes d'AWS/Vercel Lambda)
export const runtime = 'edge'

// ── Types ─────────────────────────────────────────────────────────────────────
export type Generation = '2G' | '3G' | '4G' | '5G'
export type CouvertureResult = {
  operateurs:    Record<string, Generation[]>
  generations:   Generation[]
  antennes:      number
  rayon_km:      number
  disponible:    boolean
  fibre_arcep:   boolean | null   // true si ≥ 50 % des locaux éligibles FTTH
  fibre_taux:    number | null    // % de locaux éligibles FTTH dans la commune
  fibre_commune: string | null    // nom de la commune (source geo.api.gouv.fr)
}

// ── Constantes ANFR ───────────────────────────────────────────────────────────
const ANFR_BASE = 'https://data.anfr.fr/d4c/api/records/1.0/search/'
const DATASET   = 'observatoire_2g_3g_4g'
const RADII_M   = [2000, 5000]
const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']

// ── Constantes ARCEP fibre ────────────────────────────────────────────────────
// commune_techno.csv — séparateur ; — colonnes :
//   code_insee;nom_com;code_dep;code_reg;nbr;type;elig_ftth;elig_coax;...
const GEO_API         = 'https://geo.api.gouv.fr/communes'
const ARCEP_CSV_URL   = 'https://data.arcep.fr/fixe/maconnexioninternet/statistiques/last/commune/commune_techno.csv'
const COL_NBR         = 4   // total locaux
const COL_ELIG_FTTH   = 6   // locaux éligibles FTTH

// ── Normalisation mobile ──────────────────────────────────────────────────────
function normalizeOp(raw: string): string {
  const u = (raw ?? '').toUpperCase()
  if (u.includes('ORANGE'))                       return 'Orange'
  if (u.includes('BOUYGUES'))                     return 'Bouygues'
  if (u.includes('FREE') || u.includes('ILIAD'))  return 'Free'
  if (u.includes('SFR'))                          return 'SFR'
  return raw
}

function normalizeGen(raw: string): Generation | null {
  const u = (raw ?? '').toUpperCase()
  if (u.includes('5G') || u.includes('NR'))   return '5G'
  if (u.includes('4G') || u.includes('LTE'))  return '4G'
  if (u.includes('3G') || u.includes('UMTS')) return '3G'
  if (u.includes('2G') || u.includes('GSM'))  return '2G'
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

// ── Fetch ARCEP fibre (commune_techno.csv) ────────────────────────────────────
async function fetchARCEPFibre(lat: number, lng: number): Promise<{
  fibre:    boolean | null
  taux:     number | null
  commune:  string | null
  insee:    string | null
  csv_url:  string
  error?:   string
}> {
  // 1. Code INSEE de la commune via geo.api.gouv.fr
  let inseeCode: string | null = null
  let communeName: string | null = null
  const geoUrl = `${GEO_API}?lat=${lat}&lon=${lng}&fields=code,nom&format=json`

  try {
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(4_000) })
    if (geoRes.ok) {
      const geoData: any[] = await geoRes.json()
      if (geoData.length > 0) {
        inseeCode   = geoData[0].code  ?? null
        communeName = geoData[0].nom   ?? null
      }
    }
  } catch (e: any) {
    return { fibre: null, taux: null, commune: null, insee: null, csv_url: ARCEP_CSV_URL, error: `geo: ${e?.message}` }
  }

  if (!inseeCode) {
    return { fibre: null, taux: null, commune: communeName, insee: null, csv_url: ARCEP_CSV_URL, error: 'insee introuvable' }
  }

  // 2. Télécharger commune_techno.csv et chercher la ligne de la commune
  //    Le fichier est mis en cache par l'edge CDN (Cache-Control du serveur ARCEP)
  try {
    const csvRes = await fetch(ARCEP_CSV_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JazzImmo/1.0)' },
      signal: AbortSignal.timeout(12_000),
      // Mise en cache Next.js du fichier ARCEP pendant 24 h
      next: { revalidate: 86400 },
    })
    if (!csvRes.ok) {
      return { fibre: null, taux: null, commune: communeName, insee: inseeCode, csv_url: ARCEP_CSV_URL, error: `CSV HTTP ${csvRes.status}` }
    }

    const csvText = await csvRes.text()

    // Recherche efficace sans découper toutes les lignes en tableau
    const searchKey = '\n' + inseeCode + ';'
    const idx = csvText.indexOf(searchKey)
    if (idx === -1) {
      return { fibre: null, taux: null, commune: communeName, insee: inseeCode, csv_url: ARCEP_CSV_URL, error: 'commune absente du CSV' }
    }

    const lineStart = idx + 1
    const lineEnd   = csvText.indexOf('\n', lineStart)
    const line      = lineEnd === -1 ? csvText.slice(lineStart) : csvText.slice(lineStart, lineEnd)
    const cols      = line.split(';')

    const nbr      = parseInt(cols[COL_NBR]      ?? '0', 10)
    const eligFtth = parseInt(cols[COL_ELIG_FTTH] ?? '0', 10)

    if (nbr === 0) {
      return { fibre: null, taux: null, commune: communeName, insee: inseeCode, csv_url: ARCEP_CSV_URL }
    }

    const taux  = Math.round((eligFtth / nbr) * 100)
    const fibre = taux >= 50

    return { fibre, taux, commune: communeName, insee: inseeCode, csv_url: ARCEP_CSV_URL }

  } catch (e: any) {
    return { fibre: null, taux: null, commune: communeName, insee: inseeCode, csv_url: ARCEP_CSV_URL, error: `csv: ${e?.message}` }
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

  // Fibre ARCEP lancé en parallèle dès le début (indépendant du rayon mobile)
  const fibrePromise = fetchARCEPFibre(lat, lng)

  for (const radiusM of RADII_M) {
    try {
      const [{ records, url }, fibreData] = await Promise.all([
        fetchANFR(lat, lng, radiusM),
        fibrePromise,
      ])

      if (debug) {
        return NextResponse.json({
          runtime: 'edge', radiusM, url,
          nhits:  records.length,
          sample: records.slice(0, 2).map((r: any) => r.fields),
          fibre: fibreData,
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
        operateurs:    Object.fromEntries(Object.entries(opMap).map(([op, s]) => [op, sortGens(s)])),
        generations:   sortGens(genSet),
        antennes:      records.length,
        rayon_km:      radiusM / 1000,
        disponible:    true,
        fibre_arcep:   fibreData.fibre,
        fibre_taux:    fibreData.taux,
        fibre_commune: fibreData.commune,
      }

      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
      })

    } catch (err: any) {
      if (debug) return NextResponse.json({ runtime: 'edge', error: String(err), radiusM })
    }
  }

  // Aucune antenne mobile — on retourne quand même la fibre si disponible
  const fibreData = await fibrePromise
  return NextResponse.json(
    {
      operateurs: {}, generations: [], antennes: 0, rayon_km: 5, disponible: false,
      fibre_arcep:   fibreData.fibre,
      fibre_taux:    fibreData.taux,
      fibre_commune: fibreData.commune,
    } satisfies CouvertureResult,
    { headers: { 'Cache-Control': 'public, s-maxage=60' } },
  )
}
