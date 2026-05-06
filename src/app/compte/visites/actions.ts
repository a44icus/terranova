'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getViewUserId } from '@/lib/impersonation'
import { revalidatePath } from 'next/cache'

const ALLOWED_STATUTS = ['en_attente', 'confirme', 'annule'] as const
type Statut = typeof ALLOWED_STATUTS[number]

/**
 * Met à jour le statut d'une visite.
 * Vérifie que l'utilisateur courant est bien le vendeur de cette visite
 * avant toute modification — évite l'IDOR via l'appel direct au client Supabase.
 */
export async function updateVisiteStatut(
  visiteId: string,
  newStatut: Statut,
): Promise<{ ok?: boolean; error?: string }> {
  if (!ALLOWED_STATUTS.includes(newStatut)) {
    return { error: 'Statut invalide' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const viewId = await getViewUserId() ?? user.id
  const admin  = createAdminClient()

  // Vérification d'appartenance : la visite doit appartenir au vendeur courant
  const { data: visite } = await admin
    .from('visites')
    .select('id, vendeur_id')
    .eq('id', visiteId)
    .single()

  if (!visite || visite.vendeur_id !== viewId) {
    return { error: 'Accès refusé' }
  }

  const { error } = await admin
    .from('visites')
    .update({ statut: newStatut })
    .eq('id', visiteId)

  if (error) {
    console.error('[updateVisiteStatut]', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/compte/visites')
  return { ok: true }
}
