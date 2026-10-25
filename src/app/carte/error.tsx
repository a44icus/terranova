'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CarteError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Carte error]', error)
  }, [error])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="bg-navy h-14 flex-shrink-0 flex items-center px-6">
        <Link href="/" className="font-serif text-[22px] text-white tracking-wide">
          Jazz<span className="text-primary italic">Immo</span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="font-serif text-[80px] leading-none text-navy/08 select-none">⚠</div>
        <h1 className="font-serif text-2xl text-navy mt-2 mb-2">La carte n'a pas pu charger</h1>
        <p className="text-sm text-navy/50 mb-8 max-w-sm">
          Une erreur est survenue lors du chargement de la carte. Vérifiez votre connexion et réessayez.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={reset}
            className="bg-navy text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors"
          >
            Réessayer
          </button>
          <Link href="/annonces"
            className="border border-navy/20 text-navy/70 px-6 py-2.5 rounded-xl text-sm font-medium hover:border-navy/40 transition-colors">
            Voir les annonces
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11px] text-navy/25 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
