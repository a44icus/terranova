import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Rate limiting en mémoire (par IP, par fenêtre de 60s) ────────────────────
// Pour une prod à fort trafic, remplacer par Redis/Upstash
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 30       // max événements par IP par fenêtre
const RATE_LIMIT_WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return true
  return false
}

// Nettoyage périodique pour éviter la fuite mémoire
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60_000)

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ─────────────────────────────────────────────────────
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // ── Validation des paramètres ─────────────────────────────────────────
    const body = await req.json()
    const { ad_id, event_type } = body

    if (
      typeof ad_id !== 'string' ||
      !ad_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ) {
      return NextResponse.json({ error: 'Invalid ad_id' }, { status: 400 })
    }

    if (!['impression', 'click'].includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── Vérification que la pub existe et est active ───────────────────────
    const { data: ad, error: adError } = await supabase
      .from('map_ads')
      .select('id')
      .eq('id', ad_id)
      .eq('actif', true)
      .maybeSingle()

    if (adError || !ad) {
      // On retourne 200 pour ne pas révéler quels IDs existent ou non
      return NextResponse.json({ ok: true })
    }

    // ── Déduplication côté serveur : 1 impression par (ad_id, ip, jour) ──
    if (event_type === 'impression') {
      const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
      const { count } = await supabase
        .from('map_ad_events')
        .select('id', { count: 'exact', head: true })
        .eq('ad_id', ad_id)
        .eq('event_type', 'impression')
        .eq('ip', ip)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)

      if ((count ?? 0) > 0) {
        return NextResponse.json({ ok: true }) // déjà compté aujourd'hui
      }
    }

    // ── Insertion ─────────────────────────────────────────────────────────
    await supabase.from('map_ad_events').insert({ ad_id, event_type, ip })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
