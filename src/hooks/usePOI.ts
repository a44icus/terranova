'use client'

import { useRef, useCallback } from 'react'
import { haversineM } from '@/lib/geo'
import {
  detectCategory, poiEmoji, poiSubtype,
  OVERPASS_QUERY, OVERPASS_SERVERS, SEARCH_RADII,
  POI_CATEGORIES,
} from '@/lib/poi'

export interface POIItem {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
  distance: number
  categoryKey: string
  name: string
  emoji: string
  subtype: string | null
}

interface POICache {
  pois: POIItem[]
  best: Record<string, POIItem>
  radiusKm: number
}

async function fetchRadiusRound(
  lat: number, lng: number, deg: number, maxDistM: number,
  signal: AbortSignal,
): Promise<Record<string, POIItem> | null> {
  const bbox = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
  const query = OVERPASS_QUERY(bbox)

  for (const server of OVERPASS_SERVERS) {
    if (signal.aborted) return null
    try {
      const res = await fetch(server, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        signal,
      })
      if (!res.ok) continue
      const data = await res.json()
      if (!data?.elements?.length) continue

      const bestByCategory: Record<string, POIItem> = {}
      for (const el of data.elements) {
        if (!el.lat || !el.lon) continue
        const distance = haversineM(lat, lng, el.lat, el.lon)
        if (distance > maxDistM) continue
        const tags = el.tags || {}
        const categoryKey = detectCategory(tags)
        if (!categoryKey) continue
        if (!bestByCategory[categoryKey] || distance < bestByCategory[categoryKey].distance) {
          const cat = POI_CATEGORIES.find(c => c.key === categoryKey)
          bestByCategory[categoryKey] = {
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            tags,
            distance,
            categoryKey,
            name: tags.name || cat?.label || categoryKey,
            emoji: poiEmoji(tags),
            subtype: poiSubtype(tags),
          }
        }
      }

      return Object.keys(bestByCategory).length > 0 ? bestByCategory : null
    } catch (e: any) {
      if (e.name === 'AbortError') return null
      continue
    }
  }
  return null
}

export function usePOI(maxDistM = 1000) {
  const cache = useRef<Record<string, POICache>>({})
  const abortController = useRef<AbortController | null>(null)

  const loadPOI = useCallback(async (
    bienId: string,
    lat: number,
    lng: number,
  ): Promise<POICache | null> => {
    // Annuler la requête précédente en vol
    abortController.current?.abort()
    const controller = new AbortController()
    abortController.current = controller
    const signal = controller.signal

    // Servir depuis le cache
    if (cache.current[bienId]) return cache.current[bienId]

    // Même logique de rayons progressifs que QuartierScore
    for (const { km, deg } of SEARCH_RADII) {
      if (signal.aborted) return null
      const best = await fetchRadiusRound(lat, lng, deg, km * 1000, signal)
      if (signal.aborted) return null
      if (best) {
        const pois = Object.values(best).sort((a, b) => a.distance - b.distance)
        const result: POICache = { pois, best, radiusKm: km }
        cache.current[bienId] = result
        return result
      }
    }

    // Aucun POI trouvé même à 5 km
    const empty: POICache = { pois: [], best: {}, radiusKm: SEARCH_RADII[SEARCH_RADII.length - 1].km }
    cache.current[bienId] = empty
    return empty
  }, [])

  const clearCache = useCallback(() => {
    cache.current = {}
  }, [])

  const abort = useCallback(() => {
    abortController.current?.abort()
    abortController.current = null
  }, [])

  return { loadPOI, clearCache, abort }
}
