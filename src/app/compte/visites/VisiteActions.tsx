'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  visiteId:       string
  statut:         string
  demandeurEmail: string
  demandeurNom:   string
}

export default function VisiteActions({ visiteId, statut, demandeurEmail, demandeurNom }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router  = useRouter()
  const supabase = createClient()

  async function updateStatut(newStatut: string) {
    setLoading(newStatut)
    await supabase
      .from('visites')
      .update({ statut: newStatut })
      .eq('id', visiteId)
    setLoading(null)
    router.refresh()
  }

  if (statut === 'en_attente') {
    return (
      <div className="flex flex-col gap-2 flex-shrink-0">
        <a
          href={`mailto:${demandeurEmail}?subject=Visite confirmée via Terranova`}
          onClick={() => updateStatut('confirme')}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-center whitespace-nowrap"
        >
          {loading === 'confirme' ? '...' : '✅ Confirmer'}
        </a>
        <button
          onClick={() => updateStatut('annule')}
          disabled={loading !== null}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
        >
          {loading === 'annule' ? '...' : '✗ Refuser'}
        </button>
      </div>
    )
  }

  if (statut === 'confirme') {
    return (
      <div className="flex flex-col gap-2 flex-shrink-0">
        <a
          href={`mailto:${demandeurEmail}`}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary/08 text-primary hover:bg-primary/15 transition-colors text-center whitespace-nowrap"
        >
          ✉️ Contacter
        </a>
        <button
          onClick={() => updateStatut('annule')}
          disabled={loading !== null}
          className="text-xs px-3 py-2 rounded-lg bg-navy/06 text-navy/50 hover:bg-navy/10 transition-colors whitespace-nowrap"
        >
          Annuler
        </button>
      </div>
    )
  }

  // Statut annulé
  return (
    <button
      onClick={() => updateStatut('en_attente')}
      disabled={loading !== null}
      className="text-xs px-3 py-2 rounded-lg bg-navy/06 text-navy/50 hover:bg-navy/10 transition-colors whitespace-nowrap flex-shrink-0"
    >
      Rouvrir
    </button>
  )
}
