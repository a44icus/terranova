'use server'

import { requireAdmin } from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { IMPERSONATION_COOKIE as COOKIE } from '@/lib/impersonation'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function assertAdmin() {
  return await requireAdmin()
}

export async function startImpersonation(userId: string) {
  const admin = await assertAdmin()
  await logAdminAction(admin, 'impersonation_start', userId)
  const jar = await cookies()
  jar.set(COOKIE, userId, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hour
  })
  redirect('/compte')
}

export async function stopImpersonation() {
  const admin = await assertAdmin()
  const jar = await cookies()
  await logAdminAction(admin, 'impersonation_stop', jar.get(COOKIE)?.value)
  jar.delete(COOKIE)
  redirect('/admin/utilisateurs')
}

export async function changeUserType(userId: string, newType: 'pro' | 'particulier') {
  await assertAdmin()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  await admin.from('profiles').update({ type: newType }).eq('id', userId)
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/utilisateurs')
}

export async function grantPlan(
  userId: string,
  plan: 'gratuit' | 'pro_mensuel' | 'pro_annuel' | 'agence_mensuel' | 'agence_annuel',
  expireAt: string | null,
) {
  await assertAdmin()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  await admin.from('profiles').update({ plan, plan_expire_at: expireAt }).eq('id', userId)
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/utilisateurs')
}
