'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Error boundary]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-navy text-white px-6 h-14 flex items-center">
        <Link href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-primary italic">nova</span>
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="font-serif text-[120px] leading-none text-navy/08 select-none">
          500
        </div>
        <h1 className="font-serif text-3xl text-navy -mt-4 mb-3">
          Une erreur est survenue
        </h1>
        <p className="text-sm text-navy/50 mb-8 max-w-sm">
          Quelque chose s'est mal passé. Vous pouvez réessayer ou retourner à la page d'accueil.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={reset}
            className="bg-navy text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors"
          >
            Réessayer
          </button>
          <Link href="/"
            className="border border-navy/20 text-navy/70 px-6 py-2.5 rounded-xl text-sm font-medium hover:border-navy/40 transition-colors">
            Retour à la carte
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11px] text-navy/25 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
