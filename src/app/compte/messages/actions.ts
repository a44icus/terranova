'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markContactAsRead(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  // Vérifie que ce contact appartient bien à cet utilisateur
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, vendeur_id')
    .eq('id', contactId)
    .single()

  if (!contact || contact.vendeur_id !== user.id) {
    return { error: 'Accès refusé' }
  }

  // Admin client bypasse RLS
  const { error } = await createAdminClient()
    .from('contacts')
    .update({ lu: true })
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath('/compte/messages')
  revalidatePath('/compte')
  return { ok: true }
}

export async function markChercheurContactAsRead(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { data: contact } = await supabase
    .from('contacts_chercheurs')
    .select('id, chercheur_id')
    .eq('id', contactId)
    .single()

  if (!contact || contact.chercheur_id !== user.id) {
    return { error: 'Accès refusé' }
  }

  const { error } = await createAdminClient()
    .from('contacts_chercheurs')
    .update({ lu: true })
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath('/compte/messages')
  return { ok: true }
}
