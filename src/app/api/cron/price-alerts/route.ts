import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function escHtml(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export async function POST(req: NextRequest) {
  // Protection par secret header (à configurer dans Vercel Cron ou appel manuel)
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Lire la config email
  const { data: config } = await admin
    .from('email_config')
    .select('api_key, from_email, from_name, enabled')
    .eq('id', 1)
    .single()

  if (!config?.enabled || !config.api_key) {
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'
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

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
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
            <p style="margin:0 0 8px;font-size:13px;color:#64748B;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Baisse de prix</p>
            <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#0F172A;line-height:1.3;">
              Un bien en favori a baissé de prix !
            </h1>
            <div style="background:#FFF7F5;border:1px solid #F4C6B2;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1A1A18;">${safeTitre}</p>
              <p style="margin:0 0 16px;font-size:13px;color:#64748B;">${safeVille}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:20px;">
                    <p style="margin:0;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Ancien prix</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#64748B;text-decoration:line-through;">${ancienFormate} €</p>
                  </td>
                  <td style="padding-right:20px;font-size:20px;color:#C8602A;">→</td>
                  <td>
                    <p style="margin:0;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Nouveau prix</p>
                    <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#C8602A;">${nouveauFormate} €</p>
                  </td>
                  <td style="padding-left:20px;">
                    <span style="background:#C8602A;color:#FFF;font-size:13px;font-weight:700;padding:4px 10px;border-radius:20px;">−${baisse}%</span>
                  </td>
                </tr>
              </table>
            </div>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C8602A;border-radius:10px;">
                  <a href="${baseUrl}/annonce/${encodeURIComponent(alert.bien_id)}"
                    style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">
                    Voir l'annonce
                  </a>
                </td>
                <td style="width:12px;"></td>
                <td style="border:1px solid #E2E0DB;border-radius:10px;">
                  <a href="${baseUrl}/compte/favoris"
                    style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:500;color:#0F172A;text-decoration:none;border-radius:10px;">
                    Mes favoris
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#F8F7F5;padding:16px 32px;border-top:1px solid #E2E0DB;">
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
              Terranova · Vous recevez cet email car ce bien est dans vos favoris.
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
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.from_name} <${config.from_email}>`,
        to: [userEmail],
        subject: `Prix en baisse − ${bien.titre.slice(0, 80)}`,
        html,
      }),
    })

    if (res.ok) {
      await admin.from('prix_alerts_queue')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', alert.id)
      sent++
    } else {
      errors.push(`alert ${alert.id}: ${res.status}`)
    }
  }

  return NextResponse.json({ ok: true, sent, errors })
}
