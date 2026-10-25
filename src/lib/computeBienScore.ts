/**
 * Calcule les POI et le score de quartier d'un bien, puis les enregistre.
 * Conservé pour compatibilité : délègue à lib/poisBien.ts.
 *
 * Fire-and-forget : appelez sans await si vous ne voulez pas bloquer le flux.
 */

import { computeAndStorePois } from '@/lib/poisBien'

/**
 * Retourne le score, ou null (sans rien enregistrer) si Overpass est indisponible :
 * un 0 enregistré par erreur serait affiché comme un vrai score.
 */
export async function computeAndStoreScore(
  bienId: string,
  lat: number,
  lng: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any, // SupabaseClient — typé loosely pour éviter l'import circulaire
): Promise<number | null> {
  try {
    const result = await computeAndStorePois(bienId, lat, lng, client)
    return result ? result.score : null
  } catch (err) {
    console.error('[computeBienScore] Erreur:', err)
    return null
  }
}
