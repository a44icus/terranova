'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'

let mapInstance: MapLibreMap | null = null

export function useMap() {
  const mapRef = useRef<MapLibreMap | null>(null)

  const setMap = useCallback((map: MapLibreMap) => {
    mapRef.current = map
    mapInstance = map
  }, [])

  const getMap = useCallback(() => mapRef.current, [])

  return { setMap, getMap, mapRef }
}

// Accès global à la map (pour les composants sans prop drilling)
export function getGlobalMap(): MapLibreMap | null {
  return mapInstance
}