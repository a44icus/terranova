import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface EstimationRequest {
  ville: string
  codeInsee?: string
  surface: number
  pieces: number
  categorie: string
  type: 'vente' | 'location'
  etat: 'neuf' | 'bon' | 'travaux'
  etage?: number
  nb_etages?: number
  annee_construction?: number
  dpe?: string
  options?: string[]
  meuble?: boolean
  surface_terrain?: number
}

const DVF_INDIC_FIELD: Record<string, string> = {
  appartement: 'pxm2_median_cod121',
  maison:      'pxm2_median_cod111',
  local:       'pxm2_median_cod14',
  bureau:      'pxm2_median_cod14',
  terrain:     'pxm2_median_cod2',
}

const DVF_LIBTYPBIEN: Record<string, string> = {
  appartement: 'Appartement',
  maison:      'Maison',
  local:       'Local industriel. commercial ou assimilé',
}

const CEREMA_BASE = 'https://apidf-preprod.cerema.fr'
const DVF_EXCLUDED_DEPTS = ['57', '67', '68', '976']

function getLocatifRatio(codeDept: string): number {
  if (codeDept === '75') return 0.032
  if (['92', '93', '94'].includes(codeDept)) return 0.038
  const bigMetros = ['69', '33', '44', '31', '13', '06', '34', '59', '38']
  if (bigMetros.includes(codeDept)) return 0.043
  return 0.052
}

