import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { TypeReseau } from '@/lib/types'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

const TYPE_RESEAU_LABEL: Record<TypeReseau, string> = {
  franchise:   'Franchise',
  mandataires: 'Réseau de mandataires',
  groupement:  'Groupement',
  enseigne:    'Enseigne nationale',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: reseau } = await admin.from('reseaux').select('nom, description').eq('slug', slug).single()
  if (!reseau) return { title: 'Réseau introuvable — Terranova' }
  return {
    title: `${reseau.nom} — Agents & Agences — Terranova`,
    description: reseau.description ?? `Trouvez tous les agents du réseau ${reseau.nom} sur Terranova.`,
  }
}

export default async function ReseauPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: reseau } = await admin.from('reseaux').select('*').eq('slug', slug).single()
  if (!reseau) notFound()

  const { data: allAffiliated } = await admin
    .from('profiles')
    .select('id, prenom, nom, agence, bio, avatar_url, logo_url, site_web, telephone, annonces_actives, ville, reseau_id')
    .not('reseau_id', 'is', null)
    .order('annonces_actives', { ascending: false })

  const agentsList = (allAffiliated ?? []).filter(p => p.reseau_id === reseau.id)
  const totalAnnonces = agentsList.reduce((s, a) => s + (a.annonces_actives ?? 0), 0)

  const parVille = agentsList.reduce<Record<string, typeof agentsList>>((acc, agent) => {
    const v = agent.ville ?? 'Autre'
    if (!acc[v]) acc[v] = []
    acc[v].push(agent)
    return acc
  }, {})
  const villes = Object.keys(parVille).sort((a, b) =>
    a === 'Autre' ? 1 : b === 'Autre' ? -1 : a.localeCompare(b, 'fr'))

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <SiteHeader />

      {/* Hero réseau */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 40%, rgba(79,70,229,0.2) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(124,58,237,0.12) 0%, transparent 50%)',
        }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12">
          <div className="flex items-start gap-6 flex-wrap">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-2 shadow-xl ring-1 ring-white/10">
              {reseau.logo_url
                ? <img src={reseau.logo_url} alt={reseau.nom} className="w-full h-full object-contain" />
                : <span className="font-bold text-navy text-2xl">{reseau.nom.slice(0, 2).toUpperCase()}</span>}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em] mb-1">
                {TYPE_RESEAU_LABEL[reseau.type_reseau as TypeReseau]}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl text-white mb-3 leading-tight">{reseau.nom}</h1>
              {/* Stats pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs text-white/60 bg-white/08 border border-white/10 px-3 py-1 rounded-full">
                  <span className="font-semibold text-white">{agentsList.length}</span> agent{agentsList.length > 1 ? 's' : ''}
                </span>
                {villes.filter(v => v !== 'Autre').length > 0 && (
                  <span className="text-xs text-white/60 bg-white/08 border border-white/10 px-3 py-1 rounded-full">
                    <span className="font-semibold text-white">{villes.filter(v => v !== 'Autre').length}</span> ville{villes.filter(v => v !== 'Autre').length > 1 ? 's' : ''}
                  </span>
                )}
                {totalAnnonces > 0 && (
                  <span className="text-xs text-white/60 bg-white/08 border border-white/10 px-3 py-1 rounded-full">
                    <span className="font-semibold text-white">{totalAnnonces}</span> annonce{totalAnnonces > 1 ? 's' : ''}
                  </span>
                )}
                {reseau.site_web && (
                  <a href={reseau.site_web} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary bg-white/08 border border-white/10 px-3 py-1 rounded-full hover:bg-white/15 transition-colors">
                    {reseau.site_web.replace(/^https?:\/\//, '')} ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {reseau.description && (
            <p className="mt-5 text-sm text-white/50 leading-relaxed max-w-2xl border-t border-white/08 pt-5">
              {reseau.description}
            </p>
          )}
        </div>
      </div>

      {/* Nav villes sticky */}
      {villes.length > 1 && (
        <div className="bg-white border-b border-navy/08 sticky top-14 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
            {villes.map(ville => (
              <a key={ville} href={`#ville-${encodeURIComponent(ville)}`}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-navy/12 text-navy/55 hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
                {ville}
                <span className="bg-navy/08 text-navy/45 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  {parVille[ville].length}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {agentsList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-navy/08 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-navy/05 flex items-center justify-center mx-auto mb-4 text-3xl">👤</div>
            <p className="text-sm text-navy/50 font-medium">Aucun agent affilié pour l'instant</p>
            <p className="text-xs text-navy/35 mt-1">Les agents qui rejoignent ce réseau apparaîtront ici.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {villes.map(ville => (
              <section key={ville} id={`ville-${encodeURIComponent(ville)}`} className="scroll-mt-28">
                {/* Section header ville */}
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="font-serif text-xl text-navy">{ville}</h2>
                  <span className="text-xs text-navy/35 bg-navy/06 px-2.5 py-1 rounded-full font-medium">
                    {parVille[ville].length} agent{parVille[ville].length > 1 ? 's' : ''}
                  </span>
                  <div className="flex-1 h-px bg-navy/08" />
                </div>

                {/* Grille agents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {parVille[ville].map(agent => {
                    const displayName = agent.agence || `${agent.prenom} ${agent.nom}`
                    const subName    = agent.agence ? `${agent.prenom} ${agent.nom}` : null
                    const initials   = agent.agence
                      ? agent.agence.slice(0, 2).toUpperCase()
                      : `${agent.prenom?.[0] ?? ''}${agent.nom?.[0] ?? ''}`.toUpperCase()

                    return (
                      <Link key={agent.id} href={`/vendeur/${agent.id}`}
                        className="group flex gap-4 bg-white rounded-2xl border border-navy/08 p-4 hover:shadow-md hover:border-primary/25 transition-all duration-200">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(79,70,229,0.04))' }}>
                          {agent.logo_url
                            ? <img src={agent.logo_url} alt={displayName} className="w-full h-full object-contain p-1" />
                            : agent.avatar_url
                              ? <img src={agent.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                              : <span className="font-bold text-primary/60 text-xl">{initials}</span>}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-[15px] text-navy group-hover:text-primary transition-colors truncate leading-snug">
                            {displayName}
                          </p>
                          {subName && (
                            <p className="text-[11px] text-navy/40 truncate mb-1">{subName}</p>
                          )}
                          {agent.bio && (
                            <p className="text-[11px] text-navy/50 line-clamp-2 leading-relaxed mb-2">{agent.bio}</p>
                          )}
                          <div className="flex items-center gap-3 pt-2 border-t border-navy/06 flex-wrap">
                            {(agent.annonces_actives ?? 0) > 0 && (
                              <span className="text-[11px] text-navy/40">
                                {agent.annonces_actives} annonce{(agent.annonces_actives ?? 0) > 1 ? 's' : ''}
                              </span>
                            )}
                            {agent.telephone && (
                              <span className="text-[11px] text-navy/40">📞 {agent.telephone}</span>
                            )}
                            <span className="ml-auto text-[11px] text-primary font-semibold group-hover:underline">
                              Voir →
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}
