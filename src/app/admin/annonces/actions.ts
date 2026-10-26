'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { getDroits } from '@/lib/droits'
import { revalidatePath } from 'next/cache'
import { escHtml, escHtmlMultiline, emailLayout, emailEyebrow, emailTitle, emailQuote, emailButton, emailButtons, sendEmail } from '@/lib/emails'
import { SITE_NAME, SITE_URL, siteEmail } from '@/lib/site'

async function checkAdmin() { return await requireAdmin() }

export async function approuverAnnonce(bienId: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('biens')
    .update({ statut: 'publie', publie_at: new Date().toISOString() })
    .eq('id', bienId)

  if (error) {
    console.error('[approuverAnnonce]', error)
    return { error: 'Erreur lors de l\'approbation' }
  }

  revalidatePath('/admin/annonces')
  revalidatePath('/admin/annonces/toutes')

  // Calcul du score de quartier (fire-and-forget — ne bloque pas l'approbation)
  try {
    const { data: bien } = await adminClient
      .from('biens')
      .select('lat, lng')
      .eq('id', bienId)
      .single()
    if (bien?.lat && bien?.lng) {
      const { computeAndStoreScore } = await import('@/lib/computeBienScore')
      computeAndStoreScore(bienId, bien.lat, bien.lng, adminClient).catch(() => {})
    }
  } catch {
    // Silencieux — le score peut être calculé plus tard
  }

  // Notifier les alertes correspondantes
  try {
    const { notifierAlertes } = await import('@/lib/alertes')
    await notifierAlertes(bienId)
  } catch (err) {
    console.error('[Admin] Erreur notification alertes:', err)
  }

  // Email d'approbation au vendeur (silencieux — ne fait jamais échouer l'action)
  try {
    const { data: bien } = await adminClient.from('biens').select('titre, ville, user_id').eq('id', bienId).single()
    if (bien) {
      const { data: { user: seller } } = await adminClient.auth.admin.getUserById(bien.user_id)
      if (seller?.email) {
        await sendEmail({
          from: `${SITE_NAME} <${siteEmail('noreply')}>`,
          to: seller.email,
          subject: `✅ Votre annonce "${bien.titre}" est en ligne`,
          html: emailLayout({
            content: `
              ${emailEyebrow('Annonce approuvée')}
              ${emailTitle('Votre annonce est en ligne')}
              <p style="margin:0 0 24px;font-size:14px;color:#334155;line-height:1.6;">Votre annonce <strong>${escHtml(bien.titre)}</strong> à ${escHtml(bien.ville)} a été approuvée et est maintenant visible sur ${SITE_NAME}.</p>
              ${emailButtons(emailButton(`${SITE_URL}/annonce/${encodeURIComponent(bienId)}`, 'Voir mon annonce'))}`,
          }),
        })
      }
    }
  } catch {
    // Ignore email errors
  }

  return { ok: true }
}

export async function refuserAnnonce(bienId: string, raison?: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }

  const adminClient = createAdminClient()

  const updateData: Record<string, unknown> = { statut: 'refuse' }
  if (raison) updateData.description_refus = raison

  const { error } = await adminClient
    .from('biens')
    .update(updateData)
    .eq('id', bienId)

  if (error) {
    console.error('[refuserAnnonce]', error)
    return { error: 'Erreur lors du refus' }
  }

  revalidatePath('/admin/annonces')
  revalidatePath('/admin/annonces/toutes')

  // Email de refus au vendeur (silencieux — ne fait jamais échouer l'action)
  try {
    const { data: bien } = await adminClient.from('biens').select('titre, ville, user_id').eq('id', bienId).single()
    if (bien) {
      const { data: { user: seller } } = await adminClient.auth.admin.getUserById(bien.user_id)
      if (seller?.email) {
        await sendEmail({
          from: `${SITE_NAME} <${siteEmail('noreply')}>`,
          to: seller.email,
          subject: `Votre annonce n'a pas été approuvée — ${SITE_NAME}`,
          html: emailLayout({
            content: `
              ${emailEyebrow('Annonce non approuvée')}
              ${emailTitle(escHtml(bien.titre))}
              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">Votre annonce à ${escHtml(bien.ville)} n'a malheureusement pas pu être approuvée.</p>
              ${raison ? emailQuote(`Motif : ${escHtmlMultiline(raison)}`) : ''}
              <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">N'hésitez pas à nous contacter pour plus d'informations.</p>`,
          }),
        })
      }
    }
  } catch {
    // Ignore email errors
  }

  return { ok: true }
}

export async function toggleCoupDeCoeur(bienId: string, value: boolean): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }
  // Le label est un avantage de certains plans : on ne l'attribue qu'aux vendeurs éligibles
  if (value) {
    const { data: bien } = await createAdminClient().from('biens').select('user_id').eq('id', bienId).maybeSingle()
    if (!bien) return { error: 'Annonce introuvable' }
    if (!(await getDroits(bien.user_id)).a('coup_de_coeur'))
      return { error: 'Le plan du vendeur n\'inclut pas le label Coup de cœur' }
  }
  const { error } = await createAdminClient().from('biens').update({ coup_de_coeur: value }).eq('id', bienId)
  if (error) {
    console.error('[toggleCoupDeCoeur]', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
  revalidatePath('/admin/annonces/toutes')
  revalidatePath('/carte')
  return { ok: true }
}

export async function toggleFeatured(bienId: string, value: boolean): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }
  const { error } = await createAdminClient().from('biens').update({ featured: value }).eq('id', bienId)
  if (error) {
    console.error('[toggleFeatured]', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
  revalidatePath('/admin/annonces/toutes')
  revalidatePath('/carte')
  return { ok: true }
}
