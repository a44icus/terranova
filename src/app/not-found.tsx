import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-navy text-white px-6 h-14 flex items-center">
        <Link href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-primary italic">nova</span>
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="font-serif text-[120px] leading-none text-navy/08 select-none">
          404
        </div>
        <h1 className="font-serif text-3xl text-navy -mt-4 mb-3">
          Page introuvable
        </h1>
        <p className="text-sm text-navy/50 mb-8 max-w-sm">
          Cette annonce n'existe pas ou n'est plus disponible. Elle a peut-être été retirée par son propriétaire.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/"
            className="bg-navy text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors">
            Retour à la carte
          </Link>
          <Link href="/annonces"
            className="border border-navy/20 text-navy/70 px-6 py-2.5 rounded-xl text-sm font-medium hover:border-navy/40 transition-colors">
            Voir toutes les annonces
          </Link>
        </div>
      </div>
    </div>
  )
}
