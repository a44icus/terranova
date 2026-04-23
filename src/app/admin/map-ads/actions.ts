'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { MapAd } from '@/lib/mapAds'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Non authentifié')
  const isAdminByRole = user.app_metadata?.role === 'admin'
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdminByEmail = adminEmails.length > 0 && adminEmails.includes(user.email ?? '')
  if (!isAdminByRole && !isAdminByEmail) throw new Error('Accès refusé')
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

/** Récupère les stats journalières des 30 derniers jours pour une pub */
export async function getAdDailyStats(ad_id: string): Promise<{ date: string; impressions: number; clicks: number }[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - 29)

  const { data, error } = await supabase
    .from('map_ad_events')
    .select('event_type, created_at')
    .eq('ad_id', ad_id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error || !data) return []

  // Agrégation par jour côté JS
  const byDay: Record<string, { impressions: number; clicks: number }> = {}
  for (const row of data) {
    const day = row.created_at.slice(0, 10)
    if (!byDay[day]) byDay[day] = { impressions: 0, clicks: 0 }
    if (row.event_type === 'impression') byDay[day].impressions++
    if (row.event_type === 'click')      byDay[day].clicks++
  }

  // Remplit les jours manquants à 0
  const result = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, ...(byDay[key] ?? { impressions: 0, clicks: 0 }) })
  }
  return result
}
