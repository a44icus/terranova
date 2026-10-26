import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isEmailRateLimited, rateLimitKey } from '@/lib/emailRateLimit'
import {
  escHtml, escHtmlMultiline, isEmail, emailLayout, emailEyebrow, emailTitle, emailQuote,
  emailFields, emailMailto, emailButton, emailButtons, sendEmail,
} from '@/lib/emails'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDroits } from '@/lib/droits'

export async function POST(req: NextRequest) {
  // ── 1. Authentification obligatoire ───────────────────────────────────────
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},           // lecture seule ici
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 1b. Rate limiting (par utilisateur) ───────────────────────────────────
  if (await isEmailRateLimited(rateLimitKey(req, user.id), 'contact')) {
    return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans une heure.' }, { status: 429 })
  }

  // ── 2. Validation stricte des champs ──────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Le destinataire n'est jamais fourni par le navigateur : il est déduit du bien,
  // sinon cette route permettrait d'envoyer des emails depuis notre domaine à n'importe qui.
  const { acheteurNom, acheteurEmail, acheteurTel, message, bienId } = body

  if (!isEmail(acheteurEmail))  return NextResponse.json({ error: 'acheteurEmail invalide' }, { status: 400 })

  // L'email expéditeur doit correspondre à l'utilisateur connecté
  if (acheteurEmail.toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (typeof message    !== 'string' || message.trim().length    === 0 || message.length    > 4000)
    return NextResponse.json({ error: 'message invalide' },    { status: 400 })
  if (typeof acheteurNom !== 'string' || acheteurNom.trim().length === 0 || acheteurNom.length > 120)
    return NextResponse.json({ error: 'acheteurNom invalide' }, { status: 400 })
  if (typeof bienId !== 'string' && typeof bienId !== 'number')
    return NextResponse.json({ error: 'bienId invalide' },     { status: 400 })
  if (acheteurTel !== undefined && acheteurTel !== null && acheteurTel !== '') {
    if (typeof acheteurTel !== 'string' || acheteurTel.length > 30 || !/^[\d\s\+\-\(\)\.]+$/.test(acheteurTel))
      return NextResponse.json({ error: 'acheteurTel invalide' }, { status: 400 })
  }

  // ── 3. Bien et vendeur ────────────────────────────────────────────────────
  const admin = createAdminClient()
  const { data: bien } = await admin
    .from('biens').select('titre, user_id, statut').eq('id', String(bienId)).maybeSingle()
  if (!bien || bien.statut !== 'publie') return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  if (!(await getDroits(bien.user_id)).a('messagerie'))
    return NextResponse.json({ error: 'Contact indisponible pour cette annonce' }, { status: 403 })
  const { data: vendeurAuth } = await admin.auth.admin.getUserById(bien.user_id)
  const vendeurEmail = vendeurAuth?.user?.email
  if (!vendeurEmail) return NextResponse.json({ ok: true, skipped: true })
  const bienTitre: string = bien.titre

  // ── 4. Email ──────────────────────────────────────────────────────────────
  const safeAcheteurEmail = escHtml(acheteurEmail)
  const safeBienId        = encodeURIComponent(String(bienId))
  const safeTitreEnc      = encodeURIComponent(bienTitre)

  const html = emailLayout({
    title: `Nouveau message – ${SITE_NAME}`,
    content: `
      ${emailEyebrow('Nouveau message reçu')}
      ${emailTitle(`${escHtml(acheteurNom)} vous a contacté`)}
      <p style="margin:0 0 6px;font-size:13px;color:#94A3B8;">À propos de votre annonce</p>
      <p style="margin:0 0 24px;font-size:14px;font-weight:600;color:#4F46E5;">${escHtml(bienTitre)}</p>
      ${emailQuote(escHtmlMultiline(message))}
      ${emailFields([
        ['Email',     emailMailto(acheteurEmail)],
        ['Téléphone', escHtml(acheteurTel)],
      ], 'Coordonnées')}
      ${emailButtons(
        emailButton(`mailto:${safeAcheteurEmail}?subject=Re: ${safeTitreEnc}`, 'Répondre par email'),
        emailButton(`${SITE_URL}/compte/messages`, 'Voir mes messages', 'secondary'),
      )}`,
    footer: `${SITE_NAME} — Plateforme immobilière &nbsp;·&nbsp;
      <a href="${SITE_URL}/annonce/${safeBienId}" style="color:#94A3B8;text-decoration:underline;">Voir l'annonce</a>`,
  })

  const res = await sendEmail({
    to: vendeurEmail,
    replyTo: acheteurEmail,
    subject: `Nouveau message pour "${bienTitre.slice(0, 100)}"`,
    html,
  })

  if (res.skipped) return NextResponse.json({ ok: true, skipped: true })
  return NextResponse.json({ ok: res.ok })
}
