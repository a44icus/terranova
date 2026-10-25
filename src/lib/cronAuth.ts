import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

/**
 * Vérifie l'authentification d'un appel de cron.
 * Accepte les deux formes :
 *   - Vercel Cron : GET avec `Authorization: Bearer <CRON_SECRET>`
 *   - appel externe (GitHub Actions, curl…) : en-tête `x-cron-secret: <CRON_SECRET>`
 * Retourne une réponse d'erreur à renvoyer telle quelle, ou null si l'appel est autorisé.
 */
export function checkCronAuth(req: Request, label: string): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error(`[Cron ${label}] CRON_SECRET non configuré — accès refusé`)
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const provided = req.headers.get('x-cron-secret') ?? bearer ?? ''
  const safe =
    provided.length === cronSecret.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(cronSecret))
  if (!safe) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
