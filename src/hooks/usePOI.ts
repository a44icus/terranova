'use client'

import { useRef, useCallback } from 'react'
import { haversineM } from '@/lib/geo'
import {
  detectCategory, poiEmoji, poiSubtype,
  OVERPASS_QUERY, OVERPASS_SERVERS, MAX_POI_DISTANCE,
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
}

export function usePOI() {
  const cache = useRef<Record<string, POICache>>({})
  const abortController = useRef<AbortController | null>(null)

  const loadPOI = useCallback(async (
    bienId: string,
    lat: number,
    lng: number,
  ): Promise<POICache | null> => {
    // Annuler UNIQUEMENT la requête précédente en vol
    abortController.current?.abort()
    const controller = new AbortController()
    abortController.current = controller
    const signal = controller.signal

    // Servir depuis le cache
    if (cache.current[bienId]) return cache.current[bienId]

    const r = 0.005
    const bbox = `${lat - r},${lng - r},${lat + r},${lng + r}`
    const query = OVERPASS_QUERY(bbox)

    let elements: any[] = []
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
        if (data?.elements?.length > 0) {
          elements = data.elements
          break
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return null
        // Essayer le prochain serveur si erreur réseau
        continue
      }
    }

    if (signal.aborted) return null

    const bestByCategory: Record<string, POIItem> = {}
    elements.forEach(el => {
      if (!el.lat || !el.lon) return
      const distance = haversineM(lat, lng, el.lat, el.lon)
      if (distance > MAX_POI_DISTANCE) return
      const tags = el.tags || {}
      const categoryKey = detectCategory(tags)
      if (!categoryKey) return
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
    })

    const pois = Object.values(bestByCategory).sort((a, b) => a.distance - b.distance)
    const result: POICache = { pois, best: bestByCategory }

    if (!signal.aborted) {
      cache.current[bienId] = result
    }

    return result
  }, [])

  const clearCache = useCallback(() => {
    cache.current = {}
  }, [])

  // N'appeler abort QUE pour annuler une requête en vol quand on ferme le panneau
  const abort = useCallback(() => {
    abortController.current?.abort()
    abortController.current = null
  }, [])

  return { loadPOI, clearCache, abort }
}
