/**
 * Calcule le score de quartier d'un bien via Overpass (serveur uniquement)
 * et le persiste dans biens.score_quartier.
 *
 * Fire-and-forget : appelez sans await si vous ne voulez pas bloquer le flux.
 */

import { fetchPOIFromOverpass } from '@/lib/poiFetch'

/**
 * Calcule et persiste le score_quartier d'un bien.
 * Retourne null (sans rien enregistrer) si Overpass est indisponible :
 * un 0 enregistré par erreur serait affiché comme un vrai score.
 * @param bienId  UUID du bien
 * @param lat     Latitude
 * @param lng     Longitude
 * @param client  Client Supabase avec droits d'écriture sur biens
 */
export async function computeAndStoreScore(
  bienId: string,
  lat: number,
  lng: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any, // SupabaseClient — typé loosely pour éviter l'import circulaire
): Promise<number | null> {
  try {
    const result = await fetchPOIFromOverpass(lat, lng)
    if (!result) {
      console.warn('[computeBienScore] Overpass indisponible — score non enregistré pour', bienId)
      return null
    }
    await client
      .from('biens')
      .update({ score_quartier: result.score })
      .eq('id', bienId)
    return result.score
  } catch (err) {
    console.error('[computeBienScore] Erreur:', err)
    return null
  }
}
