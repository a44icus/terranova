import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import AgencesClient from '@/components/agences/AgencesClient'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Agents & Agences immobilières — Terranova',
  description: 'Trouvez un agent immobilier, une agence ou un réseau sur Terranova.',
}

export default async function AgencesPage() {
  const admin = createAdminClient()

  const [{ data: reseauxRaw }, { data: proAgents }, { data: profiles }] = await Promise.all([
    admin.from('reseaux').select('*').order('nom'),
    admin.from('profiles').select('reseau_id').not('reseau_id', 'is', null),
    admin
      .from('profiles')
      .select('id, prenom, nom, agence, bio, avatar_url, logo_url, site_web, telephone, annonces_actives, ville')
      .eq('type', 'pro')
      .is('reseau_id', null)
      .order('annonces_actives', { ascending: false }),
  ])

  const countByReseau = (proAgents ?? []).reduce<Record<string, number>>((acc, p) => {
    const rid = p.reseau_id as string
    acc[rid] = (acc[rid] ?? 0) + 1
    return acc
  }, {})

  const reseaux = (reseauxRaw ?? []).map(r => ({ ...r, agentCount: countByReseau[r.id] ?? 0 }))
  const independants = (profiles ?? []).filter(p => (p.annonces_actives ?? 0) > 0 || p.agence)

  const totalAgents = reseaux.reduce((s, r) => s + r.agentCount, 0) + independants.length
  const totalReseaux = reseaux.filter(r => r.agentCount > 0).length

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />

      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.18) 0%, transparent 65%), radial-gradient(ellipse at 15% 80%, rgba(124,58,237,0.10) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Annuaire professionnel</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-3 leading-tight">
            Agents & Agences
          </h1>
          <p className="text-white/45 text-sm mb-8 max-w-lg leading-relaxed">
            Trouvez votre interlocuteur idéal parmi les professionnels de l'immobilier référencés sur Terranova.
          </p>
          <div className="flex flex-wrap gap-3">
            {totalAgents > 0 && (
              <div className="flex items-baseline gap-1.5 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="font-serif text-xl text-white">{totalAgents}</span>
                <span className="text-xs text-white/50">professionnel{totalAgents > 1 ? 's' : ''}</span>
              </div>
            )}
            {totalReseaux > 0 && (
              <div className="flex items-baseline gap-1.5 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="font-serif text-xl text-white">{totalReseaux}</span>
                <span className="text-xs text-white/50">réseau{totalReseaux > 1 ? 'x' : ''}</span>
              </div>
            )}
            {independants.length > 0 && (
              <div className="flex items-baseline gap-1.5 bg-white/08 border border-white/10 rounded-full px-4 py-2">
                <span className="font-serif text-xl text-white">{independants.length}</span>
                <span className="text-xs text-white/50">indépendant{independants.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <AgencesClient reseaux={reseaux} independants={independants} />

        {/* CTA pro */}
        <div className="mt-14 relative overflow-hidden bg-navy rounded-2xl p-8 flex items-start gap-5">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 90% 50%, rgba(79,70,229,0.25) 0%, transparent 60%)',
          }} />
          <div className="relative text-4xl flex-shrink-0">🏢</div>
          <div className="relative">
            <p className="font-serif text-xl text-white mb-1">Vous êtes professionnel de l'immobilier ?</p>
            <p className="text-sm text-white/50 mb-4 max-w-md leading-relaxed">
              Créez votre compte pro et apparaissez dans cet annuaire. Rattachez-vous à votre réseau ou exercez en indépendant.
            </p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              Créer un compte Pro →
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
