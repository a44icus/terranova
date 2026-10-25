/**
 * lib/poiClient.ts — Récupération des POI depuis le navigateur, via /api/poi.
 *
 * La route serveur interroge Overpass (OpenStreetMap) et met le résultat en
 * cache CDN 24 h. Ici, on ajoute un cache de session pour ne pas redemander
 * les mêmes POI à chaque clic.
 */

import type { POIItem, POIResult } from '@/lib/poiFetch'

export type { POIItem, POIResult }

const CACHE_PREFIX = 'tn_poi:'

function readCache(key: string): POIResult | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as POIResult) : null
  } catch {
    return null
  }
}

function writeCache(key: string, value: POIResult) {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* quota ou mode privé */ }
}

/** Retourne null si le service POI est indisponible. */
export async function fetchPOI(
  lat: number,
  lng: number,
  opts: { signal?: AbortSignal } = {},
): Promise<POIResult | null> {
  const cacheKey = `${CACHE_PREFIX}${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const res = await fetch(`/api/poi?lat=${lat}&lng=${lng}`, { signal: opts.signal })
  if (!res.ok) return null
  const data = await res.json() as POIResult
  writeCache(cacheKey, data)
  return data
}
