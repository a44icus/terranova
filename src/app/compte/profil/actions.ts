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

  const viewId = await getViewUserId() ?? user.id
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
