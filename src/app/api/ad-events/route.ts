import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Détection de bots par User-Agent ─────────────────────────────────────────
const BOT_PATTERN = /bot|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discord|applebot|googlebot|yandex|baidu|duckduck|semrush|ahrefs|moz|screaming|sitebulb|wget|curl|python|java|go-http|axios|node-fetch/i

function isBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.length < 10) return true
  return BOT_PATTERN.test(userAgent)
}

// ── Rate limiting DB-based : 1 requête par (ip, fenêtre 60s) ─────────────────
// Fiable sur Vercel serverless contrairement au rate limiting en mémoire
async function isRateLimited(supabase: any, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString()
  const { count } = await supabase
    .from('map_ad_events')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since)
  return (count ?? 0) >= 30
}

// ── Déduplication : 1 événement par (ad_id, ip, type, jour) ──────────────────
async function alreadyTracked(supabase: any, ad_id: string, ip: string, event_type: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  const { count } = await supabase
    .from('map_ad_events')
    .select('id', { count: 'exact', head: true })
    .eq('ad_id', ad_id)
    .eq('event_type', event_type)
    .eq('ip', ip)
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`)
  return (count ?? 0) > 0
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get('user-agent')
    if (isBot(ua)) return NextResponse.json({ ok: true })

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

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

    if (await isRateLimited(supabase, ip)) {
      return NextResponse.json({ ok: true })
    }

    const { data: ad } = await supabase
      .from('map_ads')
      .select('id')
      .eq('id', ad_id)
      .eq('actif', true)
      .maybeSingle()

    if (!ad) return NextResponse.json({ ok: true })

    if (await alreadyTracked(supabase, ad_id, ip, event_type)) {
      return NextResponse.json({ ok: true })
    }

    await supabase.from('map_ad_events').insert({ ad_id, event_type, ip })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
