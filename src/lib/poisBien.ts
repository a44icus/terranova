/**
 * lib/poisBien.ts — POI OpenStreetMap stockés par bien (colonne biens.pois).
 *
 * Les POI sont récupérés une fois via Overpass puis enregistrés dans le bien.
 * La carte et la fiche annonce les lisent depuis la base : l'affichage ne
 * dépend plus de la disponibilité d'Overpass. Serveur uniquement.
 */

import { fetchPOIFromOverpass, type POIItem, type POIResult } from '@/lib/poiFetch'

/** Format stocké dans biens.pois */
export interface StoredPOIs {
  pois: POIItem[]
  radiusKm: number
  score: number
}

// Seules ces étiquettes OSM sont conservées, pour limiter la taille stockée
const TAGS_CONSERVES = ['name', 'name:fr', 'amenity', 'shop', 'railway', 'highway', 'leisure', 'cuisine']

function allegerTags(tags: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of TAGS_CONSERVES) if (tags[k]) out[k] = tags[k]
  return out
}

/** Reconstitue le format complet (avec `best` par catégorie) à partir du format stocké. */
export function storedToResult(stored: StoredPOIs): POIResult {
  const best: Record<string, POIItem> = {}
  for (const p of stored.pois) best[p.categoryKey] = p
  return { pois: stored.pois, best, radiusKm: stored.radiusKm, score: stored.score }
}

/**
 * Interroge Overpass et enregistre les POI et le score du bien.
 * En cas de panne d'Overpass, seule la date de tentative est enregistrée
 * et la fonction retourne null (la tâche automatique réessaiera).
 */
export async function computeAndStorePois(
  bienId: string,
  lat: number,
  lng: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any, // SupabaseClient avec droits d'écriture sur biens
): Promise<POIResult | null> {
  const now = new Date().toISOString()
  const result = await fetchPOIFromOverpass(lat, lng)

  if (!result) {
    await client.from('biens').update({ pois_attempt_at: now }).eq('id', bienId)
    return null
  }

  const stored: StoredPOIs = {
    pois: result.pois.map(p => ({ ...p, tags: allegerTags(p.tags) })),
    radiusKm: result.radiusKm,
    score: result.score,
  }

  const { error } = await client.from('biens').update({
    pois:            stored,
    pois_updated_at: now,
    pois_attempt_at: now,
    score_quartier:  stored.score,
  }).eq('id', bienId)
  if (error) console.error('[poisBien] Enregistrement impossible pour', bienId, error.message)

  return storedToResult(stored)
}
