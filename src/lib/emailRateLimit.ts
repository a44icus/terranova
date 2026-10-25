import { createAdminClient } from '@/lib/supabase/admin'
import { getClientIp } from '@/lib/clientIp'

const MAX_PER_HOUR = 5

/**
 * Clé de rate limiting d'une requête.
 * Utilisateur connecté → son id (changer d'IP ne contourne pas la limite).
 * Sinon → son IP. Sans IP identifiable → 'ip:unknown', compteur partagé : c'est le
 * seul repli sûr, mais il ne devrait pas arriver derrière Vercel (x-real-ip toujours présent).
 */
export function rateLimitKey(req: { headers: Headers }, userId?: string | null): string {
  if (userId) return `user:${userId}`
  const ip = getClientIp(req)
  if (!ip) console.warn('[RateLimit] IP non identifiable — compteur partagé ip:unknown')
  return `ip:${ip || 'unknown'}`
}

/**
 * Vérifie le rate limit email pour une clé (voir rateLimitKey) et une route.
 * Retourne true si la limite est dépassée (bloquer la requête), et sinon compte la tentative.
 *
 * Le comptage et l'enregistrement sont atomiques (fonction SQL email_rate_limit_hit).
 * En cas d'erreur DB, on bloque (fail-closed) : mieux vaut refuser un email que d'ouvrir
 * la porte au spam.
 */
export async function isEmailRateLimited(key: string, route: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('email_rate_limit_hit', {
      p_key: key, p_route: route, p_max: MAX_PER_HOUR,
    })

    if (!error) return data === true

    // Fonction absente : migration 20261026_email_rate_limit_atomique.sql pas encore jouée.
    // Repli sur l'ancien comptage (non atomique) pour ne pas bloquer tous les emails.
    if (error.code === 'PGRST202' || error.code === '42883') {
      console.warn('[RateLimit] email_rate_limit_hit absente — exécutez la migration. Repli non atomique.')
      return await legacyRateLimit(key, route)
    }

    console.warn('[RateLimit] email_rate_limit_hit en erreur — blocage par sécurité:', error.message)
    return true
  } catch (err) {
    console.warn('[RateLimit] erreur inattendue — blocage par sécurité:', err)
    return true
  }
}

async function legacyRateLimit(key: string, route: string): Promise<boolean> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error } = await admin
    .from('email_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip', key)
    .eq('route', route)
    .gte('created_at', since)
  if (error) return true
  if ((count ?? 0) >= MAX_PER_HOUR) return true
  await admin.from('email_rate_limits').insert({ ip: key, route })
  return false
}
