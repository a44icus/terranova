'use client'

import { useEffect, useState } from 'react'
import { POI_CATEGORIES, scoreLabel, DEFAULT_SCORE_SEUILS, type ScoreSeuils } from '@/lib/poi'

interface Props {
  lat: number
  lng: number
  poiWeights?: Record<string, number>
  seuils?: ScoreSeuils
}

type POIResult = { name: string; distance: number; emoji: string }

export default function QuartierScore({ lat, lng, poiWeights, seuils = DEFAULT_SCORE_SEUILS }: Props) {
  const [score, setScore]                   = useState<number | null>(null)
  const [bestByCategory, setBestByCategory] = useState<Record<string, POIResult>>({})
  const [radiusKm, setRadiusKm]             = useState(1)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return }
    let cancelled = false

    async function run() {
      try {
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
        if (poiWeights) params.set('weights', JSON.stringify(poiWeights))
        const res = await fetch(`/api/quartier-score?${params}`, { signal: AbortSignal.timeout(15000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        setBestByCategory(data.best ?? {})
        setScore(typeof data.score === 'number' ? data.score : 0)
        setRadiusKm(data.radiusKm ?? 1)
      } catch {
        if (!cancelled) setScore(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [lat, lng, poiWeights])

  if (loading) return (
    <div className="bg-white rounded-2xl p-6 border border-navy/08">
      <div className="h-4 w-40 bg-navy/08 rounded animate-pulse mb-4" />
      <div className="h-24 bg-navy/04 rounded-xl animate-pulse" />
    </div>
  )

  if (score === null) return null

  const isFallback = radiusKm > 1
  const { color, text: label } = scoreLabel(score, seuils)

  function fmtDist(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-navy/08">

      {/* Titre + badge rayon élargi */}
      <div className="flex items-start justify-between mb-5">
        <h2 className="font-medium text-navy">Score de quartier</h2>
        {isFallback && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            📡 Élargi à {radiusKm} km
          </span>
        )}
      </div>

      {/* Score global */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: `${color}10` }}>
        <div className="text-5xl font-serif" style={{ color }}>{score}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color }}>{label}</div>
          <div className="text-xs text-navy/40 mt-0.5">sur 10 points</div>
          <div className="flex gap-0.5 mt-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i < score ? color : 'rgba(15,23,42,0.1)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Détail par catégorie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {POI_CATEGORIES.map(cat => {
          const poi = bestByCategory[cat.key]
          const distColor = poi
            ? poi.distance < 500 ? '#16A34A' : poi.distance < 1500 ? '#D97706' : '#94A3B8'
            : undefined

          return (
            <div key={cat.key}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                poi ? 'border-navy/08 bg-navy/02' : 'border-dashed border-navy/10 opacity-40'
              }`}>
              <span className="text-xl flex-shrink-0">{cat.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-navy">{cat.label}</div>
                {poi ? (
                  <div className="text-[11px] text-navy/50 truncate">
                    {poi.name || 'À proximité'} ·{' '}
                    <span className="font-medium text-navy/70">{fmtDist(poi.distance)}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-navy/35">Non trouvé</div>
                )}
              </div>
              {poi && (
                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ background: distColor }}>
                  {poi.distance < 500 ? '✓' : fmtDist(poi.distance)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-navy/30 mt-4">
        Basé sur les données OpenStreetMap · rayon {radiusKm} km
        {isFallback && ' · Services des communes voisines inclus'}
      </p>
    </div>
  )
}
