import EstimationForm from '@/components/EstimationForm'
import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Estimer mon bien — Terranova',
  description: 'Obtenez une estimation gratuite de votre bien immobilier basée sur les ventes récentes dans votre secteur.',
}

export default function EstimerPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />

      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Estimation gratuite</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-3 leading-tight">
            Estimer mon bien
          </h1>
          <p className="text-white/45 text-sm max-w-lg leading-relaxed">
            Obtenez une fourchette de prix instantanée basée sur les biens similaires vendus dans votre secteur.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-8">
          <EstimationForm />
        </div>

        <p className="text-center text-xs text-[#0F172A]/30 mt-6">
          Cette estimation est indicative et basée sur les annonces présentes sur Terranova.
          Pour une évaluation précise, consultez un professionnel de l&apos;immobilier.
        </p>
      </div>
      <SiteFooter />
    </div>
  )
}
