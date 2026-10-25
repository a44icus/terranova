'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Admin error]', error)
  }, [error])

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-56 flex-shrink-0 bg-navy" />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="font-serif text-[80px] leading-none text-navy/08 select-none">500</div>
        <h1 className="font-serif text-2xl text-navy -mt-2 mb-2">Erreur dans l'administration</h1>
        <p className="text-sm text-navy/50 mb-8 max-w-sm">
          Une erreur inattendue est survenue. Réessayez ou revenez au tableau de bord.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={reset}
            className="bg-navy text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors"
          >
            Réessayer
          </button>
          <Link href="/admin"
            className="border border-navy/20 text-navy/70 px-6 py-2.5 rounded-xl text-sm font-medium hover:border-navy/40 transition-colors">
            Tableau de bord
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11px] text-navy/25 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
