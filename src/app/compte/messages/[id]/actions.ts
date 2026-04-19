'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function sendReply(contactId: string, contenu: string): Promise<{ ok?: boolean; error?: string }> {
  if (!contenu.trim()) return { error: 'Message vide' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que l'utilisateur est bien le vendeur ou l'acheteur
  const adminClient = createAdminClient()
  const { data: contact } = await adminClient
    .from('contacts')
    .select('vendeur_id, acheteur_id, nom, email, bien_id')
    .eq('id', contactId)
    .single()

  if (!contact) return { error: 'Message introuvable' }

  const isVendeur = contact.vendeur_id === user.id
  const isAcheteur = contact.acheteur_id === user.id
  if (!isVendeur && !isAcheteur) return { error: 'Accès refusé' }

  const { error } = await adminClient.from('contact_replies').insert({
    contact_id: contactId,
    auteur_id: user.id,
    contenu: contenu.trim(),
  })

  if (error) {
    if (error.message.includes('does not exist')) {
      return { error: 'Table contact_replies manquante. Exécutez le SQL de migration.' }
    }
    return { error: error.message }
  }

  // Marquer comme lu si c'est le vendeur qui répond
  if (isVendeur) {
    await adminClient.from('contacts').update({ lu: true }).eq('id', contactId)
  }

  // Notifier par email si RESEND_API_KEY disponible
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://terranova.fr'

      // Récupérer l'email du destinataire
      let toEmail = ''
      if (isVendeur) {
        // Vendeur répond → notifier l'acheteur
        toEmail = contact.email // email du contact initial
      } else {
        // Acheteur répond → notifier le vendeur
        const { data: { user: vendeur } } = await adminClient.auth.admin.getUserById(contact.vendeur_id)
        toEmail = vendeur?.email ?? ''
      }

      if (toEmail) {
        await resend.emails.send({
          from: 'Terranova <messages@terranova.fr>',
          to: toEmail,
          subject: `💬 Nouveau message sur Terranova`,
          html: `<p>Vous avez reçu un nouveau message concernant votre annonce.</p><a href="${baseUrl}/compte/messages/${contactId}" style="display:inline-block;background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">Voir le message →</a>`,
        }).catch(() => {})
      }
    } catch {}
  }

  revalidatePath(`/compte/messages/${contactId}`)
  revalidatePath('/compte/messages')
  return { ok: true }
}

export async function getConversation(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  const [{ data: contact }, { data: replies }] = await Promise.all([
    adminClient.from('contacts')
      .select('*, biens(titre, ville, prix, type)')
      .eq('id', contactId)
      .single(),
    adminClient.from('contact_replies')
      .select('id, contact_id, auteur_id, contenu, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true }),
  ])

  if (!contact) return null

  // Security check
  if (contact.vendeur_id !== user.id && contact.acheteur_id !== user.id) return null

  return { contact, replies: replies ?? [], userId: user.id }
}
