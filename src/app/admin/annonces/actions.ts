'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.app_metadata?.role === 'admin' ||
    adminEmails.includes(user.email ?? '')

  return isAdmin ? user : null
}

export async function approuverAnnonce(bienId: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('biens')
    .update({ statut: 'publie', publie_at: new Date().toISOString() })
    .eq('id', bienId)

  if (error) return { error: error.message }

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
    const { notifierAlertes } = await import('@/app/api/alertes/actions')
    await notifierAlertes(bienId)
  } catch (err) {
    console.error('[Admin] Erreur notification alertes:', err)
  }

  // Send approval email (silent — never fails the action)
  try {
    const { data: bien } = await adminClient.from('biens').select('titre, ville, user_id').eq('id', bienId).single()
    if (bien) {
      const { data: { user: seller } } = await adminClient.auth.admin.getUserById(bien.user_id)
      if (process.env.RESEND_API_KEY && seller?.email) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Terranova <noreply@terranova.fr>',
          to: seller.email,
          subject: `✅ Votre annonce "${bien.titre}" est en ligne`,
          html: `<p>Bonjour,</p><p>Votre annonce <strong>${bien.titre}</strong> à ${bien.ville} a été approuvée et est maintenant visible sur Terranova.</p><p><a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'}/annonce/${bienId}">Voir mon annonce</a></p>`,
        }).catch(() => {})
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

  if (error) return { error: error.message }

  revalidatePath('/admin/annonces')
  revalidatePath('/admin/annonces/toutes')

  // Send refusal email (silent — never fails the action)
  try {
    const { data: bien } = await adminClient.from('biens').select('titre, ville, user_id').eq('id', bienId).single()
    if (bien) {
      const { data: { user: seller } } = await adminClient.auth.admin.getUserById(bien.user_id)
      if (process.env.RESEND_API_KEY && seller?.email) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Terranova <noreply@terranova.fr>',
          to: seller.email,
          subject: `Votre annonce n'a pas été approuvée — Terranova`,
          html: `<p>Bonjour,</p><p>Votre annonce <strong>${bien.titre}</strong> à ${bien.ville} n'a malheureusement pas pu être approuvée.${raison ? `</p><p>Motif : ${raison}` : ''}</p><p>N'hésitez pas à nous contacter pour plus d'informations.</p>`,
        }).catch(() => {})
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
  const { error } = await createAdminClient().from('biens').update({ coup_de_coeur: value }).eq('id', bienId)
  if (error) return { error: error.message }
  revalidatePath('/admin/annonces/toutes')
  revalidatePath('/carte')
  return { ok: true }
}

export async function toggleFeatured(bienId: string, value: boolean): Promise<{ ok?: boolean; error?: string }> {
  const user = await checkAdmin()
  if (!user) return { error: 'Non autorisé' }
  const { error } = await createAdminClient().from('biens').update({ featured: value }).eq('id', bienId)
  if (error) return { error: error.message }
  revalidatePath('/admin/annonces/toutes')
  revalidatePath('/carte')
  return { ok: true }
}
