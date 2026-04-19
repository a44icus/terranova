'use client'
import { useTransition } from 'react'
import { deleteAlerte } from '@/app/api/alertes/actions'

export default function DeleteAlerteButton({ alerteId }: { alerteId: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(() => { deleteAlerte(alerteId) })}
      disabled={pending}
      className="text-xs text-[#0F172A]/30 hover:text-red-500 transition-colors disabled:opacity-40 p-1"
      title="Supprimer l'alerte"
    >
      {pending ? '…' : '✕'}
    </button>
  )
}



