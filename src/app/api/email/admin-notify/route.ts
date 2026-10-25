import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  escHtml, emailLayout, emailEyebrow, emailTitle, emailFields, emailMailto,
  emailButton, emailButtons, sendEmail, getAdminRecipients, isEmailConfigured,
} from '@/lib/emails'
import { SITE_NAME, SITE_URL } from '@/lib/site'

export async function POST(req: NextRequest) {
  // ── Authentification requise ───────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminList = getAdminRecipients()
  if (!adminList.length || !(await isEmailConfigured())) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bienId, titre, ville, type, prix, vendeurNom, vendeurEmail } = body

  // ── Vérifier que le bienId appartient bien à l'utilisateur authentifié ──
  if (bienId) {
    const admin = createAdminClient()
    const { data: bien } = await admin
      .from('biens')
      .select('user_id')
      .eq('id', String(bienId))
      .single()
    if (!bien || bien.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const safePrix = typeof prix === 'number'
    ? prix.toLocaleString('fr-FR') + (type === 'location' ? ' €/mois' : ' €')
    : ''
  const safeBienId = encodeURIComponent(String(bienId))

  const html = emailLayout({
    title: `Nouvelle annonce – ${SITE_NAME}`,
    content: `
      ${emailEyebrow('Nouvelle annonce soumise')}
      ${emailTitle(escHtml(titre))}
      ${emailFields([
        ['Type',    type === 'location' ? 'Location' : 'Vente'],
        ['Ville',   escHtml(ville)],
        ['Prix',    safePrix],
        ['Vendeur', `${escHtml(vendeurNom)} ${typeof vendeurEmail === 'string' ? emailMailto(vendeurEmail) : ''}`],
      ])}
      ${emailButtons(
        emailButton(`${SITE_URL}/admin/annonces`, 'Modérer l\'annonce →'),
        emailButton(`${SITE_URL}/annonce/${safeBienId}`, 'Voir l\'annonce', 'secondary'),
      )}`,
    footer: `${SITE_NAME} Admin — Notification automatique`,
  })

  const res = await sendEmail({
    to: adminList,
    subject: `📬 Nouvelle annonce : ${String(titre).slice(0, 80)}`,
    html,
  })

  return NextResponse.json({ ok: res.ok })
}
