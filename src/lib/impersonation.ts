import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const COOKIE = 'tn_impersonate'

async function isCallerAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  return (
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  )
}

/** Returns the impersonated user ID if the caller is admin and a cookie is set. */
export async function getImpersonatedId(): Promise<string | null> {
  const jar = await cookies()
  const val = jar.get(COOKIE)?.value
  if (!val) return null
  const admin = await isCallerAdmin()
  return admin ? val : null
}

/**
 * Returns the user ID to use for data queries.
 * If admin is impersonating, returns the impersonated ID.
 * Otherwise returns the real authenticated user's ID.
 */
export async function getViewUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const impersonated = await getImpersonatedId()
  return impersonated ?? user.id
}
