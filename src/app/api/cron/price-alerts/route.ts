import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkCronAuth } from '@/lib/cronAuth'
import {
  escHtml, emailLayout, emailEyebrow, emailTitle, emailButton, emailButtons, sendEmail, getDbEmailConfig,
} from '@/lib/emails'
import { SITE_NAME, SITE_URL } from '@/lib/site'

// GET pour Vercel Cron, POST pour les appels externes
export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  // Protection par secret (Authorization: Bearer pour Vercel Cron, ou x-cron-secret)
  const refus = checkCronAuth(req, 'price-alerts')
  if (refus) return refus

  const admin = createAdminClient()

  // Config email saisie dans l'admin (/compte/admin/email)
  const config = await getDbEmailConfig()
  if (!config?.enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'email non configuré' })
  }

  // Récupérer les alertes non envoyées
  const { data: queue } = await admin
    .from('prix_alerts_queue')
    .select('id, bien_id, user_id, ancien_prix, nouveau_prix')
    .eq('sent', false)
    .order('created_at', { ascending: true })
    .limit(50)

  if (!queue?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  const errors: string[] = []

  for (const alert of queue) {
    // Récupérer email de l'utilisateur via auth.users (admin client)
    const { data: userData } = await admin.auth.admin.getUserById(alert.user_id)
    const userEmail = userData?.user?.email
    if (!userEmail) continue

    // Récupérer les infos du bien
    const { data: bien } = await admin
      .from('biens')
      .select('titre, ville, categorie')
      .eq('id', alert.bien_id)
      .single()
    if (!bien) continue

    const baisse = Math.round(((alert.ancien_prix - alert.nouveau_prix) / alert.ancien_prix) * 100)
    const safeTitre = escHtml(bien.titre)
    const safeVille = escHtml(bien.ville)
    const ancienFormate = Number(alert.ancien_prix).toLocaleString('fr-FR')
    const nouveauFormate = Number(alert.nouveau_prix).toLocaleString('fr-FR')

    const html = emailLayout({
      content: `
        ${emailEyebrow('Baisse de prix')}
        ${emailTitle('Un bien en favori a baissé de prix !')}
        <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0F172A;">${safeTitre}</p>
          <p style="margin:0 0 16px;font-size:13px;color:#64748B;">${safeVille}</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:20px;">
                <p style="margin:0;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Ancien prix</p>
                <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#64748B;text-decoration:line-through;">${ancienFormate} €</p>
              </td>
              <td style="padding-right:20px;font-size:20px;color:#4F46E5;">→</td>
              <td>
                <p style="margin:0;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Nouveau prix</p>
                <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#4F46E5;">${nouveauFormate} €</p>
              </td>
              <td style="padding-left:20px;">
                <span style="background:#4F46E5;color:#FFF;font-size:13px;font-weight:700;padding:4px 10px;border-radius:20px;">−${baisse}%</span>
              </td>
            </tr>
          </table>
        </div>
        ${emailButtons(
          emailButton(`${SITE_URL}/annonce/${encodeURIComponent(alert.bien_id)}`, 'Voir l\'annonce'),
          emailButton(`${SITE_URL}/compte/favoris`, 'Mes favoris', 'secondary'),
        )}`,
      footer: `${SITE_NAME} · Vous recevez cet email car ce bien est dans vos favoris.`,
    })

    const res = await sendEmail({
      apiKey:  config.apiKey,
      from:    config.from,
      to:      userEmail,
      subject: `Prix en baisse − ${bien.titre.slice(0, 80)}`,
      html,
    })

    if (res.ok) {
      await admin.from('prix_alerts_queue')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', alert.id)
      sent++
    } else {
      errors.push(`alert ${alert.id}: ${res.error ?? 'échec'}`)
    }
  }

  return NextResponse.json({ ok: true, sent, errors })
}
