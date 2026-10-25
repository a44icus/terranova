/**
 * Cron — POI des biens publiés
 *
 * Calcule les POI OpenStreetMap des biens qui n'en ont pas encore (nouvelles
 * annonces, biens déplacés, échecs précédents d'Overpass). Appelée toutes les
 * heures par GitHub Actions (.github/workflows/crons.yml) avec CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCronAuth } from '@/lib/cronAuth'
import { computeAndStorePois } from '@/lib/poisBien'

export const runtime = 'nodejs'
export const maxDuration = 60

const LOT        = 8       // biens traités au maximum par passage
const BUDGET_MS  = 45_000  // marge sous la durée maximale de la fonction

// GET pour Vercel Cron, POST pour les appels externes
export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  const refus = checkCronAuth(req, 'pois')
  if (refus) return refus

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
