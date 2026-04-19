'use client'

import { useCallback, useRef } from 'react'
import { useMapStore } from '@/store/mapStore'

export function useGeolocation() {
  const { setGeoPosition, geoPosition } = useMapStore()
  const watchId = useRef<number | null>(null)

  const start = useCallback((
    onSuccess?: (pos: { lat: number; lng: number; acc: number }) => void,
    onError?: (msg: string) => void,
  ) => {
    if (!navigator.geolocation) {
      onError?.('Géolocalisation non supportée')
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
        setGeoPosition(p)
        onSuccess?.(p)

        // Watch continu
        watchId.current = navigator.geolocation.watchPosition(
          wp => {
            const updated = { lat: wp.coords.latitude, lng: wp.coords.longitude, acc: wp.coords.accuracy }
            setGeoPosition(updated)
          },
          null,
          { enableHighAccuracy: true, maximumAge: 10000 },
        )
      },
      err => {
        const msgs: Record<number, string> = { 1: 'Permission refusée', 2: 'Position introuvable', 3: 'Délai expiré' }
        onError?.(msgs[err.code] || 'Erreur de localisation')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }, [setGeoPosition])

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setGeoPosition(null)
  }, [setGeoPosition])

  return { start, stop, position: geoPosition }
}