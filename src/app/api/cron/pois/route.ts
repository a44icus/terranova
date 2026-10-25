/**
 * Cron — POI des biens publiés
 *
 * Calcule les POI OpenStreetMap des biens qui n'en ont pas encore (nouvelles
 * annonces, biens déplacés, échecs précédents d'Overpass). Appelée toutes les
 * heures par GitHub Actions (.github/workflows/pois.yml) avec CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAndStorePois } from '@/lib/poisBien'

export const runtime = 'nodejs'
export const maxDuration = 60

const LOT        = 8       // biens traités au maximum par passage
const BUDGET_MS  = 45_000  // marge sous la durée maximale de la fonction

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[Cron pois] CRON_SECRET non configuré — accès refusé')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  const provided = req.headers.get('x-cron-secret') ?? ''
  const safe =
    provided.length === cronSecret.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(cronSecret))
  if (!safe) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const debut = Date.now()

  const { data: biens, error } = await admin
    .from('biens')
    .select('id, lat, lng')
    .is('pois', null)
    .in('statut', ['publie', 'vendue'])
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('pois_attempt_at', { ascending: true, nullsFirst: true })
    .limit(LOT)

  if (error) {
    console.error('[Cron pois]', error.message)
    return NextResponse.json({ error: 'Lecture des biens impossible' }, { status: 500 })
  }

  let calcules = 0
  let echecs = 0
  for (const bien of biens ?? []) {
    if (Date.now() - debut > BUDGET_MS) break
    const result = await computeAndStorePois(bien.id, bien.lat, bien.lng, admin)
    if (result) {
      calcules++
    } else {
      echecs++
      // Deux échecs sans aucun succès : Overpass est en panne, inutile d'insister
      if (calcules === 0 && echecs >= 2) break
    }
    await new Promise(r => setTimeout(r, 1000)) // ménager Overpass
  }

  return NextResponse.json({ ok: true, enAttente: biens?.length ?? 0, calcules, echecs })
}
