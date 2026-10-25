/**
 * lib/poiFetch.ts — Interrogation d'Overpass (données OpenStreetMap), côté SERVEUR.
 *
 * L'instance d'OpenStreetMap France est appelée en premier : l'instance
 * principale (overpass-api.de) est saturée et refuse les appels automatisés.
 * L'instance OSM France n'autorise pas les appels depuis un navigateur (pas de
 * CORS) : ce module doit donc être utilisé depuis le serveur uniquement
 * (route /api/poi, calcul du score à la publication).
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

const TIMEOUT_MS = 9000
const USER_AGENT = 'JazzImmo/1.0 (immobilier)'

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Envoie la requête au premier serveur qui répond. null = tous indisponibles. */
async function queryOverpass(query: string): Promise<OverpassElement[] | null> {
  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        body:    `data=${encodeURIComponent(query)}`,
        signal:  AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!res.ok) continue
      const data = await res.json() as { elements?: OverpassElement[]; remark?: string }
      // Une « remark » signale une erreur d'exécution (mémoire, timeout) : résultat non fiable
      if (data.remark && /error/i.test(data.remark)) continue
      return Array.isArray(data.elements) ? data.elements : []
    } catch {
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
    const tags = el.tags ?? {}
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
 * POI autour d'un point, en élargissant le rayon (1, 3 puis 5 km) tant que
 * rien n'est trouvé. Retourne null si Overpass est injoignable, pour ne jamais
 * confondre une panne avec un quartier sans commerces.
 */
export async function fetchPOIFromOverpass(lat: number, lng: number): Promise<POIResult | null> {
  for (const { km, deg } of SEARCH_RADII) {
    const bbox = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
    const elements = await queryOverpass(OVERPASS_QUERY(bbox))
    if (elements === null) return null

    const best = bestByCategory(elements, lat, lng, km * 1000)
    const pois = Object.values(best).sort((a, b) => a.distance - b.distance)
    if (pois.length > 0) {
      return { pois, best, radiusKm: km, score: computeNeighborhoodScore(best) }
    }
  }
  return { pois: [], best: {}, radiusKm: SEARCH_RADII[SEARCH_RADII.length - 1].km, score: 0 }
}
