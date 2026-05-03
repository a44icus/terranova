'use client'

import { useEffect, useState } from 'react'
import { POI_CATEGORIES, scoreLabel, DEFAULT_SCORE_SEUILS, type ScoreSeuils } from '@/lib/poi'

interface Props {
  lat: number
  lng: number
  storedScore?: number | null
  poiWeights?: Record<string, number>
  seuils?: ScoreSeuils
}

type POIResult = { name: string; distance: number; emoji: string }

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export default function QuartierScore({ lat, lng, storedScore, poiWeights, seuils = DEFAULT_SCORE_SEUILS }: Props) {
  const hasStoredScore = typeof storedScore === 'number'
  const [score, setScore]         = useState<number | null>(hasStoredScore ? storedScore : null)
  const [best, setBest]           = useState<Record<string, POIResult>>({})
  const [radiusKm, setRadiusKm]   = useState(1)
  const [loading, setLoading]     = useState(!hasStoredScore)

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return }
    let cancelled = false
    async function run() {
      try {
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
        if (poiWeights) params.set('weights', JSON.stringify(poiWeights))
        const res = await fetch(`/api/quartier-score?${params}`, { signal: AbortSignal.timeout(15000) })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (cancelled) return
        setBest(data.best ?? {})
        setRadiusKm(data.radiusKm ?? 1)
        if (!hasStoredScore) setScore(typeof data.score === 'number' ? data.score : 0)
      } catch {
        if (!cancelled && !hasStoredScore) setScore(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [lat, lng, poiWeights])

  if (loading) return (
    <div className="bg-white rounded-2xl p-4 border border-navy/08">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-3.5 w-28 bg-navy/08 rounded animate-pulse" />
        <div className="ml-auto h-6 w-10 bg-navy/08 rounded-lg animate-pulse" />
      </div>
      <div className="h-1.5 w-full bg-navy/06 rounded-full animate-pulse mb-3" />
      <div className="grid grid-cols-2 gap-1.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-7 bg-navy/04 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )

  if (score === null) return null

  const { color, text: label } = scoreLabel(score, seuils)
  const hasPOI = Object.keys(best).length > 0

  return (
    <div className="bg-white rounded-2xl p-4 border border-navy/08">

      {/* En-tête compact */}
      <div className="flex items-center gap-3 mb-2.5">
        <h2 className="text-sm font-medium text-navy">Score de quartier</h2>
        {radiusKm > 1 && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            📡 {radiusKm} km
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium text-navy/40">{label}</span>
          <span className="text-lg font-serif font-bold leading-none" style={{ color }}>{score}</span>
          <span className="text-[10px] text-navy/30">/10</span>
        </div>
      </div>

      {/* Barre de score */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full"
            style={{ background: i < score ? color : 'rgba(15,23,42,0.08)' }} />
        ))}
      </div>

      {/* Grille POI compacte */}
      {hasPOI && (
        <div className="grid grid-cols-2 gap-1">
          {POI_CATEGORIES.map(cat => {
            const poi = best[cat.key]
            if (!poi) return null
            const near = poi.distance < 500
            return (
              <div key={cat.key} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-navy/02 border border-navy/06">
                <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-medium text-navy/70 truncate">{poi.name || cat.label}</div>
                </div>
                <span className={`text-[9px] font-bold flex-shrink-0 ${near ? 'text-green-600' : 'text-navy/35'}`}>
                  {fmtDist(poi.distance)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!hasPOI && loading === false && (
        <p className="text-[11px] text-navy/30">Données POI en cours de chargement…</p>
      )}

      <p className="text-[9px] text-navy/25 mt-2">
        OpenStreetMap · {radiusKm} km{radiusKm > 1 ? ' · communes voisines incluses' : ''}
      </p>
    </div>
  )
}
