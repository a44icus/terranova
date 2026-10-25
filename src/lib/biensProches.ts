import type { SupabaseClient } from '@supabase/supabase-js'
import { haversineKm } from '@/lib/geo'

/** Rayons de recherche successifs (km) : on élargit tant qu'on n'a pas assez de biens. */
const RAYONS_KM = [25, 75, 200, 600]

/**
 * Biens publiés les plus proches d'un point, triés par distance.
 *
 * Recherche dans un carré autour du point (filtre indexable sur lat/lng), élargi par
 * paliers jusqu'à trouver `limit` biens ; le tri final se fait en distance réelle.
 */
export async function getBiensProches<T extends { lat: number | null; lng: number | null }>(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  limit = 6,
): Promise<(T & { distance_km: number })[]> {
  for (const rayon of RAYONS_KM) {
    const dLat = rayon / 111
    const dLng = rayon / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.1))

    const { data } = await supabase
      .from('biens_publics')
      .select('*')
      .gte('lat', lat - dLat).lte('lat', lat + dLat)
      .gte('lng', lng - dLng).lte('lng', lng + dLng)
      .order('publie_at', { ascending: false })
      .limit(300)

    const biens = ((data ?? []) as T[])
      .filter(b => b.lat != null && b.lng != null)
      .map(b => ({ ...b, distance_km: haversineKm(lat, lng, b.lat!, b.lng!) }))
      .filter(b => b.distance_km <= rayon)

    if (biens.length >= limit || rayon === RAYONS_KM[RAYONS_KM.length - 1]) {
      return biens.sort((a, b) => a.distance_km - b.distance_km).slice(0, limit)
    }
  }
  return []
}
