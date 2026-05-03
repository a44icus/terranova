'use server'

import { createClient } from '@/lib/supabase/server'
import { computeAndStoreScore } from '@/lib/computeBienScore'

/**
 * Calcule et persiste le score de quartier d'un bien nouvellement créé.
 * Appelé en fire-and-forget depuis PublierForm après l'insert.
 */
export async function computeScoreApresPublication(
  bienId: string,
  lat: number,
  lng: number,
): Promise<void> {
  const supabase = await createClient()
  // Vérifie que le bien appartient à l'utilisateur courant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: bien } = await supabase
    .from('biens')
    .select('id')
    .eq('id', bienId)
    .eq('user_id', user.id)
    .single()

  if (!bien) return

  await computeAndStoreScore(bienId, lat, lng, supabase)
}
