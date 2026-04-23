import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function escHtml(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
}

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254
}

export async function POST(req: NextRequest) {
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
    if (typeof vendeurTel !== 'string' || vendeurTel.length > 30 || !/^[\d\s\+\-\(\)\.]+$/.test(vendeurTel as string))
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

  // Lire config email
  const { data: emailConfig } = await admin
    .from('email_config')
    .select('api_key, from_email, from_name, enabled')
    .eq('id', 1)
    .single()

  // Utiliser env var de fallback si DB non configurée
  const apiKey = emailConfig?.api_key || process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[Email] RESEND_API_KEY manquant, email chercheur non envoyé')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const fromEmail = emailConfig?.from_email ?? 'notifications@terranova.fr'
  const fromName = emailConfig?.from_name ?? 'Terranova'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

  const safeVendeurNom  = escHtml(vendeurNom)
  const safeVendeurEmail = escHtml(vendeurEmail)
  const safeVendeurTel  = escHtml(vendeurTel)
  const safeMessage     = escHtml(message).replace(/\n/g, '<br/>')
  const safeChercheurPrenom = escHtml(profile?.prenom ?? 'vous')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E0DB;">
        <tr>
          <td style="background:#1A1A18;padding:24px 32px;">
            <span style="font-family:Georgia,serif;font-size:24px;color:#FFFFFF;letter-spacing:0.04em;">
              Terra<span style="color:#C8602A;font-style:italic;">nova</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748B;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Un vendeur vous contacte</p>
            <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#0F172A;line-height:1.3;">
              Bonjour ${safeChercheurPrenom}, ${safeVendeurNom} a un bien pour vous !
            </h1>
            <div style="background:#F8F7F5;border-left:3px solid #C8602A;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;font-style:italic;">${safeMessage}</p>
            </div>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
              <tr><td style="padding-bottom:10px;">
                <span style="font-size:12px;color:#94A3B8;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;">Coordonnées du vendeur</span>
              </td></tr>
              <tr><td style="padding:12px 16px;background:#F8F7F5;border-radius:8px;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:13px;color:#64748B;">Email&nbsp;&nbsp;</span>
                    <a href="mailto:${safeVendeurEmail}" style="font-size:13px;color:#C8602A;text-decoration:none;font-weight:500;">${safeVendeurEmail}</a>
                  </td></tr>
                  ${safeVendeurTel ? `<tr><td><span style="font-size:13px;color:#64748B;">Téléphone&nbsp;&nbsp;</span><span style="font-size:13px;color:#0F172A;font-weight:500;">${safeVendeurTel}</span></td></tr>` : ''}
                </table>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="background:#C8602A;border-radius:10px;">
                <a href="mailto:${safeVendeurEmail}?subject=Re: Votre bien sur Terranova"
                  style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">
                  Répondre
                </a>
              </td>
              <td style="width:12px;"></td>
              <td style="border:1px solid #E2E0DB;border-radius:10px;">
                <a href="${baseUrl}/compte/chercheur"
                  style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:500;color:#0F172A;text-decoration:none;border-radius:10px;">
                  Mon profil
                </a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background:#F8F7F5;padding:16px 32px;border-top:1px solid #E2E0DB;">
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
              Terranova · Vous recevez cet email car votre profil chercheur est actif.
              <a href="${baseUrl}/compte/chercheur" style="color:#94A3B8;text-decoration:underline;">Désactiver</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [chercheurEmail],
      reply_to: vendeurEmail as string,
      subject: `${vendeurNom} a un bien pour vous — Terranova`,
      html,
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    console.error('[Email] chercheur-contact error:', res.status, txt)
    return NextResponse.json({ ok: false, error: txt })
  }

  return NextResponse.json({ ok: true })
}
