'use client'

import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Generation = '2G' | '3G' | '4G' | '5G'

interface CouvertureResult {
  operateurs:  Record<string, Generation[]>
  generations: Generation[]
  antennes:    number
  rayon_km:    number
  disponible:  boolean
}

interface Props { lat: number; lng: number }

// ── Config ────────────────────────────────────────────────────────────────────
// Appel direct navigateur → data.anfr.fr (CORS autorisé sur Opendatasoft)
// Évite les restrictions IP des serveurs Vercel/AWS
const ANFR_BASE = 'https://data.anfr.fr/d4c/api/records/1.0/search/'
const DATASET   = 'observatoire_2g_3g_4g'
const RADII_M   = [2000, 5000]
const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']

const GEN_CONFIG: Record<Generation, { bg: string; text: string; border: string }> = {
  '5G': { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
  '4G': { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  '3G': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  '2G': { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
}

const OP_CONFIG: Record<string, { color: string; abbr: string }> = {
  Orange:   { color: '#FF7900', abbr: 'OR' },
  SFR:      { color: '#DC2626', abbr: 'SF' },
  Bouygues: { color: '#0062AF', abbr: 'BY' },
  Free:     { color: '#6D28D9', abbr: 'FR' },
}

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

// ── Fetch direct ANFR ─────────────────────────────────────────────────────────
async function fetchANFR(lat: number, lng: number, radiusM: number): Promise<CouvertureResult | null> {
  const url = new URL(ANFR_BASE)
  url.searchParams.set('dataset',            DATASET)
  url.searchParams.set('geofilter.distance', `${lat},${lng},${radiusM}`)
  url.searchParams.set('rows',               '200')
  url.searchParams.set('exclude.statut',     'Projet approuvé')

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(12_000),
    headers: { 'Accept': 'application/json' },
  })

  if (!res.ok) throw new Error(`ANFR ${res.status}`)

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

  return {
    operateurs:  Object.fromEntries(Object.entries(opMap).map(([op, s]) => [op, sortGens(s)])),
    generations: sortGens(genSet),
    antennes:    records.length,
    rayon_km:    radiusM / 1000,
    disponible:  true,
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-navy/08">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-3.5 w-36 bg-navy/08 rounded animate-pulse" />
        <div className="ml-auto flex gap-1.5">
          {[1, 2, 3].map(i => <div key={i} className="h-5 w-7 bg-navy/08 rounded animate-pulse" />)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-navy/04 rounded-lg animate-pulse" />)}
      </div>
    </div>
  )
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function CouvertureReseau({ lat, lng }: Props) {
  const [data, setData]       = useState<CouvertureResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      for (const radiusM of RADII_M) {
        try {
          const result = await fetchANFR(lat, lng, radiusM)
          if (cancelled) return
          if (result) {
            setData(result)
            setLoading(false)
            return
          }
        } catch (err: any) {
          if (cancelled) return
          console.warn('[CouvertureReseau] rayon', radiusM, err?.message)
          setError(err?.message ?? 'Erreur')
        }
      }
      // Aucun résultat dans aucun rayon
      if (!cancelled) {
        setData({ operateurs: {}, generations: [], antennes: 0, rayon_km: 5, disponible: false })
        setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [lat, lng])

  if (loading) return <Skeleton />
  if (!data)   return null

  const { operateurs, generations, antennes, rayon_km, disponible } = data
  const hasData   = disponible && generations.length > 0
  const opEntries = Object.entries(operateurs)

  return (
    <div className="bg-white rounded-2xl p-4 border border-navy/08">

      {/* En-tête */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-medium text-navy">Couverture réseau</h2>
        {hasData && rayon_km > 2 && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            📡 {rayon_km} km
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {hasData ? (
            GEN_ORDER.filter(g => generations.includes(g)).map(g => {
              const c = GEN_CONFIG[g]
              return (
                <span key={g} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border"
                  style={{ background: c.bg, color: c.text, borderColor: c.border }}>
                  {g}
                </span>
              )
            })
          ) : (
            <span className="text-xs text-navy/35 italic">Aucun signal</span>
          )}
        </div>
      </div>

      {/* Pas de données */}
      {!hasData && (
        <div className="flex items-center gap-2 py-1">
          <span className="text-lg">📵</span>
          <p className="text-xs text-navy/45">
            {error
              ? `Données indisponibles (${error})`
              : `Aucune antenne trouvée dans un rayon de ${rayon_km} km`}
          </p>
        </div>
      )}

      {/* Grille opérateurs */}
      {hasData && (
        <div className="grid grid-cols-2 gap-1.5">
          {['Orange', 'SFR', 'Bouygues', 'Free'].map(op => {
            const cfg  = OP_CONFIG[op] ?? { color: '#94a3b8', abbr: op.slice(0, 2).toUpperCase() }
            const gens = operateurs[op] ?? []
            const best = GEN_ORDER.find(g => gens.includes(g))

            return (
              <div key={op}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${
                  gens.length > 0 ? 'border-navy/08 bg-navy/01' : 'border-dashed border-navy/08 opacity-40'
                }`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: gens.length > 0 ? cfg.color : '#cbd5e1' }}>
                  {cfg.abbr}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-navy/70">{op}</div>
                  {gens.length > 0 ? (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {GEN_ORDER.filter(g => gens.includes(g)).map(g => {
                        const c = GEN_CONFIG[g]
                        return (
                          <span key={g} className="text-[9px] font-bold px-1 py-0.5 rounded"
                            style={{ background: c.bg, color: c.text }}>
                            {g}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-navy/30 mt-0.5">Non couvert</div>
                  )}
                </div>
                {best && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: GEN_CONFIG[best].text }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[9px] text-navy/25 mt-2">
        Source ANFR · {antennes} antenne{antennes > 1 ? 's' : ''} dans un rayon de {rayon_km} km
      </p>
    </div>
  )
}
