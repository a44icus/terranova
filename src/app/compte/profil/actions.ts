'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getViewUserId } from '@/lib/impersonation'

export async function updateProfil(data: {
  prenom: string
  nom: string
  telephone: string | null
  agence: string | null
  siret: string | null
  site_web: string | null
  bio: string | null
  ville: string | null
  adresse: string | null
  lat: number | null
  lng: number | null
  reseau_id: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const impersonatedId = await getViewUserId()
  const viewId = impersonatedId ?? user.id

  // Si impersonation active, vérifier que l'appelant est admin
  if (impersonatedId && impersonatedId !== user.id) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
    const isAdmin =
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin' ||
      adminEmails.includes(user.email ?? '')
    if (!isAdmin) throw new Error('Accès refusé')
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update(data)
    .eq('id', viewId)

  if (error) throw new Error(error.message)

  revalidatePath('/compte/profil')
  revalidatePath(`/vendeur/${viewId}`)
  revalidatePath('/agences')
}
