import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { api_key?: string; from_email?: string; from_name?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { api_key, from_email, from_name } = body
  if (!api_key || !from_email) return NextResponse.json({ error: 'api_key et from_email requis' }, { status: 400 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${from_name ?? 'Terranova'} <${from_email}>`,
      to: [user.email!],
      subject: 'Test de configuration email — Terranova',
      html: '<p>La configuration email fonctionne correctement.</p>',
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    return NextResponse.json({ ok: false, error: txt }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
