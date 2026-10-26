'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Rafraîchit la conversation dès qu'une réponse arrive (Supabase Realtime sur
 * contact_replies), sans recharger la page. Repli : rafraîchissement au retour sur
 * l'onglet, si le temps réel n'est pas disponible.
 * Nécessite supabase/migrations/20261026_messagerie_temps_reel.sql.
 */
export default function ConversationLive({ contactId }: { contactId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const canal = supabase
      .channel(`conversation-${contactId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_replies', filter: `contact_id=eq.${contactId}` },
        () => router.refresh())
      .subscribe()

    const auRetour = () => { if (document.visibilityState === 'visible') router.refresh() }
    document.addEventListener('visibilitychange', auRetour)

    return () => {
      document.removeEventListener('visibilitychange', auRetour)
      supabase.removeChannel(canal)
    }
  }, [contactId, router])

  return null
}
