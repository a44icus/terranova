/**
 * Cron — Alertes nouveaux biens
 *
 * À appeler toutes les heures (Vercel Cron ou appel HTTP avec CRON_SECRET).
 * Cherche les biens publiés dans la dernière heure, les compare aux alertes actives
 * et envoie des emails aux abonnés qui ont un match.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function escHtml(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  /* Config email */
  const { data: config } = await admin
    .from('email_config')
    .select('api_key, from_email, from_name, enabled')
    .eq('id', 1)
    .single()

  if (!config?.enabled || !config.api_key) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'email non configuré' })
  }

  /* Biens publiés dans la dernière heure */
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: nouveauxBiens } = await admin
    .from('biens')
    .select('id, titre, ville, code_postal, type, categorie, prix, surface, pieces, photo_url')
    .eq('statut', 'publie')
    .gte('publie_at', since)

  if (!nouveauxBiens?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'aucun nouveau bien' })
  }

  /* Alertes actives */
  const { data: alertes } = await admin
    .from('alertes')
    .select('*')
    .eq('active', true)

  if (!alertes?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'aucune alerte active' })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'
  let sent = 0

  for (const alerte of alertes) {
    /* Biens qui matchent CETTE alerte */
    const matches = nouveauxBiens.filter(b => {
      if (alerte.type     && alerte.type     !== b.type)     return false
      if (alerte.categorie && alerte.categorie !== b.categorie) return false
      if (alerte.ville    && !b.ville.toLowerCase().includes(alerte.ville.toLowerCase())) return false
      if (alerte.prix_max && b.prix > alerte.prix_max)        return false
      if (alerte.surface_min && b.surface && b.surface < alerte.surface_min) return false
      return true
    })

    if (!matches.length) continue

    /* Construire les cartes HTML */
    const cards = matches.map(b => {
      const prixLabel = b.type === 'location'
        ? `${b.prix.toLocaleString('fr-FR')} €/mois`
        : b.prix >= 1_000_000
          ? `${(b.prix / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} M€`
          : `${b.prix.toLocaleString('fr-FR')} €`

      const imgTag = b.photo_url
        ? `<img src="${escHtml(b.photo_url)}" alt="" width="100%" style="height:160px;object-fit:cover;display:block;">`
        : `<div style="height:80px;background:#E8E5E0;display:flex;align-items:center;justify-content:center;font-size:28px;">🏠</div>`

      return `
        <div style="border:1px solid #E2E0DB;border-radius:12px;overflow:hidden;margin-bottom:16px;">
          ${imgTag}
          <div style="padding:16px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0F172A;font-family:Georgia,serif;">${prixLabel}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#0F172A;">${escHtml(b.titre)}</p>
            <p style="margin:0 0 12px;font-size:12px;color:#64748B;">📍 ${escHtml(b.ville)} ${escHtml(b.code_postal ?? '')}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
              ${b.surface ? `<span style="background:#F1F5F9;border-radius:6px;padding:3px 8px;font-size:11px;color:#64748B;">${b.surface} m²</span>` : ''}
              ${b.pieces  ? `<span style="background:#F1F5F9;border-radius:6px;padding:3px 8px;font-size:11px;color:#64748B;">${b.pieces} pièces</span>` : ''}
              <span style="background:${b.type === 'vente' ? '#EDE9FE' : '#E0F2FE'};color:${b.type === 'vente' ? '#4F46E5' : '#0891B2'};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;">${b.type === 'vente' ? 'Vente' : 'Location'}</span>
            </div>
            <a href="${baseUrl}/annonce/${b.id}" style="display:inline-block;background:#4F46E5;color:#FFF;font-size:12px;font-weight:600;padding:8px 16px;border-radius:8px;text-decoration:none;">
              Voir l'annonce →
            </a>
          </div>
        </div>`
    }).join('')

    const nbLabel = matches.length === 1 ? '1 nouveau bien correspond' : `${matches.length} nouveaux biens correspondent`

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E0DB;">
        <tr>
          <td style="background:#0F172A;padding:24px 32px;">
            <span style="font-family:Georgia,serif;font-size:24px;color:#FFFFFF;letter-spacing:0.04em;">
              Terra<span style="color:#818CF8;font-style:italic;">nova</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748B;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Alerte nouveaux biens</p>
            <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;color:#0F172A;line-height:1.3;">
              🔔 ${nbLabel} à votre alerte
            </h1>
            <p style="margin:0 0 24px;font-size:13px;color:#64748B;">
              Critères : ${[
                alerte.type && (alerte.type === 'vente' ? 'Vente' : 'Location'),
                alerte.categorie,
                alerte.ville,
                alerte.prix_max && `max ${alerte.prix_max.toLocaleString('fr-FR')} €`,
                alerte.surface_min && `min ${alerte.surface_min} m²`,
              ].filter(Boolean).join(' · ') || 'Tous les biens'}
            </p>
            ${cards}
            <hr style="border:none;border-top:1px solid #E2E0DB;margin:24px 0;">
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
              Terranova · <a href="${baseUrl}/compte/alertes" style="color:#4F46E5;text-decoration:none;">Gérer mes alertes</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const criteresLabel = [
      alerte.type && (alerte.type === 'vente' ? 'Vente' : 'Location'),
      alerte.ville,
    ].filter(Boolean).join(' ')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.from_name} <${config.from_email}>`,
        to:   [alerte.email],
        subject: `🏠 ${nbLabel} — ${criteresLabel || 'Terranova'}`,
        html,
      }),
    })

    if (res.ok) {
      await admin.from('alertes')
        .update({ derniere_notif_at: new Date().toISOString() })
        .eq('id', alerte.id)
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent, biens: nouveauxBiens.length })
}
