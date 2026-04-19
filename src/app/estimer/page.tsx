import EstimationForm from '@/components/EstimationForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Estimer mon bien — Terranova',
  description: 'Obtenez une estimation gratuite de votre bien immobilier basée sur les ventes récentes dans votre secteur.',
}

export default function EstimerPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-[#0F172A] text-white px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-[#4F46E5] italic">nova</span>
        </Link>
        <Link href="/carte" className="text-white/50 hover:text-white text-sm transition-colors">← Carte</Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏡</div>
          <h1 className="font-serif text-4xl text-[#0F172A] mb-3">Estimer mon bien</h1>
          <p className="text-[#0F172A]/50 text-base leading-relaxed">
            Obtenez une fourchette de prix instantanée basée sur les biens similaires
            vendus dans votre secteur sur Terranova.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-8">
          <EstimationForm />
        </div>

        <p className="text-center text-xs text-[#0F172A]/30 mt-6">
          Cette estimation est indicative et basée sur les annonces présentes sur Terranova.
          Pour une évaluation précise, consultez un professionnel de l&apos;immobilier.
        </p>
      </div>
    </div>
  )
}
