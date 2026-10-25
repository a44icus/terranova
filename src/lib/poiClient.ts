/**
 * lib/poiClient.ts — POI d'un bien, depuis le navigateur, via /api/poi.
 *
 * Les POI sont stockés par bien côté serveur (voir lib/poisBien.ts).
 * Un cache de session évite de les redemander à chaque clic.
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

/** Retourne null si les POI du bien ne sont pas (encore) disponibles. */
export async function fetchPOI(
  bienId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<POIResult | null> {
  const cacheKey = `${CACHE_PREFIX}${bienId}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  const res = await fetch(`/api/poi?id=${encodeURIComponent(bienId)}`, { signal: opts.signal })
  if (!res.ok) return null
  const data = await res.json() as POIResult
  writeCache(cacheKey, data)
  return data
}
