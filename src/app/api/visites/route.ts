import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { isEmailRateLimited, getClientIp } from '@/lib/emailRateLimit'

function escHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254
}

function isDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (await isEmailRateLimited(ip, 'visites')) {
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

  // Envoie email au vendeur
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY) {
    try {
      const { data: vendeurData } = await admin.auth.admin.getUserById(vendeurId)
      const vendeurEmail = vendeurData.user?.email

      if (vendeurEmail) {
        const resend = new Resend(RESEND_API_KEY)
        const dateFormatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const safNom    = escHtml(demandeurNom.trim())
        const safEmail  = escHtml((demandeurEmail as string).trim())
        const safTel    = demandeurTel ? escHtml(String(demandeurTel).trim()) : ''
        const safMsg    = message ? escHtml(String(message).trim()).replace(/\n/g, '<br/>') : ''
        const safBien   = escHtml(bien.titre)
        const safVille  = escHtml(bien.ville)
        const safCr     = creneau ? escHtml(String(creneau)) : ''

        await resend.emails.send({
          from:    'Terranova <noreply@terranova-beta.vercel.app>',
          to:      vendeurEmail,
          replyTo: (demandeurEmail as string).trim(),
          subject: `Demande de visite — ${bien.titre}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0F172A">
              <h2 style="font-size:20px;margin-bottom:4px">Nouvelle demande de visite 🏠</h2>
              <p style="color:#64748B;font-size:14px;margin-bottom:24px">
                Pour votre annonce <strong>${safBien}</strong> à ${safVille}
              </p>
              <div style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:20px">
                <p style="margin:0 0 8px"><strong>De :</strong> ${safNom}</p>
                <p style="margin:0 0 8px"><strong>Email :</strong> <a href="mailto:${safEmail}">${safEmail}</a></p>
                ${safTel ? `<p style="margin:0 0 8px"><strong>Téléphone :</strong> ${safTel}</p>` : ''}
                <p style="margin:0 0 8px"><strong>Date souhaitée :</strong> ${dateFormatted}</p>
                ${safCr ? `<p style="margin:0 0 8px"><strong>Créneau :</strong> ${safCr}</p>` : ''}
                ${safMsg ? `<p style="margin:0 0 4px"><strong>Message :</strong></p><p style="margin:0;color:#334155">${safMsg}</p>` : ''}
              </div>
              <a href="mailto:${safEmail}?subject=Re: demande de visite — ${safBien}"
                style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                Répondre à ${safNom}
              </a>
              <p style="margin-top:20px;font-size:12px;color:#94A3B8">
                Gérez vos demandes de visite dans <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'}/compte/visites" style="color:#4F46E5">votre espace vendeur</a>.
              </p>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error('[visites] email error', e)
      // On ne bloque pas si l'email échoue
    }
  }

  return NextResponse.json({ ok: true, id: visite.id })
}
