'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  if (!isAdmin) throw new Error('Accès refusé')
}

export async function updatePlanConfig(formData: FormData) {
  await checkAdmin()
  const supabase = createAdminClient()

  const plans = ['gratuit', 'pro_mensuel', 'pro_annuel'] as const

  for (const plan of plans) {
    const annonces       = parseInt(formData.get(`${plan}_annonces`)        as string) || 0
    const photos         = parseInt(formData.get(`${plan}_photos`)          as string) || 0
    const duree_jours    = parseInt(formData.get(`${plan}_duree_jours`)     as string) || 0
    const prix           = parseInt(formData.get(`${plan}_prix`)            as string) || 0
    const stripe_price_id = (formData.get(`${plan}_stripe_price_id`) as string)?.trim() || null

    const { error } = await supabase
      .from('plan_config')
      .upsert({
        plan,
        annonces,
        photos,
        duree_jours,
        prix,
        stripe_price_id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'plan' })

    if (error) {
      console.error(`[Admin] Erreur mise à jour plan ${plan}:`, error)
      throw new Error(`Erreur pour le plan ${plan}: ${error.message}`)
    }
  }

  revalidatePath('/admin/parametres')
  revalidatePath('/compte/plan')
}
