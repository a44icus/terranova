import Link from 'next/link'

/** Encart affiché à la place d'une fonctionnalité que le plan de l'utilisateur n'inclut pas. */
export default function FonctionReservee({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="bg-white rounded-2xl border border-navy/08 p-8 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">⭐</div>
        <h1 className="font-serif text-2xl text-navy mb-2">{titre}</h1>
        <p className="text-sm text-navy/60 mb-6">{texte}</p>
        <p className="text-sm text-navy/50 mb-6">Cette fonctionnalité n&apos;est pas incluse dans votre plan actuel.</p>
        <Link href="/compte/plan"
          className="inline-block bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
          Voir les plans →
        </Link>
      </div>
    </div>
  )
}
