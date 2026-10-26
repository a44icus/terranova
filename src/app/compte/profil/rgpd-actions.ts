'use server'

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getImpersonatedId } from '@/lib/impersonation'
import { getStripe } from '@/lib/stripe'

const BUCKET = 'photos-biens'

/** Chemins de tous les fichiers sous un dossier du bucket (sous-dossiers compris). */
async function listerFichiers(admin: ReturnType<typeof createAdminClient>, dossier: string, profondeur = 3): Promise<string[]> {
  const { data } = await admin.storage.from(BUCKET).list(dossier, { limit: 1000 })
  const chemins: string[] = []
  for (const entree of data ?? []) {
    const chemin = `${dossier}/${entree.name}`
    // Les dossiers n'ont pas d'id dans l'API Storage
    if (entree.id) chemins.push(chemin)
    else if (profondeur > 0) chemins.push(...await listerFichiers(admin, chemin, profondeur - 1))
  }
  return chemins
}

/**
 * Droit à l'effacement (RGPD art. 17) : supprime le compte et toutes ses données.
 * Ordre : abonnement Stripe → fichiers → données (SQL) → compte auth.
 */
export async function supprimerMonCompte(confirmation: string): Promise<{ error?: string }> {
  const user = await requireAuth()
  if (await getImpersonatedId()) return { error: 'Impossible pendant une consultation de compte par un admin.' }
  if (confirmation.trim().toUpperCase() !== 'SUPPRIMER') return { error: 'Tapez SUPPRIMER pour confirmer.' }

  const admin = createAdminClient()

  // 1. Arrêter la facturation : sans ça, Stripe continuerait de prélever un compte supprimé
  const { data: profile } = await admin
    .from('profiles').select('stripe_subscription_id').eq('id', user.id).maybeSingle()
  if (profile?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== 'resource_missing') {
        console.error('[supprimerMonCompte] résiliation Stripe:', err)
        return { error: 'Impossible de résilier votre abonnement. Réessayez ou contactez le support.' }
      }
    }
  }

  // 2. Photos des annonces et logo
  try {
    const fichiers = [
      ...await listerFichiers(admin, user.id),
      ...await listerFichiers(admin, `logos/${user.id}`, 0),
    ]
    for (let i = 0; i < fichiers.length; i += 100) {
      await admin.storage.from(BUCKET).remove(fichiers.slice(i, i + 100))
    }
  } catch (err) {
    console.error('[supprimerMonCompte] fichiers:', err)
  }

  // 3. Données en base, puis 4. compte d'authentification
  const { error: sqlError } = await admin.rpc('supprimer_donnees_utilisateur', { p_user: user.id })
  if (sqlError) {
    console.error('[supprimerMonCompte] données:', sqlError.message)
    return { error: 'La suppression a échoué. Contactez le support.' }
  }
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('[supprimerMonCompte] compte auth:', authError.message)
    return { error: 'La suppression a échoué. Contactez le support.' }
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/?compte=supprime')
}
