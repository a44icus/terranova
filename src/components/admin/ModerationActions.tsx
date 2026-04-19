'use client'

import { useTransition, useState } from 'react'
import { approuverAnnonce, refuserAnnonce } from '@/app/admin/annonces/actions'

interface Props {
  bienId: string
  compact?: boolean
}

export default function ModerationActions({ bienId, compact = false }: Props) {
  const [isPendingApprove, startApprove] = useTransition()
  const [isPendingRefuse, startRefuse] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [done, setDone] = useState(false)
  const [showRaisonDialog, setShowRaisonDialog] = useState(false)
  const [raison, setRaison] = useState('')

  if (done && feedback) {
    return (
      <div
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
          feedback.type === 'success'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {feedback.message}
      </div>
    )
  }

  function handleApprouver() {
    startApprove(async () => {
      const result = await approuverAnnonce(bienId)
      if (result.ok) {
        setFeedback({ type: 'success', message: '✓ Approuvée' })
        setDone(true)
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Erreur' })
      }
    })
  }

  function handleRefuserConfirm() {
    setShowRaisonDialog(false)
    startRefuse(async () => {
      const result = await refuserAnnonce(bienId, raison.trim() || undefined)
      if (result.ok) {
        setFeedback({ type: 'success', message: '✗ Refusée' })
        setDone(true)
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Erreur' })
      }
    })
  }

  if (compact) {
    return (
      <div className="flex gap-1.5 items-center">
        {feedback && !done && (
          <span className="text-[11px] text-red-600">{feedback.message}</span>
        )}
        <button
          onClick={handleApprouver}
          disabled={isPendingApprove || isPendingRefuse}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
        >
          {isPendingApprove ? '...' : '✓'}
        </button>
        <button
          onClick={() => setShowRaisonDialog(true)}
          disabled={isPendingApprove || isPendingRefuse}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
        >
          {isPendingRefuse ? '...' : '✗'}
        </button>

        {showRaisonDialog && (
          <RaisonDialog
            raison={raison}
            onRaisonChange={setRaison}
            onConfirm={handleRefuserConfirm}
            onCancel={() => setShowRaisonDialog(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 min-w-[130px]">
      {feedback && !done && (
        <p className="text-[11px] text-red-600 text-center">{feedback.message}</p>
      )}

      <button
        onClick={handleApprouver}
        disabled={isPendingApprove || isPendingRefuse}
        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
      >
        {isPendingApprove ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-green-700/30 border-t-green-700 rounded-full animate-spin" />
        ) : (
          '✓'
        )}
        Approuver
      </button>

      <button
        onClick={() => setShowRaisonDialog(true)}
        disabled={isPendingApprove || isPendingRefuse}
        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        {isPendingRefuse ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-red-700/30 border-t-red-700 rounded-full animate-spin" />
        ) : (
          '✗'
        )}
        Refuser
      </button>

      {showRaisonDialog && (
        <RaisonDialog
          raison={raison}
          onRaisonChange={setRaison}
          onConfirm={handleRefuserConfirm}
          onCancel={() => setShowRaisonDialog(false)}
        />
      )}
    </div>
  )
}

interface RaisonDialogProps {
  raison: string
  onRaisonChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}

function RaisonDialog({ raison, onRaisonChange, onConfirm, onCancel }: RaisonDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="font-semibold text-[#0F172A] mb-1">Refuser cette annonce</h3>
        <p className="text-xs text-[#0F172A]/50 mb-4">
          Vous pouvez indiquer une raison (optionnel).
        </p>
        <textarea
          value={raison}
          onChange={e => onRaisonChange(e.target.value)}
          placeholder="Ex : Photos insuffisantes, prix incohérent..."
          rows={3}
          className="w-full text-sm border border-[#0F172A]/15 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#4F46E5] transition-colors mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm text-[#0F172A]/60 hover:bg-[#0F172A]/06 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  )
}



