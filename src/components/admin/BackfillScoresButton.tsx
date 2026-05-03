'use client'

import { useState } from 'react'

export default function BackfillScoresButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ processed: number; errors: number; total: number; message: string } | null>(null)

  async function handleClick() {
    if (!confirm('Lancer le calcul des scores pour tous les biens sans score ? Cela peut prendre plusieurs minutes.')) return
    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch('/api/admin/backfill-scores', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setResult(data)
      setStatus('done')
    } catch (err: any) {
      setResult({ processed: 0, errors: 1, total: 0, message: err.message })
      setStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-wait transition-colors"
      >
        {status === 'loading' ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            Calcul en cours…
          </>
        ) : (
          <>🏘️ Calculer les scores manquants</>
        )}
      </button>

      {result && (
        <p className={`text-sm font-medium ${status === 'error' ? 'text-red-600' : 'text-green-700'}`}>
          {status === 'done' ? '✓ ' : '✗ '}{result.message}
          {status === 'done' && result.errors > 0 && (
            <span className="text-amber-600 ml-1">({result.errors} erreur{result.errors > 1 ? 's' : ''})</span>
          )}
        </p>
      )}
    </div>
  )
}
