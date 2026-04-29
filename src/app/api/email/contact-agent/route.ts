import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isEmailRateLimited, getClientIp } from '@/lib/emailRateLimit'

function escHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────
  const ip = getClientIp(req)
  if (await isEmailRateLimited(ip, 'contact-agent')) {
    return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans une heure.' }, { status: 429 })
  }

  // ── Validation ────────────────────────────────────────────
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId, nom, email, telephone, message } = body

  if (typeof agentId !== 'string' || !agentId)
    return NextResponse.json({ error: 'agentId requis' }, { status: 400 })
  if (typeof nom !== 'string' || nom.trim().length === 0 || nom.length > 100)
    return NextResponse.json({ error: 'nom invalide' }, { status: 400 })
  if (!isEmail(email))
    return NextResponse.json({ error: 'email invalide' }, { status: 400 })
  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 2000)
    return NextResponse.json({ error: 'message invalide' }, { status: 400 })
  if (telephone !== undefined && telephone !== null && telephone !== '') {
    if (typeof telephone !== 'string' || telephone.length > 20 || !/^[\d\s\+\-\(\)\.]+$/.test(telephone))
      return NextResponse.json({ error: 'telephone invalide' }, { status: 400 })
  }

  const safeNom     = escHtml(nom.trim())
  const safeEmail   = escHtml((email as string).trim())
  const safeTel     = telephone ? escHtml((telephone as string).trim()) : ''
  const safeMessage = escHtml(message.trim()).replace(/\n/g, '<br/>')

  // ── Envoi ─────────────────────────────────────────────────
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('[contact-agent] RESEND_API_KEY manquant')
    return NextResponse.json({ error: 'Service email non configuré' }, { status: 500 })
  }

  try {
    const admin = createAdminClient()
    const [{ data: agent }, { data: userData }] = await Promise.all([
      admin.from('profiles').select('prenom, nom, agence').eq('id', agentId).single(),
      admin.auth.admin.getUserById(agentId),
    ])

    if (!agent) return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 })

    const agentEmail = userData.user?.email
    const agentName  = escHtml(agent.agence || `${agent.prenom} ${agent.nom}`)

    if (agentEmail) {
      const resend = new Resend(RESEND_API_KEY)
      await resend.emails.send({
        from:    'Terranova <noreply@terranova-beta.vercel.app>',
        to:      agentEmail,
        replyTo: (email as string).trim(),
        subject: `Nouveau message de ${nom.trim()} via Terranova`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0F172A">
            <h2 style="font-size:20px;margin-bottom:4px">Nouveau message</h2>
            <p style="color:#64748B;font-size:14px;margin-bottom:24px">Via votre profil Terranova — ${agentName}</p>
            <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:20px">
              <p style="margin:0 0 8px"><strong>De :</strong> ${safeNom}</p>
              <p style="margin:0 0 8px"><strong>Email :</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
              ${safeTel ? `<p style="margin:0 0 8px"><strong>Téléphone :</strong> ${safeTel}</p>` : ''}
              <p style="margin:0 0 4px"><strong>Message :</strong></p>
              <p style="margin:0;color:#334155">${safeMessage}</p>
            </div>
            <a href="mailto:${safeEmail}?subject=Re: votre message sur Terranova"
              style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Répondre à ${safeNom}
            </a>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[contact-agent]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
