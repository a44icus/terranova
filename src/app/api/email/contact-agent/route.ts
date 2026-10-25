import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isEmailRateLimited, rateLimitKey } from '@/lib/emailRateLimit'
import {
  escHtml, escHtmlMultiline, isEmail, emailLayout, emailEyebrow, emailTitle, emailQuote,
  emailFields, emailMailto, emailButton, emailButtons, sendEmail, isEmailConfigured,
} from '@/lib/emails'
import { SITE_NAME } from '@/lib/site'

export async function POST(req: NextRequest) {
  // ── Authentification requise ───────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Rate limiting ──────────────────────────────────────────
  if (await isEmailRateLimited(rateLimitKey(req, user.id), 'contact-agent')) {
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

  // ── Envoi ─────────────────────────────────────────────────
  if (!(await isEmailConfigured())) {
    console.error('[contact-agent] aucune clé Resend (config admin ou RESEND_API_KEY)')
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
    const safeNom    = escHtml(nom.trim())
    const safeEmail  = escHtml(email.trim())

    if (agentEmail) {
      await sendEmail({
        to:      agentEmail,
        replyTo: email.trim(),
        subject: `Nouveau message de ${nom.trim()} via ${SITE_NAME}`,
        html: emailLayout({
          content: `
            ${emailEyebrow('Nouveau message')}
            ${emailTitle(`${safeNom} vous a écrit`)}
            <p style="margin:0 0 24px;font-size:13px;color:#64748B;">Via votre profil ${SITE_NAME} — ${escHtml(agent.agence || `${agent.prenom} ${agent.nom}`)}</p>
            ${emailQuote(escHtmlMultiline(message.trim()))}
            ${emailFields([
              ['Email',     emailMailto(email.trim())],
              ['Téléphone', typeof telephone === 'string' ? escHtml(telephone.trim()) : ''],
            ], 'Coordonnées')}
            ${emailButtons(emailButton(`mailto:${safeEmail}?subject=Re: votre message sur ${SITE_NAME}`, `Répondre à ${safeNom}`))}`,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact-agent]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
