'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { MapAd } from '@/lib/mapAds'

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

export async function createAd(data: Omit<MapAd, 'id'>) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('map_ads').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/map-ads')
  revalidatePath('/carte')
}

export async function updateAd(id: string, data: Partial<Omit<MapAd, 'id'>>) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('map_ads').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/map-ads')
  revalidatePath('/carte')
}

export async function deleteAd(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('map_ads').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/map-ads')
  revalidatePath('/carte')
}

export async function toggleAdActif(id: string, actif: boolean) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('map_ads').update({ actif }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/map-ads')
  revalidatePath('/carte')
}
