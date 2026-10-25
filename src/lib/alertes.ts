/**
 * lib/alertes.ts — Notification immédiate des alertes à la publication d'un bien.
 *
 * Volontairement hors d'un fichier 'use server' : exportée depuis un tel fichier,
 * la fonction deviendrait une action serveur appelable par n'importe quel visiteur.
 * Appelée uniquement par approuverAnnonce (src/app/admin/annonces/actions.ts).
 */
import { createAdminClient } from '@/lib/supabase/admin'
import { escHtml, emailLayout, emailEyebrow, emailTitle, emailButton, emailButtons, sendEmail } from '@/lib/emails'
import { SITE_NAME, SITE_URL, siteEmail } from '@/lib/site'

export async function notifierAlertes(bienId: string): Promise<void> {
  const adminClient = createAdminClient()

  // Get the bien
  const { data: bien } = await adminClient
    .from('biens')
    .select('*')
    .eq('id', bienId)
    .single()

  if (!bien) return

  // Find matching alertes
  const { data: alertes } = await adminClient
    .from('alertes')
    .select('*')
    .eq('active', true)

  if (!alertes?.length) return

  const matching = alertes.filter(alerte => {
    if (alerte.type && alerte.type !== bien.type) return false
    if (alerte.categorie && alerte.categorie !== bien.categorie) return false
    if (alerte.ville && !bien.ville.toLowerCase().includes(alerte.ville.toLowerCase())) return false
    if (alerte.prix_max && bien.prix > alerte.prix_max) return false
    if (alerte.surface_min && bien.surface && bien.surface < alerte.surface_min) return false
    return true
  })

  if (!matching.length) return

  const prixLabel = bien.type === 'location'
    ? `${bien.prix.toLocaleString('fr-FR')} €/mois`
    : `${bien.prix.toLocaleString('fr-FR')} €`

  const html = emailLayout({
    content: `
      ${emailEyebrow('Alerte nouveaux biens')}
      ${emailTitle('Nouveau bien correspondant à votre alerte')}
      <div style="border:1px solid #E2E0DB;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Georgia,serif;">${escHtml(bien.titre)}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#64748B;">${escHtml(bien.ville)} · ${escHtml(bien.code_postal)}</p>
        <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#4F46E5;">${prixLabel}</p>
        ${bien.surface ? `<p style="margin:0;color:#64748B;font-size:14px;">${escHtml(bien.surface)} m² · ${escHtml(bien.pieces ?? '—')} pièces</p>` : ''}
      </div>
      ${emailButtons(emailButton(`${SITE_URL}/annonce/${encodeURIComponent(bien.id)}`, 'Voir l\'annonce →'))}`,
    footer: `Vous recevez cet email car vous avez créé une alerte sur ${SITE_NAME}.
      <a href="${SITE_URL}/compte/alertes" style="color:#4F46E5;">Gérer mes alertes</a>`,
  })

  for (const alerte of matching) {
    const res = await sendEmail({
      from: `${SITE_NAME} Alertes <${siteEmail('alertes')}>`,
      to: alerte.email,
      subject: `🏠 Nouveau bien à ${bien.ville} — ${prixLabel}`,
      html,
    })
    // derniere_notif_at sert de seuil au cron new-biens : il n'enverra plus ce bien à cette alerte
    if (res.ok) {
      await adminClient.from('alertes').update({ derniere_notif_at: new Date().toISOString() }).eq('id', alerte.id)
    }
  }
}
