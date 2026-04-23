export type AdFormat = 'pin' | 'banner' | 'card'

export interface MapAd {
  id: string
  titre: string
  description?: string
  image_url?: string
  lien_url?: string
  format: AdFormat
  lat: number | null
  lng: number | null
  couleur?: string
  emoji?: string
  actif: boolean
  date_debut?: string
  date_fin?: string
  visibility_radius_km?: number | null  // null = visible partout (mode rayon)
  // Ciblage par zone de carte visible (bbox) — alternatif au rayon
  bbox_north?: number | null
  bbox_south?: number | null
  bbox_east?: number | null
  bbox_west?: number | null
  // Capping d'impressions
  impressions_max_par_jour?: number | null  // null = illimité
}

export function isAdActive(ad: MapAd): boolean {
  if (!ad.actif) return false
  const now = Date.now()
  if (ad.date_debut && new Date(ad.date_debut).getTime() > now) return false
  if (ad.date_fin   && new Date(ad.date_fin).getTime()   < now) return false
  return true
}

/**
 * Retourne true si la pub doit être affichée pour la vue courante de la carte.
 *
 * Deux modes de ciblage géographique (priorité bbox > rayon) :
 *  1. bbox_* définis → la pub s'affiche si son point (lat/lng) est dans la bbox visible
 *  2. visibility_radius_km défini → la pub s'affiche si le centre de la carte
 *     est à moins de N km du point de la pub
 *  3. Aucun ciblage → toujours visible
 */
export function isAdInViewport(
  ad: MapAd,
  mapCenterLat: number,
  mapCenterLng: number,
  mapBounds?: { north: number; south: number; east: number; west: number },
): boolean {
  if (ad.lat == null || ad.lng == null) return true  // coords manquantes = visible partout

  // ── Mode bbox : la pub est visible si son point est dans la zone affichée ──
  if (
    ad.bbox_north != null && ad.bbox_south != null &&
    ad.bbox_east  != null && ad.bbox_west  != null
  ) {
    if (!mapBounds) return true  // pas de bounds dispo → on affiche par défaut
    // La pub est visible si sa bbox et la bbox de la carte se chevauchent
    const overlapLat = ad.bbox_north >= mapBounds.south && ad.bbox_south <= mapBounds.north
    const overlapLng = ad.bbox_east  >= mapBounds.west  && ad.bbox_west  <= mapBounds.east
    return overlapLat && overlapLng
  }

  // ── Mode rayon ────────────────────────────────────────────────────────────
  if (!ad.visibility_radius_km) return true  // pas de rayon = toujours visible
  const R = 6371
  const dLat = ((mapCenterLat - ad.lat) * Math.PI) / 180
  const dLng = ((mapCenterLng - ad.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((ad.lat * Math.PI) / 180) *
    Math.cos((mapCenterLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return distKm <= ad.visibility_radius_km
}
