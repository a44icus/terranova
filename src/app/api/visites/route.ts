import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  escHtml, escHtmlMultiline, isEmail, emailLayout, emailEyebrow, emailTitle, emailQuote,
  emailFields, emailMailto, emailButton, emailButtons, sendEmail, isEmailConfigured,
} from '@/lib/emails'
import { SITE_URL } from '@/lib/site'
import { isEmailRateLimited, rateLimitKey } from '@/lib/emailRateLimit'

function isDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

export async function POST(req: NextRequest) {
  if (await isEmailRateLimited(rateLimitKey(req), 'visites')) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une heure.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bienId, vendeurId, demandeurId, demandeurNom, demandeurEmail, demandeurTel, dateSouhaitee, creneau, message } = body

  if (typeof bienId    !== 'string' || !bienId)    return NextResponse.json({ error: 'bienId requis' }, { status: 400 })
  if (typeof vendeurId !== 'string' || !vendeurId) return NextResponse.json({ error: 'vendeurId requis' }, { status: 400 })
  if (typeof demandeurNom !== 'string' || demandeurNom.trim().length < 2 || demandeurNom.length > 100)
    return NextResponse.json({ error: 'nom invalide' }, { status: 400 })
  if (!isEmail(demandeurEmail))
    return NextResponse.json({ error: 'email invalide' }, { status: 400 })
  if (!isDate(dateSouhaitee))
    return NextResponse.json({ error: 'date invalide' }, { status: 400 })

  // Date dans le futur
  const d = new Date(dateSouhaitee)
  if (d <= new Date()) return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 })

  if (demandeurTel !== undefined && demandeurTel !== null && demandeurTel !== '') {
    if (typeof demandeurTel !== 'string' || demandeurTel.length > 20 || !/^[\d\s\+\-\(\)\.]+$/.test(demandeurTel as string))
      return NextResponse.json({ error: 'téléphone invalide' }, { status: 400 })
  }
  if (message !== undefined && message !== null && message !== '') {
    if (typeof message !== 'string' || message.length > 500)
      return NextResponse.json({ error: 'message trop long' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Vérifie que le bien existe et appartient au vendeur
  const { data: bien } = await admin
    .from('biens')
    .select('id, titre, ville, adresse')
    .eq('id', bienId)
    .eq('user_id', vendeurId)
    .eq('statut', 'publie')
    .maybeSingle()

  if (!bien) return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })

  // Insère la visite
  const { data: visite, error } = await admin.from('visites').insert({
    bien_id:         bienId,
    vendeur_id:      vendeurId,
    demandeur_id:    demandeurId ?? null,
    demandeur_nom:   demandeurNom.trim(),
    demandeur_email: (demandeurEmail as string).trim(),
    demandeur_tel:   demandeurTel ? (demandeurTel as string).trim() : null,
    date_souhaitee:  dateSouhaitee,
    creneau:         creneau ? String(creneau).slice(0, 50) : null,
    message:         message ? String(message).trim().slice(0, 500) : null,
  }).select('id').single()

  if (error) {
    console.error('[visites]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Envoie email au vendeur (on ne bloque pas si l'email échoue)
  if (await isEmailConfigured()) {
    try {
      const { data: vendeurData } = await admin.auth.admin.getUserById(vendeurId)
      const vendeurEmail = vendeurData.user?.email

      if (vendeurEmail) {
        const dateFormatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const safNom  = escHtml(demandeurNom.trim())
        const safBien = escHtml(bien.titre)

        await sendEmail({
          to:      vendeurEmail,
          replyTo: demandeurEmail.trim(),
          subject: `Demande de visite — ${bien.titre}`,
          html: emailLayout({
            content: `
              ${emailEyebrow('Nouvelle demande de visite')}
              ${emailTitle(`${safNom} souhaite visiter votre bien 🏠`)}
              <p style="margin:0 0 24px;font-size:14px;color:#64748B;">Pour votre annonce <strong>${safBien}</strong> à ${escHtml(bien.ville)}</p>
              ${emailFields([
                ['Email',          emailMailto(demandeurEmail.trim())],
                ['Téléphone',      demandeurTel ? escHtml(String(demandeurTel).trim()) : ''],
                ['Date souhaitée', escHtml(dateFormatted)],
                ['Créneau',        creneau ? escHtml(String(creneau)) : ''],
              ])}
              ${message ? emailQuote(escHtmlMultiline(String(message).trim())) : ''}
              ${emailButtons(
                emailButton(`mailto:${escHtml(demandeurEmail.trim())}?subject=Re: demande de visite — ${safBien}`, `Répondre à ${safNom}`),
                emailButton(`${SITE_URL}/compte/visites`, 'Mes demandes de visite', 'secondary'),
              )}`,
          }),
        })
      }
    } catch (e) {
      console.error('[visites] email error', e)
    }
  }

  return NextResponse.json({ ok: true, id: visite.id })
}
