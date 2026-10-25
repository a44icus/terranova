/**
 * lib/auth.ts — Helpers d'authentification et d'autorisation centralisés.
 *
 * AVANT : la logique isAdmin était dupliquée en 7 endroits avec des variations
 * subtiles (redirect vs throw, user_metadata vs app_metadata, etc.).
 * APRÈS : un seul point d'entrée, un seul comportement.
 */

import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/isAdmin'
import type { User } from '@supabase/supabase-js'

export { isAdminUser }

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

/**
 * Variante de requireAdmin pour les routes API : renvoie une erreur JSON
 * (401 non connecté, 403 non-admin) au lieu d'une redirection HTML.
 *
 *   const admin = await requireAdminApi()
 *   if (admin instanceof NextResponse) return admin
 */
export async function requireAdminApi(): Promise<User | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!isAdminUser(user)) return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  return user
}
