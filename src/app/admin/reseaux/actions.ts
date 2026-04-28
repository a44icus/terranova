'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  return isAdmin ? user : null
}

function toSlug(nom: string) {
  return nom.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function createReseau(data: {
  nom: string
  type_reseau: string
  description?: string
  site_web?: string
  logo_url?: string
}): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }

  if (!data.nom?.trim()) return { error: 'Nom requis' }

  const slug = toSlug(data.nom.trim())
  const { error } = await createAdminClient().from('reseaux').insert({
    nom:         data.nom.trim(),
    slug,
    type_reseau: data.type_reseau || 'enseigne',
    description: data.description?.trim() || null,
    site_web:    data.site_web?.trim() || null,
    logo_url:    data.logo_url?.trim() || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/reseaux')
  revalidatePath('/agences')
  return { ok: true }
}

export async function updateReseau(id: string, data: {
  nom: string
  type_reseau: string
  description?: string
  site_web?: string
  logo_url?: string
}): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }

  if (!data.nom?.trim()) return { error: 'Nom requis' }

  const { error } = await createAdminClient().from('reseaux').update({
    nom:         data.nom.trim(),
    slug:        toSlug(data.nom.trim()),
    type_reseau: data.type_reseau || 'enseigne',
    description: data.description?.trim() || null,
    site_web:    data.site_web?.trim() || null,
    logo_url:    data.logo_url?.trim() || null,
    updated_at:  new Date().toISOString(),
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/reseaux')
  revalidatePath('/agences')
  return { ok: true }
}

export async function deleteReseau(id: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }

  // Détacher les profils avant suppression
  await createAdminClient().from('profiles').update({ reseau_id: null }).eq('reseau_id', id)

  const { error } = await createAdminClient().from('reseaux').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/reseaux')
  revalidatePath('/agences')
  return { ok: true }
}
