'use server'

import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { SiteSettings } from '@/lib/siteSettings'

async function checkAdmin() { await requireAdmin() }

export async function saveSettings(section: string, data: Partial<SiteSettings>) {
  await checkAdmin()
  const supabase = createAdminClient()

  // Lire les settings existants
  const { data: existing } = await supabase
    .from('site_settings')
    .select('settings')
    .eq('id', 1)
    .single()

  const current = (existing?.settings as object) ?? {}
  const updated = { ...current, ...data }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, settings: updated, updated_at: new Date().toISOString() }, { onConflict: 'id' })

  if (error) throw new Error(`Erreur sauvegarde: ${error.message}`)

  revalidatePath('/admin/reglages')
  revalidatePath('/')
  return { ok: true }
}
