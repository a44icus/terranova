import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { vendeurEmail, vendeurNom, acheteurNom, acheteurEmail, acheteurTel, message, bienTitre, bienId } =
    await req.json()

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY manquant, email non envoyé')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau message – Terranova</title>
</head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E0DB;">
          <!-- Header -->
          <tr>
            <td style="background:#0F172A;padding:24px 32px;">
              <span style="font-family:Georgia,serif;font-size:24px;color:#FFFFFF;letter-spacing:0.04em;">
                Terra<span style="color:#4F46E5;font-style:italic;">nova</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 8px;font-size:13px;color:#64748B;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">
                Nouveau message reçu
              </p>
              <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#0F172A;line-height:1.3;">
                ${acheteurNom} vous a contacté
              </h1>

              <p style="margin:0 0 6px;font-size:13px;color:#94A3B8;">
                À propos de votre annonce
              </p>
              <p style="margin:0 0 24px;font-size:14px;font-weight:600;color:#4F46E5;">
                ${bienTitre}
              </p>

              <!-- Message block -->
              <div style="background:#F8F7F5;border-left:3px solid #4F46E5;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;font-style:italic;">
                  ${message.replace(/\n/g, '<br/>')}
                </p>
              </div>

              <!-- Coordonnées -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                <tr>
                  <td style="padding-bottom:10px;">
                    <span style="font-size:12px;color:#94A3B8;font-weight:500;text-transform:uppercase;letter-spacing:0.06em;">Coordonnées</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#F8F7F5;border-radius:8px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:6px;">
                          <span style="font-size:13px;color:#64748B;">Email&nbsp;&nbsp;</span>
                          <a href="mailto:${acheteurEmail}" style="font-size:13px;color:#4F46E5;text-decoration:none;font-weight:500;">${acheteurEmail}</a>
                        </td>
                      </tr>
                      ${acheteurTel ? `<tr><td><span style="font-size:13px;color:#64748B;">Téléphone&nbsp;&nbsp;</span><span style="font-size:13px;color:#0F172A;font-weight:500;">${acheteurTel}</span></td></tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4F46E5;border-radius:10px;">
                    <a href="mailto:${acheteurEmail}?subject=Re: ${encodeURIComponent(bienTitre)}"
                      style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;letter-spacing:0.02em;">
                      Répondre par email
                    </a>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="border:1px solid #E2E0DB;border-radius:10px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'}/compte/messages"
                      style="display:inline-block;padding:11px 20px;font-size:13px;font-weight:500;color:#0F172A;text-decoration:none;border-radius:10px;">
                      Voir mes messages
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8F7F5;padding:20px 32px;border-top:1px solid #E2E0DB;">
              <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
                Terranova — Plateforme immobilière &nbsp;·&nbsp;
                <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'}/annonce/${bienId}"
                  style="color:#94A3B8;text-decoration:underline;">Voir l'annonce</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Terranova <notifications@terranova.fr>',
      to: [vendeurEmail],
      subject: `Nouveau message pour "${bienTitre}"`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[Email] Resend error:', res.status, body)
  }

  return NextResponse.json({ ok: res.ok })
}
