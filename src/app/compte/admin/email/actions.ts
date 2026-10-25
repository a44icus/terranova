'use server'

import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

interface EmailConfigInput {
  api_key:    string | null
  from_email: string
  from_name:  string
  enabled:    boolean
}

/**
 * Enregistre la config email. Passe par le service role après requireAdmin() :
 * la table n'est plus accessible directement depuis le navigateur (voir
 * supabase/migrations/20261026_securite_admin.sql).
 */
export async function saveEmailConfig(input: EmailConfigInput): Promise<{ error?: string }> {
  await requireAdmin()

  const { error } = await createAdminClient()
    .from('email_config')
    .update({
      api_key:    input.api_key || null,
      from_email: input.from_email,
      from_name:  input.from_name,
      enabled:    input.enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) {
    console.error('[saveEmailConfig]', error)
    return { error: 'Erreur lors de la sauvegarde' }
  }
  return {}
}
