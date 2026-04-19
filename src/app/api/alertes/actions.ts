'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface AlerteData {
  email?: string
  type?: string
  categorie?: string
  ville?: string
  prix_max?: number
  surface_min?: number
}

export async function createAlerte(data: AlerteData): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get email from user if not provided
  const email = data.email || user?.email
  if (!email) return { error: 'Email requis' }

  const { error } = await supabase.from('alertes').insert({
    user_id: user?.id ?? null,
    email,
    type: data.type || null,
    categorie: data.categorie || null,
    ville: data.ville || null,
    prix_max: data.prix_max || null,
    surface_min: data.surface_min || null,
    active: true,
  })

  if (error) {
    if (error.message.includes('does not exist')) {
      return { error: 'Table alertes manquante. Exécutez le SQL de migration.' }
    }
    return { error: error.message }
  }

  revalidatePath('/compte/alertes')
  return { ok: true }
}

export async function deleteAlerte(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase.from('alertes').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/compte/alertes')
  return { ok: true }
}

export async function getAlertes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase.from('alertes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return data ?? []
}

// Called when a bien is published (from admin approve action)
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

  const matching = alertes.filter((alerte: any) => {
    if (alerte.type && alerte.type !== bien.type) return false
    if (alerte.categorie && alerte.categorie !== bien.categorie) return false
    if (alerte.ville && !bien.ville.toLowerCase().includes(alerte.ville.toLowerCase())) return false
    if (alerte.prix_max && bien.prix > alerte.prix_max) return false
    if (alerte.surface_min && bien.surface && bien.surface < alerte.surface_min) return false
    return true
  })

  if (!matching.length) return

  // Send emails
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const { Resend } = await import('resend')
  const resend = new Resend(resendKey)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

  const prixLabel = bien.type === 'location'
    ? `${bien.prix.toLocaleString('fr-FR')} €/mois`
    : `${bien.prix.toLocaleString('fr-FR')} €`

  for (const alerte of matching) {
    try {
      await resend.emails.send({
        from: 'Terranova Alertes <alertes@terranova.fr>',
        to: alerte.email,
        subject: `🏠 Nouveau bien à ${bien.ville} — ${prixLabel}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="color: #0F172A;">Nouveau bien correspondant à votre alerte</h2>
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 16px 0;">
              <div style="padding: 16px;">
                <h3 style="margin: 0 0 8px; color: #0F172A;">${bien.titre}</h3>
                <p style="margin: 0 0 4px; color: #64748B;">${bien.ville} · ${bien.code_postal}</p>
                <p style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #4F46E5;">${prixLabel}</p>
                ${bien.surface ? `<p style="margin: 0; color: #64748B; font-size: 14px;">${bien.surface} m² · ${bien.pieces ?? '—'} pièces</p>` : ''}
              </div>
            </div>
            <a href="${baseUrl}/annonce/${bien.id}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Voir l'annonce →
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #94A3B8;">
              Vous recevez cet email car vous avez créé une alerte sur Terranova.
              <a href="${baseUrl}/compte/alertes" style="color: #4F46E5;">Gérer mes alertes</a>
            </p>
          </div>
        `,
      })
      // Update derniere_notif_at
      await adminClient.from('alertes').update({ derniere_notif_at: new Date().toISOString() }).eq('id', alerte.id)
    } catch (err) {
      console.error('[Alertes] Erreur envoi email:', err)
    }
  }
}
