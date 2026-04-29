import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import ContactAgentForm from '@/components/vendeur/ContactAgentForm'
import ShareButton from '@/components/vendeur/ShareButton'
import AgentMapPin from '@/components/vendeur/AgentMapPin'
import AvisAgents from '@/components/vendeur/AvisAgents'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('prenom, nom, agence, ville').eq('id', id).single()
  if (!profile) return { title: 'Agent — Terranova' }
  const name = profile.agence || `${profile.prenom} ${profile.nom}`
  return {
    title: `${name} — Terranova`,
    description: `Découvrez le profil et les annonces de ${name}${profile.ville ? ` à ${profile.ville}` : ''} sur Terranova.`,
  }
}

export default async function VendeurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: biens }, { data: avis }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('*, reseaux(id, nom, slug, logo_url, type_reseau), adresse, lat, lng').eq('id', id).single(),
    supabase.from('biens').select('*, photos(url, principale)').eq('user_id', id).eq('statut', 'publie').order('publie_at', { ascending: false }),
    supabase.from('avis_agents').select('id, auteur_id, auteur_nom, note, commentaire, created_at').eq('agent_id', id).order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  if (!profile) notFound()

  const totalVues = biens?.reduce((s, b) => s + (b.vues ?? 0), 0) ?? 0
  const moyenneNote = avis?.length ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0
  const hasDejaNote = user ? avis?.some(a => a.auteur_id === user.id) ?? false : false
  const anneeInscription = new Date(profile.created_at).getFullYear()
  const initials = `${profile.prenom?.[0] ?? ''}${profile.nom?.[0] ?? ''}`.toUpperCase()
  const displayName = profile.agence || `${profile.prenom} ${profile.nom}`

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <SiteHeader />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 80% 30%, rgba(79,70,229,0.2) 0%, transparent 55%), radial-gradient(ellipse at 5% 90%, rgba(124,58,237,0.12) 0%, transparent 50%)',
        }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-start gap-6 flex-wrap">

            {/* Avatar / Logo */}
            {profile.logo_url ? (
              <div className="w-24 h-24 rounded-2xl bg-white flex-shrink-0 overflow-hidden p-2 shadow-xl ring-1 ring-white/10">
                <img src={profile.logo_url} alt={displayName} className="w-full h-full object-contain" />
              </div>
            ) : profile.avatar_url ? (
              <div className="w-24 h-24 rounded-2xl flex-shrink-0 overflow-hidden shadow-xl ring-1 ring-white/10">
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-xl"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                {initials}
              </div>
            )}

            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              {/* Badge réseau */}
              {profile.reseaux && (
                <Link href={`/agences/reseau/${profile.reseaux.slug}`}
                  className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-white/15 hover:border-white/35 hover:bg-white/05 transition-all group">
                  {profile.reseaux.logo_url && (
                    <img src={profile.reseaux.logo_url} alt={profile.reseaux.nom} className="w-4 h-4 object-contain" />
                  )}
                  <span className="text-xs text-white/55 group-hover:text-white transition-colors">{profile.reseaux.nom}</span>
                </Link>
              )}

              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-serif text-3xl sm:text-4xl text-white leading-tight">{displayName}</h1>
                {profile.type === 'pro' && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-primary/80 border border-primary/40 uppercase tracking-wide">
                    Pro
                  </span>
                )}
              </div>

              {profile.agence && (
                <p className="text-white/45 text-sm mb-4">{profile.prenom} {profile.nom}</p>
              )}
              {profile.ville && !profile.agence && (
                <p className="text-white/45 text-sm mb-4 flex items-center gap-1.5">
                  <span className="text-xs">📍</span>{profile.ville}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-6 flex-wrap mb-5">
                <div className="text-center">
                  <div className="font-serif text-2xl text-white">{biens?.length ?? 0}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wide">annonce{(biens?.length ?? 0) > 1 ? 's' : ''}</div>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div className="text-center">
                  <div className="font-serif text-2xl text-white">{totalVues.toLocaleString('fr-FR')}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wide">vues</div>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div className="text-center">
                  <div className="font-serif text-2xl text-white">{anneeInscription}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-wide">membre depuis</div>
                </div>
                {(avis?.length ?? 0) > 0 && (
                  <>
                    <div className="w-px bg-white/10 self-stretch" />
                    <div className="text-center">
                      <div className="font-serif text-2xl text-white flex items-center gap-1">
                        {moyenneNote.toFixed(1)}
                        <span className="text-amber-400 text-lg">★</span>
                      </div>
                      <div className="text-[10px] text-white/35 uppercase tracking-wide">{avis!.length} avis</div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions contact */}
              <div className="flex gap-2.5 flex-wrap">
                {profile.telephone && (
                  <a href={`tel:${profile.telephone}`}
                    className="flex items-center gap-2 text-sm text-white/80 hover:text-white border border-white/15 hover:border-white/35 hover:bg-white/05 px-4 py-2 rounded-xl transition-all">
                    📞 {profile.telephone}
                  </a>
                )}
                {profile.site_web && (
                  <a href={profile.site_web} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-white/80 hover:text-white border border-white/15 hover:border-white/35 hover:bg-white/05 px-4 py-2 rounded-xl transition-all">
                    🌐 Site web ↗
                  </a>
                )}
                <a href="#contact"
                  className="flex items-center gap-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all">
                  ✉️ Contacter
                </a>
                <ShareButton name={displayName} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 flex gap-4">
            <div className="w-0.5 bg-primary/30 rounded-full flex-shrink-0 self-stretch" />
            <p className="text-[#0F172A]/60 text-sm leading-relaxed italic flex-1">
              « {profile.bio} »
            </p>
          </div>
        )}

        {/* Carte localisation */}
        {profile.lat && profile.lng && (
          <div className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg text-[#0F172A]">Localisation</h2>
                {profile.adresse && (
                  <p className="text-sm text-[#0F172A]/45 mt-0.5 flex items-center gap-1.5">
                    <span className="text-xs">📍</span>{profile.adresse}
                  </p>
                )}
              </div>
            </div>
            <div style={{ height: 300 }}>
              <AgentMapPin lat={profile.lat} lng={profile.lng} label={displayName} />
            </div>
          </div>
        )}

        {/* Avis et notations */}
        <AvisAgents
          agentId={id}
          avis={avis ?? []}
          userId={user?.id}
          hasDejaNote={hasDejaNote}
        />

        {/* Formulaire contact */}
        <div id="contact">
          <ContactAgentForm agentId={id} agentName={displayName} />
        </div>

        {/* Listings */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-serif text-2xl text-[#0F172A]">Annonces publiées</h2>
            <span className="text-xs font-medium text-navy/35 bg-navy/06 px-2.5 py-1 rounded-full">{biens?.length ?? 0}</span>
          </div>

          {!biens?.length ? (
            <div className="bg-white rounded-2xl border border-[#0F172A]/08 py-16 text-center">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-[#0F172A]/40 text-sm">Aucune annonce publiée pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {biens.map((bien: any) => {
                const photos: any[] = bien.photos ?? []
                const photo = photos.find((p: any) => p.principale)?.url ?? photos[0]?.url
                const prixLabel = bien.type === 'location'
                  ? `${bien.prix.toLocaleString('fr-FR')} €/mois`
                  : bien.prix >= 1_000_000
                    ? `${(bien.prix / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} M€`
                    : `${bien.prix.toLocaleString('fr-FR')} €`

                return (
                  <Link key={bien.id} href={`/annonce/${bien.id}`}
                    className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block group">
                    {/* Photo */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                      {photo && (
                        <img src={photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                      <div className="absolute bottom-2 left-2 bg-[#0F172A]/85 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                        {prixLabel}
                      </div>
                      <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                        {bien.type === 'vente' ? 'Vente' : 'Location'}
                      </div>
                      {bien.coup_de_coeur && (
                        <div className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-amber-500">
                          ⭐ Coup de cœur
                        </div>
                      )}
                    </div>
                    {/* Infos */}
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-[#0F172A] mb-1 line-clamp-1 group-hover:text-[#4F46E5] transition-colors">
                        {bien.titre}
                      </h3>
                      <p className="text-xs text-[#0F172A]/40 mb-2">{bien.ville} · {bien.code_postal}</p>
                      <div className="flex gap-3 text-[11px] text-[#0F172A]/35">
                        {bien.surface && <span>{bien.surface} m²</span>}
                        {bien.pieces && <span>{bien.pieces} pièce{bien.pieces > 1 ? 's' : ''}</span>}
                        {bien.dpe && (
                          <span className="ml-auto font-semibold text-[#0F172A]/50">DPE {bien.dpe}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
