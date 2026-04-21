// ── Types & helpers pour les publicités sur la carte ─────────────────────────

export type AdFormat = 'pin' | 'banner' | 'card'

export interface MapAd {
  id: string
  titre: string
  description?: string
  image_url?: string
  lien_url?: string
  format: AdFormat
  lat: number
  lng: number
  couleur?: string      // couleur de fond du pin/banner (défaut : #F59E0B)
  emoji?: string        // emoji optionnel affiché sur le pin
  actif: boolean
  date_debut?: string
  date_fin?: string
}

/**
 * Retourne true si une pub est actuellement valide
 */
export function isAdActive(ad: MapAd): boolean {
  if (!ad.actif) return false
  const now = Date.now()
  if (ad.date_debut && new Date(ad.date_debut).getTime() > now) return false
  if (ad.date_fin   && new Date(ad.date_fin).getTime()   < now) return false
  return true
}
