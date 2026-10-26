/**
 * Cron — Plans expirés
 *
 * Repasse au plan gratuit les comptes dont le plan payant a expiré sans renouvellement.
 * Le trigger profiles_sync_biens retire alors les avantages de leurs annonces (badge Pro,
 * mise en avant…). Sans ce cron, cela n'arrivait qu'à la prochaine visite du compte.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCronAuth } from '@/lib/cronAuth'

// GET pour Vercel Cron, POST pour les appels externes
export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  const refus = checkCronAuth(req, 'plans-expires')
  if (refus) return refus

  const { data, error } = await createAdminClient().rpc('expirer_plans')
  if (error) {
    console.error('[Cron plans-expires]', error.message)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, expires: data ?? 0 })
}
