'use client'

import { useState, useCallback, useRef } from 'react'

export type RouteMode = 'foot' | 'bike' | 'car'

const OSRM_URLS: Record<RouteMode, string> = {
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
  car:  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
}

export interface RouteResult {
  distance: string
  duration: string
  geometry: GeoJSON.LineString
}

export function useRoute() {
  const [mode, setMode] = useState<RouteMode>('foot')
  const [result, setResult] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const origin = useRef<{ lng: number; lat: number } | null>(null)

  const setOrigin = useCallback((lng: number, lat: number) => {
    origin.current = { lng, lat }
  }, [])

  const calculate = useCallback(async (destLng: number, destLat: number) => {
    if (!origin.current) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { lng, lat } = origin.current
      const url = `${OSRM_URLS[mode]}/${lng},${lat};${destLng},${destLat}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()

      if (!data.routes?.[0]) {
        setError('Itinéraire introuvable')
        return
      }

      const route = data.routes[0]
      const dist = route.distance as number
      const dur  = route.duration as number

      setResult({
        distance: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`,
        duration: dur >= 3600
          ? `${Math.floor(dur / 3600)}h${Math.floor((dur % 3600) / 60)}min`
          : `${Math.round(dur / 60)} min`,
        geometry: route.geometry,
      })
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [mode])

  const reset = useCallback(() => {
    setResult(null)
    setError('')
    origin.current = null
  }, [])

  return { mode, setMode, result, loading, error, setOrigin, calculate, reset }
}