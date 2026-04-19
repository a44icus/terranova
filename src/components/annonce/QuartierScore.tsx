'use client'

import { useEffect, useState } from 'react'
import { POI_CATEGORIES, OVERPASS_QUERY, OVERPASS_SERVERS, detectCategory, computeNeighborhoodScore } from '@/lib/poi'

interface Props {
  lat: number
  lng: number
}

type POIResult = { name: string; distance: number; emoji: string }

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const SCORE_COLOR = (s: number) =>
  s >= 8 ? '#16A34A' : s >= 6 ? '#65A30D' : s >= 4 ? '#D97706' : '#DC2626'

const SCORE_LABEL = (s: number) =>
  s >= 8 ? 'Excellent' : s >= 6 ? 'Bon' : s >= 4 ? 'Moyen' : 'Faible'

// Rayons testés successivement (degrés ≈ km / 111)
const SEARCH_RADII = [
  { km: 1, deg: 0.009 },
  { km: 3, deg: 0.027 },
  { km: 5, deg: 0.045 },
]

async function fetchAtRadius(
  lat: number, lng: number, deg: number, maxDistM: number
): Promise<Record<string, POIResult> | null> {
  const bbox = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
  const query = OVERPASS_QUERY(bbox)

  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(9000),
      })
      if (!res.ok) continue

      const data = await res.json()
      const best: Record<string, POIResult> = {}

      for (const el of data.elements ?? []) {
        const cat = detectCategory(el.tags ?? {})
        if (!cat) continue
        const dist = Math.round(haversineM(lat, lng, el.lat, el.lon))
        if (dist > maxDistM) continue
        const name = el.tags?.name || el.tags?.['name:fr'] || ''
        if (!best[cat] || dist < best[cat].distance) {
          best[cat] = {
            name,
            distance: dist,
            emoji: POI_CATEGORIES.find(c => c.key === cat)?.emoji ?? '📍',
          }
        }
      }

      // Retourner si au moins un POI trouvé, sinon null pour essayer le rayon suivant
      return Object.keys(best).length > 0 ? best : null
    } catch {
      continue
    }
  }
  return null
}

export default function QuartierScore({ lat, lng }: Props) {
  const [score, setScore]                 = useState<number | null>(null)
  const [bestByCategory, setBestByCategory] = useState<Record<string, POIResult>>({})
  const [radiusKm, setRadiusKm]           = useState(1)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return }

    async function run() {
      for (const { km, deg } of SEARCH_RADII) {
        const best = await fetchAtRadius(lat, lng, deg, km * 1000)
        if (best) {
          setBestByCategory(best)
          setScore(computeNeighborhoodScore(best))
          setRadiusKm(km)
          setLoading(false)
          return
        }
      }
      // Aucun POI trouvé même à 5 km — score 0 affiché
      setScore(0)
      setRadiusKm(SEARCH_RADII[SEARCH_RADII.length - 1].km)
      setLoading(false)
    }

    run()
  }, [lat, lng])

  if (loading) return (
    <div className="bg-white rounded-2xl p-6 border border-navy/08">
      <div className="h-4 w-40 bg-navy/08 rounded animate-pulse mb-4" />
      <div className="h-24 bg-navy/04 rounded-xl animate-pulse" />
    </div>
  )

  if (score === null) return null

  const isFallback = radiusKm > 1
  const color = SCORE_COLOR(score)
  const label = SCORE_LABEL(score)

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
