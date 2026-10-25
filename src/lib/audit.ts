import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp } from '@/lib/clientIp'

export type AdminAction = 'impersonation_start' | 'impersonation_stop'

/**
 * Enregistre une action admin dans admin_audit_log.
 * Ne lève jamais : un échec d'écriture est loggé mais ne bloque pas l'action.
 */
export async function logAdminAction(
  admin: Pick<User, 'id' | 'email'>,
  action: AdminAction,
  targetUserId?: string | null,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const h = await headers()
    const { error } = await createAdminClient().from('admin_audit_log').insert({
      admin_id:       admin.id,
      admin_email:    admin.email ?? null,
      action,
      target_user_id: targetUserId ?? null,
      ip:             getClientIp({ headers: h }) || null,
      user_agent:     h.get('user-agent')?.slice(0, 300) ?? null,
      details:        details ?? null,
    })
    if (error) console.error('[Audit] écriture impossible:', error.message)
  } catch (err) {
    console.error('[Audit] erreur inattendue:', err)
  }
}
