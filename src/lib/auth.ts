/**
 * lib/auth.ts — Helpers d'authentification et d'autorisation centralisés.
 *
 * AVANT : la logique isAdmin était dupliquée en 7 endroits avec des variations
 * subtiles (redirect vs throw, user_metadata vs app_metadata, etc.).
 * APRÈS : un seul point d'entrée, un seul comportement.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Vérifie si un utilisateur Supabase est admin.
 * N'utilise QUE app_metadata (non-modifiable par l'utilisateur) et ADMIN_EMAILS.
 * — user_metadata est volontairement exclu car modifiable via supabase.auth.updateUser().
 */
export function isAdminUser(
  user: Pick<User, 'email' | 'app_metadata'> | null,
): boolean {
  if (!user) return false
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
  return (
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  )
}

/**
 * Exige une session utilisateur valide.
 * Redirige vers /auth/login si non connecté.
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return user
}

/**
 * Exige un utilisateur admin.
 * Redirige vers /auth/login si non connecté, vers / si non-admin.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (!isAdminUser(user)) redirect('/')
  return user
}
