'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { TypeReseau } from '@/lib/types'

const TYPE_RESEAU_LABEL: Record<TypeReseau, string> = {
  franchise:   'Franchise',
  mandataires: 'Réseau de mandataires',
  groupement:  'Groupement',
  enseigne:    'Enseigne nationale',
}

const TYPE_COLOR: Record<string, string> = {
  franchise:   'bg-indigo-50 text-indigo-600',
  mandataires: 'bg-violet-50 text-violet-600',
  groupement:  'bg-cyan-50 text-cyan-700',
  enseigne:    'bg-amber-50 text-amber-700',
}

interface Reseau {
  id: string; nom: string; slug: string; logo_url?: string
  description?: string; site_web?: string; type_reseau: string
  agentCount: number
}

interface Agent {
  id: string; prenom: string; nom: string; agence?: string; bio?: string
  avatar_url?: string; logo_url?: string; site_web?: string
  telephone?: string; annonces_actives?: number; ville?: string
}

interface Props {
  reseaux: Reseau[]
  independants: Agent[]
}

const FILTERS = [
  { value: 'tous',        label: 'Tous' },
  { value: 'franchise',   label: 'Franchises' },
  { value: 'mandataires', label: 'Mandataires' },
  { value: 'groupement',  label: 'Groupements' },
  { value: 'enseigne',    label: 'Enseignes' },
]

export default function AgencesClient({ reseaux, independants }: Props) {
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('tous')

  const q = search.toLowerCase().trim()

  const filteredReseaux = useMemo(() =>
    reseaux.filter(r => {
      if (r.agentCount === 0) return false
      if (typeFilter !== 'tous' && r.type_reseau !== typeFilter) return false
      if (q && !r.nom.toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false
      return true
    }), [reseaux, typeFilter, q])

  const filteredIndep = useMemo(() =>
    independants.filter(a => {
      if (!q) return true
      const name = `${a.prenom} ${a.nom} ${a.agence ?? ''} ${a.ville ?? ''} ${a.bio ?? ''}`.toLowerCase()
      return name.includes(q)
    }), [independants, q])

  const showIndep = typeFilter === 'tous' || filteredReseaux.length === 0

  return (
    <>
      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un agent, une agence, une ville…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-navy/12 bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/30 hover:text-navy/60 transition-colors text-lg leading-none">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Pill filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              typeFilter === f.value
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-navy/55 border-navy/15 hover:border-navy/35 hover:text-navy'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Réseaux ────────────────────────────────────────────── */}
      {filteredReseaux.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-serif text-2xl text-navy">Réseaux & Enseignes</h2>
            <span className="text-xs font-medium text-navy/35 bg-navy/06 px-2.5 py-1 rounded-full">{filteredReseaux.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReseaux.map(reseau => (
              <Link key={reseau.id} href={`/agences/reseau/${reseau.slug}`} prefetch={false}
                className="group bg-white rounded-2xl border border-navy/08 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                {/* Header card */}
                <div className="px-5 pt-5 pb-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                  <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-navy/06 flex items-center justify-center overflow-hidden flex-shrink-0 p-1.5">
                    {reseau.logo_url
                      ? <img src={reseau.logo_url} alt={reseau.nom} className="w-full h-full object-contain" />
                      : <span className="font-bold text-navy/35 text-lg">{reseau.nom.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 ${TYPE_COLOR[reseau.type_reseau] ?? 'bg-navy/08 text-navy/50'}`}>
                      {TYPE_RESEAU_LABEL[reseau.type_reseau as TypeReseau]}
                    </span>
                    <h3 className="font-serif text-base text-navy leading-snug group-hover:text-primary transition-colors truncate">
                      {reseau.nom}
                    </h3>
                  </div>
                </div>
                {/* Description */}
                {reseau.description && (
                  <p className="px-5 pt-3 pb-1 text-xs text-navy/50 leading-relaxed line-clamp-2 flex-1">
                    {reseau.description}
                  </p>
                )}
                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-navy/06 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    <span className="text-[11px] text-navy/45">
                      {reseau.agentCount} agent{reseau.agentCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-primary font-semibold group-hover:underline">
                    Voir les agents →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Indépendants ───────────────────────────────────────── */}
      {showIndep && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-serif text-2xl text-navy">
              {reseaux.some(r => r.agentCount > 0) ? 'Agents indépendants' : 'Agents & Agences'}
            </h2>
            <span className="text-xs font-medium text-navy/35 bg-navy/06 px-2.5 py-1 rounded-full">{filteredIndep.length}</span>
          </div>

          {filteredIndep.length === 0 ? (
            <div className="bg-white rounded-2xl border border-navy/08 py-16 text-center">
              <p className="text-navy/40 text-sm">
                {q ? `Aucun résultat pour "${search}"` : 'Aucun professionnel indépendant référencé'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredIndep.map(agent => {
                const displayName = agent.agence || `${agent.prenom} ${agent.nom}`
                const subName    = agent.agence ? `${agent.prenom} ${agent.nom}` : null
                const initials   = agent.agence
                  ? agent.agence.slice(0, 2).toUpperCase()
                  : `${agent.prenom?.[0] ?? ''}${agent.nom?.[0] ?? ''}`.toUpperCase()

                return (
                  <Link key={agent.id} href={`/vendeur/${agent.id}`} prefetch={false}
                    className="group flex gap-4 bg-white rounded-2xl border border-navy/08 p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200">
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
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="min-w-0">
                          <h3 className="font-serif text-[15px] text-navy group-hover:text-primary transition-colors truncate leading-snug">
                            {displayName}
                          </h3>
                          {subName && <p className="text-[11px] text-navy/40 truncate">{subName}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-primary bg-primary/08 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                          PRO
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        {agent.ville && (
                          <span className="text-[11px] text-navy/40 flex items-center gap-1">
                            <span className="text-[9px]">📍</span>{agent.ville}
                          </span>
                        )}
                        {(agent.annonces_actives ?? 0) > 0 && (
                          <span className="text-[11px] text-navy/40">
                            {agent.annonces_actives} annonce{(agent.annonces_actives ?? 0) > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {agent.bio && (
                        <p className="text-[11px] text-navy/50 line-clamp-1 leading-relaxed mb-2">{agent.bio}</p>
                      )}
                      <div className="flex items-center gap-3 pt-2 border-t border-navy/06">
                        {agent.telephone && (
                          <span className="text-[11px] text-navy/40">📞 {agent.telephone}</span>
                        )}
                        <span className="text-[11px] text-primary font-semibold ml-auto group-hover:underline">
                          Voir la fiche →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Aucun résultat global */}
      {q && filteredReseaux.length === 0 && (!showIndep || filteredIndep.length === 0) && (
        <div className="text-center py-20">
          <p className="text-navy/40 text-sm mb-3">Aucun résultat pour <strong className="text-navy/60">"{search}"</strong></p>
          <button onClick={() => setSearch('')} className="text-xs text-primary hover:underline">
            Effacer la recherche
          </button>
        </div>
      )}
    </>
  )
}
