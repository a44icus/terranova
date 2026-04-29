import { createAdminClient } from '@/lib/supabase/admin'

const MAX_PER_HOUR = 5

/**
 * Vérifie le rate limit email pour une IP + route donnée.
 * Retourne true si la limite est dépassée (bloquer la requête).
 * En cas d'erreur DB (table absente, etc.), laisse passer par sécurité de service.
 */
export async function isEmailRateLimited(ip: string, route: string): Promise<boolean> {
  if (!ip) return false

  try {
    const admin = createAdminClient()
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { count, error } = await admin
      .from('email_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .eq('route', route)
      .gte('created_at', since)

    if (error) {
      // Table probablement absente — ne pas bloquer
      console.warn('[RateLimit] email_rate_limits inaccessible:', error.message)
      return false
    }

    if ((count ?? 0) >= MAX_PER_HOUR) return true

    // Enregistre la tentative
    await admin.from('email_rate_limits').insert({ ip, route })

    return false
  } catch (err) {
    console.warn('[RateLimit] erreur inattendue:', err)
    return false
  }
}

/**
 * Extrait l'IP réelle depuis les headers de la requête Next.js.
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as any).headers
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
