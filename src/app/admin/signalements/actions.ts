'use server'

import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  await requireAdmin()
}

export async function ignorerSignalement(id: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('signalements').update({ statut: 'ignore' }).eq('id', id)
  revalidatePath('/admin/signalements')
}

export async function retrograderEtTraiter(id: string, reportedUserId: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await Promise.all([
    admin.from('profiles').update({ type: 'particulier' }).eq('id', reportedUserId),
    admin.from('signalements').update({ statut: 'traite' }).eq('id', id),
  ])
  revalidatePath('/admin/signalements')
  revalidatePath('/agences')
}

export async function suspendrEtTraiter(id: string, reportedUserId: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await Promise.all([
    admin.auth.admin.updateUserById(reportedUserId, { ban_duration: '876000h' }),
    admin.from('signalements').update({ statut: 'traite' }).eq('id', id),
  ])
  revalidatePath('/admin/signalements')
}
