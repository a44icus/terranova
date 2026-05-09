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
  fibre_arcep: boolean | null   // données ARCEP directes
}

interface Props { lat: number; lng: number; fibre?: boolean | null }

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
export default function CouvertureReseau({ lat, lng, fibre }: Props) {
  const [data, setData]       = useState<CouvertureResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/couverture-reseau?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then((d: CouvertureResult) => {
        if (!cancelled) { setData(d); setLoading(false) }
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.warn('[CouvertureReseau]', err?.message)
          setError(err?.message ?? 'Erreur')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [lat, lng])

  if (loading) return <Skeleton />
  if (!data)   return null

  const { operateurs, generations, antennes, rayon_km, disponible, fibre_arcep } = data
  // fibre_arcep (ARCEP) en priorité, sinon prop DB, sinon null
  const fibreDisplay = fibre_arcep !== undefined ? fibre_arcep : (fibre ?? null)
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

      {/* Fibre optique — données ARCEP */}
      <div className={`flex items-center gap-2 mt-2.5 px-3 py-2 rounded-xl border ${
        fibreDisplay === true
          ? 'bg-emerald-50 border-emerald-200'
          : fibreDisplay === false
            ? 'bg-navy/02 border-dashed border-navy/10'
            : 'bg-navy/02 border-dashed border-navy/08'
      }`}>
        <span className="text-sm flex-shrink-0">{fibreDisplay === true ? '🌐' : '🔌'}</span>
        <div className="flex-1 min-w-0">
          <span className={`text-[11px] font-semibold ${fibreDisplay === true ? 'text-emerald-700' : 'text-navy/45'}`}>
            Fibre optique
          </span>
          <span className={`text-[10px] ml-1.5 ${fibreDisplay === true ? 'text-emerald-600' : 'text-navy/35'}`}>
            {fibreDisplay === true
              ? 'Zone raccordable FTTH'
              : fibreDisplay === false
                ? 'Non déployée dans ce secteur'
                : 'Données ARCEP indisponibles'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            fibreDisplay === true ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/06 text-navy/35'
          }`}>
            {fibreDisplay === true ? '✓ Oui' : fibreDisplay === false ? '✗ Non' : '—'}
          </span>
          {fibre_arcep !== null && (
            <span className="text-[8px] text-navy/20 uppercase tracking-wider">ARCEP</span>
          )}
        </div>
      </div>

      <p className="text-[9px] text-navy/25 mt-2">
        Réseau mobile : ANFR · {antennes} antenne{antennes > 1 ? 's' : ''} dans un rayon de {rayon_km} km
        {fibre_arcep !== null && ' · Fibre : ARCEP open data'}
      </p>
    </div>
  )
}
