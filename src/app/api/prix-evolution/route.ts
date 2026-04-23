import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface DataPoint {
  label: string
  prixM2: number
  source: 'interne' | 'dvf'
  count: number
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function last12MonthsKeys(): { key: string; label: string; date: Date }[] {
  const result = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    result.push({ key, label: monthLabel(d), date: new Date(d) })
  }
  return result
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ville = searchParams.get('ville') ?? ''
  const cp    = searchParams.get('cp') ?? ''
  const cat   = searchParams.get('cat') ?? ''

  if (!ville) return NextResponse.json({ points: [] })

  const months = last12MonthsKeys()
  const pointsMap: Record<string, { sum: number; count: number }> = {}
  months.forEach(m => { pointsMap[m.key] = { sum: 0, count: 0 } })

  // ── 1. Données internes Supabase ─────────────────────────────────────────
  try {
    const supabase = createAdminClient()
    const since = months[0].date.toISOString()
    const query = supabase
      .from('biens')
      .select('prix, surface, publie_at')
      .eq('statut', 'publie')
      .eq('type', 'vente')
      .not('surface', 'is', null)
      .gt('surface', 0)
      .gte('publie_at', since)
      .ilike('ville', `%${ville}%`)

    if (cat && ['appartement', 'maison'].includes(cat)) {
      query.eq('categorie', cat)
    }

    const { data } = await query
    if (data) {
      for (const b of data) {
        if (!b.publie_at || !b.surface || !b.prix) continue
        const d = new Date(b.publie_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (pointsMap[key]) {
          pointsMap[key].sum   += b.prix / b.surface
          pointsMap[key].count += 1
        }
      }
    }
  } catch {}

  // ── 2. DVF (data.gouv.fr) ────────────────────────────────────────────────
  try {
    const dvfCat = cat === 'appartement' ? 'Appartement' : cat === 'maison' ? 'Maison' : null
    const dvfUrl = `https://api.data.gouv.fr/v1/datasets/5c4ae55a634f4117716d5656/dvf/?code_postal=${cp}&type_local=${dvfCat ?? ''}&fields=valeur_fonciere,surface_reelle_bati,date_mutation`
    const res = await fetch(dvfUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) {
      const raw = await res.json()
      const records: any[] = raw.results ?? raw.features ?? []
      for (const r of records) {
        const props = r.properties ?? r
        const prix    = parseFloat(props.valeur_fonciere)
        const surface = parseFloat(props.surface_reelle_bati)
        const date    = props.date_mutation
        if (!prix || !surface || surface <= 0 || !date) continue
        const prixM2 = prix / surface
        if (prixM2 < 500 || prixM2 > 50000) continue
        const d   = new Date(date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (pointsMap[key]) {
          pointsMap[key].sum   += prixM2
          pointsMap[key].count += 1
        }
      }
    }
  } catch {}

  // ── 3. Construire les points, interpoler les mois vides ──────────────────
  const rawPoints = months.map(m => {
    const p = pointsMap[m.key]
    return {
      label: m.label,
      key:   m.key,
      prixM2: p.count > 0 ? Math.round(p.sum / p.count) : null,
      count: p.count,
      source: 'interne' as const,
    }
  })

  // Interpolation linéaire pour les mois sans données
  let lastKnown: number | null = null
  let nextKnown: number | null = null
  const filled = rawPoints.map((p, i) => {
    if (p.prixM2 !== null) return { ...p, prixM2: p.prixM2 }
    // chercher avant et après
    lastKnown = rawPoints.slice(0, i).reverse().find(x => x.prixM2 !== null)?.prixM2 ?? null
    nextKnown = rawPoints.slice(i + 1).find(x => x.prixM2 !== null)?.prixM2 ?? null
    if (lastKnown !== null && nextKnown !== null) return { ...p, prixM2: Math.round((lastKnown + nextKnown) / 2) }
    if (lastKnown !== null) return { ...p, prixM2: lastKnown }
    if (nextKnown !== null) return { ...p, prixM2: nextKnown }
    return null
  }).filter(Boolean) as DataPoint[]

  if (filled.length < 2) return NextResponse.json({ points: [] })
  return NextResponse.json({ points: filled })
}
