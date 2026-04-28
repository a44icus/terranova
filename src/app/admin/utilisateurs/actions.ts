'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const COOKIE = 'tn_impersonate'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  if (!isAdmin) redirect('/')
}

export async function startImpersonation(userId: string) {
  await assertAdmin()
  const jar = await cookies()
  jar.set(COOKIE, userId, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  })
  redirect('/compte')
}

export async function stopImpersonation() {
  await assertAdmin()
  const jar = await cookies()
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
  plan: 'gratuit' | 'pro_mensuel' | 'pro_annuel',
  expireAt: string | null,
) {
  await assertAdmin()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  await admin.from('profiles').update({ plan, plan_expire_at: expireAt }).eq('id', userId)
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/utilisateurs')
}
