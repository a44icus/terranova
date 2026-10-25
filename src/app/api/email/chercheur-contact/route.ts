import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isEmailRateLimited, rateLimitKey } from '@/lib/emailRateLimit'
import {
  escHtml, escHtmlMultiline, isEmail, emailLayout, emailEyebrow, emailTitle, emailQuote,
  emailFields, emailMailto, emailButton, emailButtons, sendEmail,
} from '@/lib/emails'
import { SITE_NAME, SITE_URL } from '@/lib/site'

export async function POST(req: NextRequest) {
  // ── Authentification requise ───────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (await isEmailRateLimited(rateLimitKey(req, user.id), 'chercheur-contact')) {
    return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans une heure.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { chercheurId, vendeurNom, vendeurEmail, vendeurTel, message } = body

  if (typeof chercheurId !== 'string') return NextResponse.json({ error: 'chercheurId requis' }, { status: 400 })
  if (typeof vendeurNom !== 'string' || vendeurNom.trim().length === 0 || vendeurNom.length > 120)
    return NextResponse.json({ error: 'vendeurNom invalide' }, { status: 400 })
  if (!isEmail(vendeurEmail)) return NextResponse.json({ error: 'vendeurEmail invalide' }, { status: 400 })
  if (typeof message !== 'string' || message.trim().length === 0 || message.length > 2000)
    return NextResponse.json({ error: 'message invalide' }, { status: 400 })
  if (vendeurTel !== undefined && vendeurTel !== '' && vendeurTel !== null) {
    if (typeof vendeurTel !== 'string' || vendeurTel.length > 30 || !/^[\d\s\+\-\(\)\.]+$/.test(vendeurTel))
      return NextResponse.json({ error: 'vendeurTel invalide' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Récupérer l'email du chercheur + vérifier que sa fiche est active
  const { data: recherche } = await admin
    .from('recherches')
    .select('actif, user_id')
    .eq('user_id', chercheurId)
    .eq('actif', true)
    .single()

  if (!recherche) return NextResponse.json({ error: 'Chercheur introuvable ou inactif' }, { status: 404 })

  const { data: userData } = await admin.auth.admin.getUserById(chercheurId)
  const chercheurEmail = userData?.user?.email
  if (!chercheurEmail) return NextResponse.json({ error: 'Email chercheur introuvable' }, { status: 500 })

  const { data: profile } = await admin
    .from('profiles')
    .select('prenom')
    .eq('id', chercheurId)
    .single()

  // Le contact est conservé dans la boîte du chercheur, que l'email parte ou non
  await admin.from('contacts_chercheurs').insert({
    chercheur_id:  chercheurId,
    vendeur_nom:   vendeurNom.trim(),
    vendeur_email: vendeurEmail.trim(),
    vendeur_tel:   typeof vendeurTel === 'string' && vendeurTel ? vendeurTel.trim() : null,
    message:       message.trim(),
  })

  const safeVendeurEmail = escHtml(vendeurEmail)

  const html = emailLayout({
    content: `
      ${emailEyebrow('Un vendeur vous contacte')}
      ${emailTitle(`Bonjour ${escHtml(profile?.prenom ?? 'vous')}, ${escHtml(vendeurNom)} a un bien pour vous !`)}
      ${emailQuote(escHtmlMultiline(message))}
      ${emailFields([
        ['Email',     emailMailto(vendeurEmail)],
        ['Téléphone', escHtml(vendeurTel)],
      ], 'Coordonnées du vendeur')}
      ${emailButtons(
        emailButton(`mailto:${safeVendeurEmail}?subject=Re: Votre bien sur ${SITE_NAME}`, 'Répondre'),
        emailButton(`${SITE_URL}/compte/chercheur`, 'Mon profil', 'secondary'),
      )}`,
    footer: `${SITE_NAME} · Vous recevez cet email car votre profil chercheur est actif.
      <a href="${SITE_URL}/compte/chercheur" style="color:#94A3B8;text-decoration:underline;">Désactiver</a>`,
  })

  const res = await sendEmail({
    to:      chercheurEmail,
    replyTo: vendeurEmail,
    subject: `${vendeurNom} a un bien pour vous — ${SITE_NAME}`,
    html,
  })

  if (res.skipped) return NextResponse.json({ ok: true, skipped: true })
  if (!res.ok)     return NextResponse.json({ ok: false, error: res.error })
  return NextResponse.json({ ok: true })
}
