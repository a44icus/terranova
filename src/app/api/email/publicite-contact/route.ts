import { NextRequest, NextResponse } from 'next/server'
import { isEmailRateLimited, getClientIp } from '@/lib/emailRateLimit'

function escHtml(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (await isEmailRateLimited(ip, 'publicite-contact')) {
    return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans une heure.' }, { status: 429 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAILS   = process.env.ADMIN_EMAILS ?? ''
  if (!RESEND_API_KEY || !ADMIN_EMAILS) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  let body: Record<string, string>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { nom, email, telephone, societe, format, zone, message } = body

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E0DB;">
        <tr><td style="background:#0F172A;padding:24px 32px;">
          <span style="font-family:Georgia,serif;font-size:24px;color:#FFFFFF;">
            Terra<span style="color:#4F46E5;font-style:italic;">nova</span>
          </span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px;font-size:13px;color:#64748B;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;">Demande de publicité</p>
          <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#0F172A;">
            ${escHtml(nom)}${escHtml(societe) ? ` — ${escHtml(societe)}` : ''}
          </h1>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
            <tr><td style="padding:12px 16px;background:#F8F7F5;border-radius:8px;">
              <table cellpadding="0" cellspacing="0">
                ${[
                  ['Email',   email],
                  ['Tél',     telephone],
                  ['Format',  format],
                  ['Zone',    zone],
                ].filter(r => r[1]).map(([l, v]) => `
                <tr><td style="padding-bottom:6px;">
                  <span style="font-size:13px;color:#64748B;">${l}&nbsp;&nbsp;</span>
                  <span style="font-size:13px;color:#0F172A;font-weight:600;">${escHtml(v)}</span>
                </td></tr>`).join('')}
              </table>
            </td></tr>
          </table>
          <div style="background:#F8F7F5;border-left:3px solid #4F46E5;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;font-style:italic;">
              ${escHtml(message).replace(/\n/g, '<br/>')}
            </p>
          </div>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#4F46E5;border-radius:10px;">
                <a href="mailto:${escHtml(email)}"
                  style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">
                  Répondre →
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#F8F7F5;padding:20px 32px;border-top:1px solid #E2E0DB;">
          <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">Terranova — Demande de publicité carte</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const adminList = ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Terranova <notifications@terranova.fr>',
      to: adminList,
      reply_to: email,
      subject: `📍 Demande de pub carte — ${String(nom).slice(0, 60)}`,
      html,
    }),
  })

  if (!res.ok) console.error('[PubliciteContact] Resend error:', await res.text())
  return NextResponse.json({ ok: res.ok })
}
