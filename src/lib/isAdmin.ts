/**
 * lib/isAdmin.ts — Définition unique de « l'utilisateur est admin ».
 *
 * Module pur, sans import serveur : utilisable depuis le middleware comme depuis
 * lib/auth.ts (qui dépend de next/navigation et du client Supabase serveur).
 */

interface AdminCandidate {
  email?: string
  app_metadata?: Record<string, unknown>
}

/**
 * Vérifie si un utilisateur Supabase est admin.
 * N'utilise QUE app_metadata (non-modifiable par l'utilisateur) et ADMIN_EMAILS.
 * — user_metadata est volontairement exclu car modifiable via supabase.auth.updateUser().
 */
export function isAdminUser(user: AdminCandidate | null): boolean {
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
