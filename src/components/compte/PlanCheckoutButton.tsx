'use client'

import { useState } from 'react'
import type { PlanType } from '@/lib/types'

interface Props {
  plan: PlanType
  isCurrent: boolean
  hasPriceId: boolean
  color: string
}

export default function PlanCheckoutButton({ plan, isCurrent, hasPriceId, color }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (isCurrent) return
    if (!hasPriceId) {
      setError('Non configuré — ajoutez le Price ID Stripe dans les paramètres admin.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading || isCurrent}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        style={isCurrent
          ? { background: color + '15', color }
          : { background: color, color: '#fff' }
        }
      >
        {loading ? 'Redirection…' : isCurrent ? 'Plan actuel' : 'Choisir ce plan →'}
      </button>
      {error && (
        <p className="mt-2 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  )
}



