import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isEmailRateLimited, rateLimitKey } from '@/lib/emailRateLimit'
import {
  escHtml, escHtmlMultiline, isEmail, emailLayout, emailEyebrow, emailTitle, emailQuote,
  emailFields, emailMailto, emailButton, emailButtons, sendEmail, getAdminRecipients, isEmailConfigured,
} from '@/lib/emails'
import { SITE_NAME } from '@/lib/site'

export async function POST(req: NextRequest) {
  // ── Authentification requise ───────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (await isEmailRateLimited(rateLimitKey(req, user.id), 'publicite-contact')) {
    return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans une heure.' }, { status: 429 })
  }

  const adminList = getAdminRecipients()
  if (!adminList.length || !(await isEmailConfigured())) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { nom, email, telephone, societe, format, zone, message } = body

  const html = emailLayout({
    content: `
      ${emailEyebrow('Demande de publicité')}
      ${emailTitle(`${escHtml(nom)}${escHtml(societe) ? ` — ${escHtml(societe)}` : ''}`)}
      ${emailFields([
        ['Email',  isEmail(email) ? emailMailto(email) : ''],
        ['Tél',    escHtml(telephone)],
        ['Format', escHtml(format)],
        ['Zone',   escHtml(zone)],
      ])}
      ${emailQuote(escHtmlMultiline(message))}
      ${isEmail(email) ? emailButtons(emailButton(`mailto:${escHtml(email)}`, 'Répondre →')) : ''}`,
    footer: `${SITE_NAME} — Demande de publicité carte`,
  })

  const res = await sendEmail({
    to: adminList,
    replyTo: isEmail(email) ? email : undefined,
    subject: `📍 Demande de pub carte — ${String(nom).slice(0, 60)}`,
    html,
  })

  return NextResponse.json({ ok: res.ok })
}
