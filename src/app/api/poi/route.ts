/**
 * GET /api/poi?id=<uuid du bien>
 * Retourne les POI OpenStreetMap stockés pour le bien. S'ils n'existent pas
 * encore, tente de les calculer immédiatement (et les enregistre).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeAndStorePois, storedToResult, type StoredPOIs } from '@/lib/poisBien'

export const runtime = 'nodejs'
export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Après un échec, on ne réinterroge pas Overpass avant ce délai (la tâche horaire s'en charge)
const DELAI_APRES_ECHEC_MS = 10 * 60 * 1000

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: bien, error } = await admin
    .from('biens')
    .select('id, lat, lng, statut, pois, pois_attempt_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    // Ex. colonnes absentes : migration supabase/migrations/20261025_biens_pois.sql non exécutée
    console.error('[api/poi] Lecture du bien impossible :', error.message)
    return NextResponse.json(
      { error: 'Erreur base de données' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (!bien || !['publie', 'vendue'].includes(bien.statut)) {
    return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  }

  // Cache court : les POI sont effacés si le vendeur déplace son bien
  const cacheOk = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' }
  const indisponible = () => NextResponse.json(
    { error: 'POI pas encore disponibles' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )

  if (bien.pois) {
    return NextResponse.json(storedToResult(bien.pois as StoredPOIs), { headers: cacheOk })
  }

  if (bien.lat == null || bien.lng == null) return indisponible()

  const dernierEssai = bien.pois_attempt_at ? new Date(bien.pois_attempt_at).getTime() : 0
  if (Date.now() - dernierEssai < DELAI_APRES_ECHEC_MS) return indisponible()

  const result = await computeAndStorePois(bien.id, bien.lat, bien.lng, admin)
  if (!result) return indisponible()

  return NextResponse.json(result, { headers: cacheOk })
}
