'use client'

import { useRef, useCallback } from 'react'

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

export function usePOI(_maxDistM = 1000) {
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

    // Servir depuis le cache session
    if (cache.current[bienId]) return cache.current[bienId]

    try {
      const res = await fetch(
        `/api/poi?lat=${lat}&lng=${lng}`,
        { signal: controller.signal },
      )
      if (!res.ok) return null

      const data: POICache = await res.json()
      cache.current[bienId] = data
      return data
    } catch (e: any) {
      if (e.name === 'AbortError') return null
      return null
    }
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
