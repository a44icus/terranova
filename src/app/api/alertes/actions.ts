'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AlerteData {
  email?: string
  type?: string
  categorie?: string
  ville?: string
  prix_max?: number
  surface_min?: number
}

export async function createAlerte(data: AlerteData): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get email from user if not provided
  const email = data.email || user?.email
  if (!email) return { error: 'Email requis' }

  const { error } = await supabase.from('alertes').insert({
    user_id: user?.id ?? null,
    email,
    type: data.type || null,
    categorie: data.categorie || null,
    ville: data.ville || null,
    prix_max: data.prix_max || null,
    surface_min: data.surface_min || null,
    active: true,
  })

  if (error) {
    console.error('[createAlerte]', error)
    if (error.message.includes('does not exist')) {
      return { error: 'Table alertes manquante. Exécutez le SQL de migration.' }
    }
    return { error: 'Erreur lors de la création de l\'alerte' }
  }

  revalidatePath('/compte/alertes')
  return { ok: true }
}

export async function deleteAlerte(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('alertes').delete().eq('id', id).eq('user_id', user.id)
  if (error) {
    console.error('[deleteAlerte]', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/compte/alertes')
  return { ok: true }
}

export async function getAlertes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase.from('alertes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return data ?? []
}
