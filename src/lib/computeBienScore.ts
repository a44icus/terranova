/**
 * Calcule le score de quartier d'un bien via Overpass (serveur uniquement)
 * et le persiste dans biens.score_quartier.
 *
 * Fire-and-forget : appelez sans await si vous ne voulez pas bloquer le flux.
 */

import {
  OVERPASS_QUERY,
  OVERPASS_SERVERS,
  SEARCH_RADII,
  detectCategory,
  computeNeighborhoodScore,
} from '@/lib/poi'

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchScore(lat: number, lng: number): Promise<number> {
  for (const { km, deg } of SEARCH_RADII) {
    const bbox  = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`
    const query = OVERPASS_QUERY(bbox)
    const maxDistM = km * 1000

    for (const server of OVERPASS_SERVERS) {
      try {
        const res = await fetch(server, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(9000),
          headers: { 'User-Agent': 'Terranova/1.0 (immobilier)' },
        })
        if (!res.ok) continue

        const data = await res.json()
        const best: Record<string, { distance: number }> = {}

        for (const el of data.elements ?? []) {
          if (!el.lat || !el.lon) continue
          const dist = Math.round(haversineM(lat, lng, el.lat, el.lon))
          if (dist > maxDistM) continue
          const cat = detectCategory(el.tags ?? {})
          if (!cat) continue
          if (!best[cat] || dist < best[cat].distance) {
            best[cat] = { distance: dist }
          }
        }

        if (Object.keys(best).length > 0) {
          return computeNeighborhoodScore(best)
        }
      } catch {
        continue
      }
    }
  }
  return 0
}

/**
 * Calcule et persiste le score_quartier d'un bien.
 * @param bienId  UUID du bien
 * @param lat     Latitude
 * @param lng     Longitude
 * @param client  Client Supabase avec droits d'écriture sur biens
 */
export async function computeAndStoreScore(
  bienId: string,
  lat: number,
  lng: number,
  client: any, // SupabaseClient — typé loosely pour éviter l'import circulaire
): Promise<number> {
  try {
    const score = await fetchScore(lat, lng)
    await client
      .from('biens')
      .update({ score_quartier: score })
      .eq('id', bienId)
    return score
  } catch (err) {
    console.error('[computeBienScore] Erreur:', err)
    return 0
  }
}
