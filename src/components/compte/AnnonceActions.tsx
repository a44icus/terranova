'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  bienId: string
  statut: string
}

export default function AnnonceActions({ bienId, statut }: Props) {
  const [loading, setLoading] = useState<'vendue' | 'archive' | 'restore' | 'delete' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleVendue() {
    if (!confirm('Marquer ce bien comme vendu ? La fiche restera visible avec un badge "Vendu".')) return
    setLoading('vendue')
    await supabase.from('biens').update({ statut: 'vendue' }).eq('id', bienId)
    router.refresh()
    setLoading(null)
  }

  async function handleArchive() {
    setLoading('archive')
    await supabase.from('biens').update({ statut: 'archive' }).eq('id', bienId)
    router.refresh()
    setLoading(null)
  }

  async function handleRestore() {
    setLoading('restore')
    await supabase.from('biens').update({ statut: 'en_attente' }).eq('id', bienId)
    router.refresh()
    setLoading(null)
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement cette annonce ? Cette action est irréversible.')) return
    setLoading('delete')
    await supabase.from('biens').delete().eq('id', bienId)
    router.refresh()
    setLoading(null)
  }

  const busy = loading !== null

  return (
    <div className="flex gap-2 flex-shrink-0">
      {statut === 'publie' && (
        <button onClick={handleVendue} disabled={busy}
          className="text-xs border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-40">
          {loading === 'vendue' ? '…' : '✓ Vendu'}
        </button>
      )}

      {(statut === 'archive' || statut === 'vendue') ? (
        <button onClick={handleRestore} disabled={busy}
          className="text-xs border border-location/30 text-location px-3 py-2 rounded-lg hover:bg-location/08 transition-colors disabled:opacity-40">
          {loading === 'restore' ? '…' : 'Republier'}
        </button>
      ) : statut !== 'publie' ? null : (
        <button onClick={handleArchive} disabled={busy}
          className="text-xs border border-navy/15 px-3 py-2 rounded-lg hover:border-navy/30 transition-colors text-navy/60 disabled:opacity-40">
          {loading === 'archive' ? '…' : 'Archiver'}
        </button>
      )}

      {!['publie', 'archive', 'vendue'].includes(statut) && (
        <button onClick={handleArchive} disabled={busy}
          className="text-xs border border-navy/15 px-3 py-2 rounded-lg hover:border-navy/30 transition-colors text-navy/60 disabled:opacity-40">
          {loading === 'archive' ? '…' : 'Archiver'}
        </button>
      )}

      <button onClick={handleDelete} disabled={busy}
        className="text-xs border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
        {loading === 'delete' ? '…' : 'Supprimer'}
      </button>
    </div>
  )
}
