'use client'

import { useEffect, useState } from 'react'
import type { CouvertureResult, Generation } from '@/app/api/couverture-reseau/route'

interface Props {
  lat: number
  lng: number
}

// ── Couleurs et styles ────────────────────────────────────────────────────────
const GEN_CONFIG: Record<Generation, { label: string; bg: string; text: string; border: string }> = {
  '5G': { label: '5G', bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
  '4G': { label: '4G', bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  '3G': { label: '3G', bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  '2G': { label: '2G', bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
}

const OP_CONFIG: Record<string, { color: string; abbr: string }> = {
  Orange:   { color: '#FF7900', abbr: 'OR' },
  SFR:      { color: '#DC2626', abbr: 'SF' },
  Bouygues: { color: '#0062AF', abbr: 'BY' },
  Free:     { color: '#6D28D9', abbr: 'FR' },
}

const GEN_ORDER: Generation[] = ['5G', '4G', '3G', '2G']

function GenBadge({ gen }: { gen: Generation }) {
  const c = GEN_CONFIG[gen]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.label}
    </span>
  )
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

// ── Composant principal ───────────────────────────────────────────────────────
export default function CouvertureReseau({ lat, lng }: Props) {
  const [data, setData]       = useState<CouvertureResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/couverture-reseau?lat=${lat}&lng=${lng}`, { signal: AbortSignal.timeout(15_000) })
      .then(r => r.json())
      .then((d: CouvertureResult) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lat, lng])

  if (loading) return <Skeleton />
  if (!data)   return null

  const { operateurs, generations, antennes, rayon_km, disponible } = data
  const hasData   = disponible && generations.length > 0
  const opEntries = Object.entries(operateurs)

  // Meilleure génération dispo (pour le résumé)
  const bestGen = GEN_ORDER.find(g => generations.includes(g))

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
            GEN_ORDER.filter(g => generations.includes(g)).map(g => (
              <GenBadge key={g} gen={g} />
            ))
          ) : (
            <span className="text-xs text-navy/35 italic">Aucun signal détecté</span>
          )}
        </div>
      </div>

      {/* Pas de données */}
      {!hasData && (
        <div className="flex items-center gap-2 py-1">
          <span className="text-lg">📵</span>
          <p className="text-xs text-navy/45">
            {!disponible
              ? 'Données ANFR temporairement indisponibles'
              : `Aucune antenne trouvée dans un rayon de ${rayon_km} km`}
          </p>
        </div>
      )}

      {/* Grille opérateurs */}
      {hasData && opEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {['Orange', 'SFR', 'Bouygues', 'Free'].map(op => {
            const cfg  = OP_CONFIG[op] ?? { color: '#94a3b8', abbr: op.slice(0, 2).toUpperCase() }
            const gens = operateurs[op] ?? []
            const best = GEN_ORDER.find(g => gens.includes(g))

            return (
              <div key={op}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-colors ${
                  gens.length > 0
                    ? 'border-navy/08 bg-navy/01'
                    : 'border-dashed border-navy/08 bg-transparent opacity-50'
                }`}>
                {/* Logo opérateur (cercle coloré + initiales) */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: gens.length > 0 ? cfg.color : '#cbd5e1' }}>
                  {cfg.abbr}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-navy/70">{op}</div>
                  {gens.length > 0 ? (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {GEN_ORDER.filter(g => gens.includes(g)).map(g => (
                        <span key={g} className="text-[9px] font-bold px-1 py-0.5 rounded"
                          style={{ background: GEN_CONFIG[g].bg, color: GEN_CONFIG[g].text }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-navy/30 mt-0.5">Non couvert</div>
                  )}
                </div>
                {/* Indicateur meilleure génération */}
                {best && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: GEN_CONFIG[best].text }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[9px] text-navy/25">
          Source ANFR · {antennes} antenne{antennes > 1 ? 's' : ''} dans un rayon de {rayon_km} km
        </p>
        <a
          href={`https://www.monreseaumobile.fr/?lat=${lat}&lng=${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-primary/50 hover:text-primary transition-colors">
          Détails →
        </a>
      </div>
    </div>
  )
}
