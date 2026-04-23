import { NextRequest, NextResponse } from 'next/server'

function escHtml(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAILS   = process.env.ADMIN_EMAILS ?? ''
  const BASE_URL       = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

  if (!RESEND_API_KEY || !ADMIN_EMAILS) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bienId, titre, ville, type, prix, vendeurNom, vendeurEmail } = body

  const safeTitre       = escHtml(titre)
  const safeVille       = escHtml(ville)
  const safeType        = type === 'location' ? 'Location' : 'Vente'
  const safePrix        = typeof prix === 'number'
    ? prix.toLocaleString('fr-FR') + (type === 'location' ? ' €/mois' : ' €')
    : ''
  const safeVendeurNom  = escHtml(vendeurNom)
  const safeVendeurEmail = escHtml(vendeurEmail)
  const safeBienId      = encodeURIComponent(String(bienId))

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><title>Nouvelle annonce – Terranova</title></head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E0DB;">
        <tr>
          <td style="background:#0F172A;padding:24px 32px;">
            <span style="font-family:Georgia,serif;font-size:24px;color:#FFFFFF;letter-spacing:0.04em;">
              Terra<span style="color:#4F46E5;font-style:italic;">nova</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 6px;font-size:13px;color:#64748B;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">
              Nouvelle annonce soumise
            </p>
            <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#0F172A;line-height:1.3;">
              ${safeTitre}
            </h1>

            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background:#F8F7F5;border-radius:8px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr><td style="padding-bottom:6px;">
                      <span style="font-size:13px;color:#64748B;">Type&nbsp;&nbsp;</span>
                      <span style="font-size:13px;color:#0F172A;font-weight:600;">${safeType}</span>
                    </td></tr>
                    <tr><td style="padding-bottom:6px;">
                      <span style="font-size:13px;color:#64748B;">Ville&nbsp;&nbsp;</span>
                      <span style="font-size:13px;color:#0F172A;font-weight:600;">${safeVille}</span>
                    </td></tr>
                    <tr><td style="padding-bottom:6px;">
                      <span style="font-size:13px;color:#64748B;">Prix&nbsp;&nbsp;</span>
                      <span style="font-size:13px;color:#4F46E5;font-weight:700;">${safePrix}</span>
                    </td></tr>
                    <tr><td style="padding-bottom:6px;">
                      <span style="font-size:13px;color:#64748B;">Vendeur&nbsp;&nbsp;</span>
                      <span style="font-size:13px;color:#0F172A;font-weight:600;">${safeVendeurNom}</span>
                      <a href="mailto:${safeVendeurEmail}"
                        style="font-size:12px;color:#4F46E5;text-decoration:none;margin-left:8px;">${safeVendeurEmail}</a>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#4F46E5;border-radius:10px;">
                  <a href="${BASE_URL}/admin/annonces"
                    style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">
                    Modérer l'annonce →
                  </a>
                </td>
                <td style="width:12px;"></td>
                <td style="border:1px solid #E2E0DB;border-radius:10px;">
                  <a href="${BASE_URL}/annonce/${safeBienId}"
                    style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:500;color:#0F172A;text-decoration:none;border-radius:10px;">
                    Voir l'annonce
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#F8F7F5;padding:20px 32px;border-top:1px solid #E2E0DB;">
            <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
              Terranova Admin — Notification automatique
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const adminList = ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Terranova <notifications@terranova.fr>',
      to: adminList,
      subject: `📬 Nouvelle annonce : ${String(titre).slice(0, 80)}`,
      html,
    }),
  })

  if (!res.ok) console.error('[AdminNotif] Resend error:', res.status, await res.text())
  return NextResponse.json({ ok: res.ok })
}
