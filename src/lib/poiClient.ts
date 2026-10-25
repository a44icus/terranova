/**
 * lib/poiClient.ts — Récupération des POI depuis le NAVIGATEUR du visiteur.
 *
 * Pourquoi côté navigateur ? Les serveurs publics Overpass refusent les appels
 * automatisés venant des IP partagées des hébergeurs (Vercel/AWS) : ils
 * répondent « at capacity » ou laissent la requête expirer. Leur service public
 * est prévu pour des outils utilisés dans un navigateur : chaque visiteur
 * interroge Overpass avec sa propre IP.
 *
 * Les résultats sont mis en cache dans sessionStorage pour la durée de la visite.
 */

import {
  POI_CATEGORIES,
  OVERPASS_QUERY,
  OVERPASS_SERVERS,
  SEARCH_RADII,
  detectCategory,
  poiEmoji,
  poiSubtype,
  computeNeighborhoodScore,
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

export interface POIResult {
  pois: POIItem[]
  best: Record<string, POIItem>
  radiusKm: number
  score: number
}

interface OverpassElement {
  id: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
}

const CACHE_PREFIX = 'tn_poi:'
const TIMEOUT_MS   = 8000

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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

/**
 * Envoie la requête au premier serveur Overpass qui répond.
 * Retourne null si tous les serveurs sont indisponibles.
 * Le Content-Type form-urlencoded évite la requête CORS préalable (preflight).
 */
async function queryOverpass(query: string, signal?: AbortSignal): Promise<OverpassElement[] | null> {
  for (const server of OVERPASS_SERVERS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const timeout = AbortSignal.timeout(TIMEOUT_MS)
    try {
      const res = await fetch(server, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    `data=${encodeURIComponent(query)}`,
        signal:  signal ? AbortSignal.any([signal, timeout]) : timeout,
      })
      if (!res.ok) continue
      const data = await res.json() as { elements?: OverpassElement[] }
      return Array.isArray(data.elements) ? data.elements : []
    } catch (e) {
      if (signal?.aborted) throw e
      continue
    }
  }
  return null
}

/** Garde le POI le plus proche par catégorie, dans la distance maximale. */
function bestByCategory(elements: OverpassElement[], lat: number, lng: number, maxDistM: number) {
  const best: Record<string, POIItem> = {}
  for (const el of elements) {
    if (!el.lat || !el.lon) continue
    const distance = Math.round(haversineM(lat, lng, el.lat, el.lon))
    if (distance > maxDistM) continue
    const tags: Record<string, string> = el.tags ?? {}
    const categoryKey = detectCategory(tags)
    if (!categoryKey) continue
    if (best[categoryKey] && best[categoryKey].distance <= distance) continue
    const cat = POI_CATEGORIES.find(c => c.key === categoryKey)
    best[categoryKey] = {
      id: el.id,
      lat: el.lat,
      lon: el.lon,
      tags,
      distance,
      categoryKey,
      name: tags.name || tags['name:fr'] || cat?.label || categoryKey,
      emoji: poiEmoji(tags),
      subtype: poiSubtype(tags),
    }
  }
  return best
}

/**
 * Récupère les POI autour d'un point, en élargissant le rayon (1, 3 puis 5 km)
 * tant que rien n'est trouvé. Retourne null si Overpass est injoignable,
 * pour ne jamais confondre une panne avec un quartier sans commerces.
 */
export async function fetchPOI(
  lat: number,
  lng: number,
  opts: { signal?: AbortSignal } = {},
): Promise<POIResult | null> {
  const cacheKey = `${CACHE_PREFIX}${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  for (const { km, deg } of SEARCH_RADII) {
    const bbox = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
    const elements = await queryOverpass(OVERPASS_QUERY(bbox), opts.signal)
    if (elements === null) return null

    const best = bestByCategory(elements, lat, lng, km * 1000)
    const pois = Object.values(best).sort((a, b) => a.distance - b.distance)
    if (pois.length > 0) {
      const result: POIResult = { pois, best, radiusKm: km, score: computeNeighborhoodScore(best) }
      writeCache(cacheKey, result)
      return result
    }
  }

  const empty: POIResult = { pois: [], best: {}, radiusKm: SEARCH_RADII[SEARCH_RADII.length - 1].km, score: 0 }
  writeCache(cacheKey, empty)
  return empty
}
