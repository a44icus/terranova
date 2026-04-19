'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFavoriDB(bienId: string): Promise<{ ok: boolean; added?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  // Vérifier si déjà en favori
  const { data: existing } = await supabase
    .from('favoris')
    .select('bien_id')
    .eq('user_id', user.id)
    .eq('bien_id', bienId)
    .single()

  if (existing) {
    await supabase.from('favoris').delete().eq('user_id', user.id).eq('bien_id', bienId)
  } else {
    await supabase.from('favoris').insert({ user_id: user.id, bien_id: bienId })
  }

  revalidatePath('/compte/favoris')
  return { ok: true, added: !existing }
}

export async function getFavorisDB(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('favoris')
    .select('bien_id')
    .eq('user_id', user.id)

  return (data ?? []).map((f: { bien_id: string }) => f.bien_id)
}
