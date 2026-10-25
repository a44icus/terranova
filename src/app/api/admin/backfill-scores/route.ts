/**
 * POST /api/admin/backfill-scores
 * Calcule les POI et le score de quartier des biens publiés qui n'en ont pas encore.
 * Réservé aux admins. Traitement séquentiel pour ne pas surcharger Overpass.
 */

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAndStoreScore } from '@/lib/computeBienScore'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min (Vercel Pro) — sinon 60s sur hobby

export async function POST() {
  // Vérification admin centralisée (401/403 JSON si non connecté ou non-admin)
  const admin = await requireAdminApi()
  if (admin instanceof NextResponse) return admin

  const adminClient = createAdminClient()

  // Récupérer tous les biens publiés sans score
  const { data: biens, error } = await adminClient
    .from('biens')
    .select('id, lat, lng')
    .eq('statut', 'publie')
    .is('pois', null)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (error) {
    console.error('[backfill-scores]', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des biens.' }, { status: 500 })
  }
  if (!biens?.length) return NextResponse.json({ ok: true, processed: 0, message: 'Tous les biens ont déjà leurs POI.' })

  let processed = 0
  let errors = 0

  for (const bien of biens) {
    try {
      const score = await computeAndStoreScore(bien.id, bien.lat, bien.lng, adminClient)
      if (score === null) errors++
      else processed++
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
