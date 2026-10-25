import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { emailLayout, emailTitle, sendEmail } from '@/lib/emails'
import { SITE_NAME } from '@/lib/site'

export async function POST(req: NextRequest) {
  // Même définition d'admin que le reste du site (app_metadata + ADMIN_EMAILS),
  // et non profiles.is_admin qu'une politique RLS trop large rendrait modifiable.
  const user = await requireAdminApi()
  if (user instanceof NextResponse) return user

  let body: { api_key?: string; from_email?: string; from_name?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { api_key, from_email, from_name } = body
  if (!api_key || !from_email) return NextResponse.json({ error: 'api_key et from_email requis' }, { status: 400 })

  const res = await sendEmail({
    apiKey: api_key,
    from: `${from_name || SITE_NAME} <${from_email}>`,
    to: user.email!,
    subject: `Test de configuration email — ${SITE_NAME}`,
    html: emailLayout({
      content: `${emailTitle('Test réussi')}<p style="margin:0;font-size:14px;color:#334155;">La configuration email fonctionne correctement.</p>`,
    }),
  })

  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 200 })
  return NextResponse.json({ ok: true })
}