async function resolveCommune(
  ville: string,
  codeInsee?: string
): Promise<{ codeCommune: string; codeDept: string } | null> {
  if (codeInsee && /^\d{5}$|^[0-9][AB]\d{3}$/.test(codeInsee)) {
    const codeDept = codeInsee.startsWith('97')
      ? codeInsee.slice(0, 3)
      : codeInsee.slice(0, 2)
    return { codeCommune: codeInsee, codeDept }
  }
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ville)}&fields=code,codeDepartement&boost=population&limit=1`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return { codeCommune: data[0].code, codeDept: data[0].codeDepartement }
  } catch {
    return null
  }
}

async function getDVFPrice(
  ville: string,
  categorie: string,
  codeInsee?: string
): Promise<{ pricePerM2: number; nbMutations: number } | null> {
  if (categorie === 'parking') return null
  try {
    const commune = await resolveCommune(ville, codeInsee)
    if (!commune) return null
    if (DVF_EXCLUDED_DEPTS.includes(commune.codeDept)) return null

    const libtypbien = DVF_LIBTYPBIEN[categorie]
    const params = new URLSearchParams({ code_commune: commune.codeCommune, page_size: '500' })
    if (libtypbien) params.set('libtypbien', libtypbien)

    const res = await fetch(
      `${CEREMA_BASE}/dvf_opendata/mutations/?${params}`,
      { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Terranova/1.0' } }
    )
    if (!res.ok) return null

    const data = await res.json()
    const mutations: Array<{
      valeurfonc: number
      sbati: number | null
      sterr: number | null
      datemut?: string
    }> = data.results ?? []
    if (mutations.length < 3) return null

    const isTerrain = categorie === 'terrain'
    const now = new Date()

    const prices = mutations
      .map(m => {
        const surface = isTerrain ? (m.sterr ?? 0) : (m.sbati ?? 0)
        if (!surface || surface < 5 || !m.valeurfonc || m.valeurfonc < 1000) return null
        const moisAncien = m.datemut
          ? (now.getTime() - new Date(m.datemut).getTime()) / (1000 * 60 * 60 * 24 * 30)
          : 24
        const weight = Math.exp(-moisAncien / 18)
        return { ppm2: m.valeurfonc / surface, weight }
      })
      .filter((p): p is { ppm2: number; weight: number } => p !== null)

    if (prices.length < 3) return null

    const sorted = [...prices].sort((a, b) => a.ppm2 - b.ppm2)
    const start   = Math.floor(sorted.length * 0.1)
    const end     = Math.ceil(sorted.length * 0.9)
    const trimmed = sorted.slice(start, end)

    const totalWeight = trimmed.reduce((s, p) => s + p.weight, 0)
    const weightedSum = trimmed.reduce((s, p) => s + p.ppm2 * p.weight, 0)
    const median = Math.round(weightedSum / totalWeight)

    return { pricePerM2: median, nbMutations: trimmed.length }
  } catch {
    return null
  }
}

async function getVillePriceRef(
  ville: string,
  categorie: string,
  type: 'vente' | 'location',
  codeInsee?: string
): Promise<{ pricePerM2: number; source: string; codeDept?: string }> {
  const indicField = DVF_INDIC_FIELD[categorie]

  if (categorie === 'parking') {
    return { pricePerM2: type === 'location' ? 120 : 18000, source: 'forfait-parking' }
  }

  if (indicField) {
    try {
      const commune = await resolveCommune(ville, codeInsee)
      if (commune && !DVF_EXCLUDED_DEPTS.includes(commune.codeDept)) {
        const res = await fetch(
          `${CEREMA_BASE}/indicateurs_dv3f/communes/?code_commune=${commune.codeCommune}`,
          { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Terranova/1.0' } }
        )
        if (res.ok) {
          const data = await res.json()
          const results: any[] = data.results ?? data
          if (results.length > 0) {
            const sorted = results.sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0))
            const px = sorted[0][indicField]
            if (px && px > 0) {
              const ratio = getLocatifRatio(commune.codeDept)
              const pricePerM2 = type === 'location'
                ? Math.round((px * ratio) / 12)
                : Math.round(px)
              return { pricePerM2, source: `dv3f-commune-${commune.codeCommune}`, codeDept: commune.codeDept }
            }
          }
        }
      }
    } catch { /* next */ }

    try {
      const commune = await resolveCommune(ville, codeInsee)
      if (commune && !DVF_EXCLUDED_DEPTS.includes(commune.codeDept)) {
        const res = await fetch(
          `${CEREMA_BASE}/indicateurs_dv3f/departements/?code_departement=${commune.codeDept}`,
          { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Terranova/1.0' } }
        )
        if (res.ok) {
          const data = await res.json()
          const results: any[] = data.results ?? data
          if (results.length > 0) {
            const sorted = results.sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0))
            const px = sorted[0][indicField]
            if (px && px > 0) {
              const ratio = getLocatifRatio(commune.codeDept)
              const pricePerM2 = type === 'location'
                ? Math.round((px * ratio) / 12)
                : Math.round(px)
              return { pricePerM2, source: `dv3f-dept-${commune.codeDept}`, codeDept: commune.codeDept }
            }
          }
        }
      }
    } catch { /* next */ }

    try {
      const res = await fetch(
        `${CEREMA_BASE}/indicateurs_dv3f/france/`,
        { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Terranova/1.0' } }
      )
      if (res.ok) {
        const data = await res.json()
        const results: any[] = data.results ?? data
        if (results.length > 0) {
          const sorted = results.sort((a, b) => (b.annee ?? 0) - (a.annee ?? 0))
          const px = sorted[0][indicField]
          if (px && px > 0) {
            const pricePerM2 = type === 'location'
              ? Math.round((px * 0.042) / 12)
              : Math.round(px)
            return { pricePerM2, source: 'dv3f-national' }
          }
        }
      }
    } catch { /* last resort */ }
  }

  // ── Fallback par département ───────────────────────────────────────────────
  // Médianes €/m² maison (vente) par département — baromètres LPI-SeLoger /
  // MeilleursAgents / DVF nationaux (T4 2024). Bien plus précis qu'une valeur
  // nationale uniforme qui sur-estime fortement les zones rurales.
  const commune = await resolveCommune(ville, codeInsee)
  const dept = commune?.codeDept ?? '00'

  const MAISON_DEPT: Record<string, number> = {
    '01':1950,'02':1400,'03':1200,'04':2200,'05':2400,'06':4800,'07':1800,
    '08':1150,'09':1400,'10':1450,'11':1700,'12':1350,'13':3200,'14':2400,
    '15':1100,'16':1350,'17':2200,'18':1200,'19':1400,'21':2000,'22':1800,
    '23':950, '24':1450,'25':2100,'26':2000,'27':1900,'28':1800,'29':1900,
    '2A':2600,'2B':2800,'30':2200,'31':2800,'32':1400,'33':3300,'34':2900,
    '35':2600,'36':1100,'37':1900,'38':2500,'39':1600,'40':2800,'41':1600,
    '42':1700,'43':1200,'44':2700,'45':1800,'46':1400,'47':1500,'48':1200,
    '49':2000,'50':1900,'51':1400,'52':1050,'53':1450,'54':1700,'55':1100,
    '56':2400,'57':1700,'58':1100,'59':2000,'60':2200,'61':1400,'62':1700,
    '63':1600,'64':2500,'65':1400,'66':2200,'67':2500,'68':2300,'69':3200,
    '70':1150,'71':1550,'72':1750,'73':2800,'74':4200,'75':10000,'76':2100,
    '77':2800,'78':3800,'79':1350,'80':1700,'81':1600,'82':1350,'83':3500,
    '84':2600,'85':2300,'86':1450,'87':1450,'88':1200,'89':1300,'90':1700,
    '91':2800,'92':6200,'93':3500,'94':4500,'95':3000,
    '971':2000,'972':2100,'973':1500,'974':2500,'976':1200,
  }

  const maisonPx = MAISON_DEPT[dept] ?? 1800  // 1800 = médiane nationale hors Paris
  // Ratios par catégorie (appt légèrement < maison en province, > en grande ville)
  const isMetro = ['75','92','93','94','69','13','33','06','31','34','44','67','59'].includes(dept)
  const RATIOS: Record<string, number> = {
    appartement: isMetro ? 1.05 : 0.92,
    maison:      1.0,
    bureau:      0.80,
    local:       0.65,
    terrain:     0.045,
  }
  const basePx = Math.round(maisonPx * (RATIOS[categorie] ?? 1.0))

  const LOCATION_RATIO: Record<string, number> = {
    '75':0.032,'92':0.038,'93':0.040,'94':0.038,
    '69':0.043,'13':0.044,'33':0.044,'06':0.040,
  }
  const locRatio = LOCATION_RATIO[dept] ?? 0.050

  const px = type === 'location'
    ? Math.round(basePx * locRatio / 12)
    : basePx

  return { pricePerM2: px, source: `fallback-dept-${dept}`, codeDept: dept }
}

function surfaceAdjustment(surface: number, categorie: string): number {
  if (['terrain', 'parking', 'bureau', 'local'].includes(categorie)) return 1.0
  if (categorie === 'appartement') {
    if (surface < 20) return 1.18
    if (surface < 30) return 1.10
    if (surface < 40) return 1.05
    if (surface > 120) return 0.96
    if (surface > 200) return 0.92
  }
  if (categorie === 'maison') {
    if (surface < 60) return 1.05
    if (surface > 200) return 0.95
    if (surface > 300) return 0.90
  }
  return 1.0
}

function computeQualityMultiplier(req: EstimationRequest, codeDept?: string): {
  multiplier: number
  details: Record<string, number>
} {
  const details: Record<string, number> = {}
  let multiplier = 1.0

  // État
  const etatM: Record<string, number> = { neuf: 1.12, bon: 1.0, travaux: 0.82 }
  const etatV = etatM[req.etat] ?? 1.0
  details.etat = etatV
  multiplier *= etatV

  // Pièces (±2,5% par pièce, plafonné ±18%)
  if (req.pieces > 0 && !['terrain', 'parking', 'bureau', 'local'].includes(req.categorie)) {
    const piecesRef = req.categorie === 'appartement' ? 2.5 : 4
    const delta = (req.pieces - piecesRef) * 0.025
    const adj = 1 + Math.max(-0.18, Math.min(0.18, delta))
    details.pieces = adj
    multiplier *= adj
  }

  // Étage (appartement)
  if (req.categorie === 'appartement' && req.etage !== undefined) {
    const nbEtages = req.nb_etages ?? 5
    let etageAdj = 1.0
    if (req.etage === 0)              etageAdj = 0.95
    else if (req.etage === nbEtages)  etageAdj = 1.06
    else if (req.etage >= nbEtages - 1) etageAdj = 1.04
    else if (req.etage >= 2)          etageAdj = 1.01
    details.etage = etageAdj
    multiplier *= etageAdj
  }

  // Année de construction
  if (req.annee_construction) {
    const age = new Date().getFullYear() - req.annee_construction
    let ancienAdj = 1.0
    if (age < 5)        ancienAdj = 1.05
    else if (age < 15)  ancienAdj = 1.02
    else if (age > 40 && age < 70) ancienAdj = 0.97
    else if (age >= 70) ancienAdj = req.etat === 'travaux' ? 0.90 : 0.98
    details.anciennete = ancienAdj
    multiplier *= ancienAdj
  }

  // DPE
  if (req.dpe) {
    const dpeAdj: Record<string, number> = { A: 1.06, B: 1.03, C: 1.01, D: 1.0, E: 0.97, F: 0.93, G: 0.89 }
    const adj = dpeAdj[req.dpe] ?? 1.0
    details.dpe = adj
    multiplier *= adj
  }

  // Options
  if (req.options && req.options.length > 0) {
    const optionBonuses: Record<string, number> = {
      parking: 0.04, cave: 0.015, balcon: 0.025, terrasse: 0.04,
      jardin: 0.05, piscine: 0.06, ascenseur: 0.02, gardien: 0.015,
      digicode: 0.005, interphone: 0.005,
    }
    let optAdj = 1.0
    for (const opt of req.options) {
      optAdj += (optionBonuses[opt.toLowerCase()] ?? 0)
    }
    details.options = Math.min(optAdj, 1.20)
    multiplier *= Math.min(optAdj, 1.20)
  }

  // Meublé (location)
  if (req.type === 'location' && req.meuble) {
    details.meuble = 1.12
    multiplier *= 1.12
  }

  // Terrain attenant (maison)
  if (req.categorie === 'maison' && req.surface_terrain && req.surface_terrain > 0) {
    const terrainBonus = Math.min(0.08, (req.surface_terrain / 100) * 0.01)
    details.terrain_attenant = 1 + terrainBonus
    multiplier *= (1 + terrainBonus)
  }

  return { multiplier, details }
}

function computeMargin(
  confidence: 'high' | 'medium' | 'low',
  dataSource: string,
  codeDept?: string
): number {
  const liquidDepts = ['75', '92', '93', '94', '69', '13', '33', '44']
  const isLiquid = codeDept ? liquidDepts.includes(codeDept) : false
  const baseMargin = confidence === 'high' ? 0.05 : confidence === 'medium' ? 0.09 : 0.14
  const liquidAdj  = isLiquid ? -0.015 : 0
  const fallbackAdj = dataSource.startsWith('fallback-dept') ? 0.01 : dataSource === 'last-resort' ? 0.02 : 0
  return baseMargin + liquidAdj + fallbackAdj
}

const VALID_TYPES      = ['vente', 'location'] as const
const VALID_CATEGORIES = ['appartement', 'maison', 'bureau', 'terrain', 'parking', 'local'] as const
const VALID_ETATS      = ['neuf', 'bon', 'travaux'] as const

export async function POST(req: NextRequest) {
  try {
    const body: EstimationRequest = await req.json()
    const { ville, codeInsee, surface, pieces, categorie, type, etat } = body

    if (!ville || typeof ville !== 'string' || ville.trim().length < 2 || ville.length > 100)
      return NextResponse.json({ error: 'Ville invalide' }, { status: 400 })
    if (!surface || typeof surface !== 'number' || surface <= 0 || surface > 100_000)
      return NextResponse.json({ error: 'Surface invalide' }, { status: 400 })
    if (pieces !== undefined && (typeof pieces !== 'number' || pieces < 0 || pieces > 100))
      return NextResponse.json({ error: 'Nombre de pièces invalide' }, { status: 400 })
    if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number]))
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    if (!VALID_CATEGORIES.includes(categorie as typeof VALID_CATEGORIES[number]))
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
    if (etat && !VALID_ETATS.includes(etat as typeof VALID_ETATS[number]))
      return NextResponse.json({ error: 'État invalide' }, { status: 400 })

    const supabase = await createClient()

    // ─── 1. Comparables Terranova ─────────────────────────────────────────
    const { data: comparablesVille } = await supabase
      .from('biens_publics')
      .select('prix, surface, categorie, type, ville')
      .ilike('ville', `%${ville}%`)
      .eq('type', type)
      .not('surface', 'is', null)
      .gt('surface', 0)
      .limit(80)

    let priceFromDB: number | null = null
    let nbComparables = 0

    if (comparablesVille && comparablesVille.length > 0) {
      let filtered = comparablesVille
      const catFiltered = comparablesVille.filter(b => b.categorie === categorie)
      if (catFiltered.length >= 3) filtered = catFiltered

      const prices = filtered
        .filter(b => b.surface && b.prix && b.surface > 5)
        .map(b => b.prix / b.surface!)
        .sort((a, b) => a - b)

      if (prices.length >= 2) {
        const start   = Math.floor(prices.length * 0.1)
        const end     = Math.ceil(prices.length * 0.9)
        const trimmed = prices.slice(start, end)
        priceFromDB   = trimmed.reduce((s, p) => s + p, 0) / trimmed.length
        nbComparables = filtered.length
      }
    }

    // ─── 2. DVF + référence ───────────────────────────────────────────────
    const [dvfResult, refResult] = await Promise.all([
      type === 'vente' ? getDVFPrice(ville, categorie, codeInsee) : Promise.resolve(null),
      getVillePriceRef(ville, categorie, type, codeInsee),
    ])

    const { pricePerM2: refPrice, source: refSource, codeDept } = refResult

    // ─── 3. Fusion ────────────────────────────────────────────────────────
    let pricePerM2: number
    let dataSource: string

    if (priceFromDB !== null && nbComparables >= 10) {
      pricePerM2 = priceFromDB
      dataSource = 'terranova'
    } else if (priceFromDB !== null && nbComparables >= 3 && dvfResult) {
      pricePerM2 = priceFromDB * 0.35 + dvfResult.pricePerM2 * 0.45 + refPrice * 0.20
      dataSource = 'blend-dvf'
    } else if (priceFromDB !== null && nbComparables >= 3) {
      pricePerM2 = priceFromDB * 0.40 + refPrice * 0.60
      dataSource = 'blend'
    } else if (dvfResult) {
      pricePerM2    = dvfResult.pricePerM2 * 0.70 + refPrice * 0.30
      dataSource    = 'dvf'
      nbComparables = dvfResult.nbMutations
    } else {
      pricePerM2 = refPrice
      dataSource = refSource
    }

    // ─── 4. Ajustement taille ─────────────────────────────────────────────
    pricePerM2 *= surfaceAdjustment(surface, categorie)

    // ─── 5. Prix de base ──────────────────────────────────────────────────
    let basePrice: number
    if (categorie === 'parking') {
      const { pricePerM2: parkRef } = await getVillePriceRef(ville, 'parking', type, codeInsee)
      basePrice = parkRef
    } else {
      basePrice = pricePerM2 * surface
    }

    // ─── 6. Qualité ───────────────────────────────────────────────────────
    const { multiplier, details: qualityDetails } = computeQualityMultiplier(body, codeDept)
    basePrice *= multiplier

    // ─── 7. Fourchette ────────────────────────────────────────────────────
    const confidence: 'high' | 'medium' | 'low' =
      nbComparables >= 10 ? 'high' :
      (nbComparables >= 3 || dataSource === 'dvf' || dataSource === 'blend-dvf') ? 'medium' : 'low'

    const margin = computeMargin(confidence, dataSource, codeDept)

    const low      = Math.round(basePrice * (1 - margin) / 1000) * 1000
    const high     = Math.round(basePrice * (1 + margin) / 1000) * 1000
    const estimate = Math.round(basePrice / 1000) * 1000

    return NextResponse.json({
      estimate,
      low,
      high,
      pricePerM2: Math.round(pricePerM2),
      nbComparables,
      confidence,
      dataSource,
      ville,
      surface,
      type,
      qualityDetails,
      marginPercent: Math.round(margin * 100),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
