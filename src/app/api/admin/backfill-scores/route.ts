/**
 * POST /api/admin/backfill-scores
 * Calcule score_quartier pour tous les biens publiés qui n'en ont pas encore.
 * Réservé aux admins. Traitement séquentiel pour ne pas surcharger Overpass.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAndStoreScore } from '@/lib/computeBienScore'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min (Vercel Pro) — sinon 60s sur hobby

export async function POST() {
  // Vérification admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')
  if (!isAdmin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const adminClient = createAdminClient()

  // Récupérer tous les biens publiés sans score
  const { data: biens, error } = await adminClient
    .from('biens')
    .select('id, lat, lng')
    .eq('statut', 'publie')
    .is('score_quartier', null)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!biens?.length) return NextResponse.json({ ok: true, processed: 0, message: 'Tous les biens ont déjà un score.' })

  let processed = 0
  let errors = 0

  for (const bien of biens) {
    try {
      await computeAndStoreScore(bien.id, bien.lat, bien.lng, adminClient)
      processed++
      // Pause de 1,5s entre chaque appel pour respecter les rate limits Overpass
      await new Promise(r => setTimeout(r, 1500))
    } catch {
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    total: biens.length,
    message: `${processed}/${biens.length} biens mis à jour.`,
  })
}
