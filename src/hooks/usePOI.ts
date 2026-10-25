'use client'

import { useRef, useCallback } from 'react'
import { fetchPOI, type POIItem, type POIResult } from '@/lib/poiClient'

export type { POIItem }

export function usePOI(_maxDistM = 1000) {
  const cache = useRef<Record<string, POIResult>>({})
  const abortController = useRef<AbortController | null>(null)

  const loadPOI = useCallback(async (
    bienId: string,
    _lat?: number,
    _lng?: number,
  ): Promise<POIResult | null> => {
    // Annuler la requête précédente en vol
    abortController.current?.abort()
    const controller = new AbortController()
    abortController.current = controller

    // Servir depuis le cache mémoire
    if (cache.current[bienId]) return cache.current[bienId]

    try {
      // POI stockés pour ce bien (voir lib/poisBien.ts)
      const data = await fetchPOI(bienId, { signal: controller.signal })
      if (data) cache.current[bienId] = data
      return data
    } catch {
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
