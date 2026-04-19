import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('prenom, nom, agence').eq('id', id).single()
  if (!profile) return { title: 'Vendeur — Terranova' }
  const name = profile.agence || `${profile.prenom} ${profile.nom}`
  return {
    title: `${name} — Terranova`,
    description: `Toutes les annonces de ${name} sur Terranova`,
  }
}

export default async function VendeurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: biens }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('biens').select('*, photos(url, principale)').eq('user_id', id).eq('statut', 'publie').order('publie_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const totalVues = biens?.reduce((s, b) => s + (b.vues ?? 0), 0) ?? 0
  const anneeInscription = new Date(profile.created_at).getFullYear()
  const initials = `${profile.prenom?.[0] ?? ''}${profile.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <header className="bg-[#0F172A] text-white px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-[#4F46E5] italic">nova</span>
        </Link>
        <Link href="/carte" className="text-white/50 hover:text-white text-sm transition-colors">← Retour à la carte</Link>
      </header>

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }} className="relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, #4F46E5 0%, transparent 60%)',
        }} />

        <div className="relative max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-start gap-6 flex-wrap">
            {/* Logo agence ou Avatar */}
            {profile.logo_url ? (
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-2 shadow-lg">
                <img src={profile.logo_url} alt={profile.agence ?? 'Logo'} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                  : initials
                }
              </div>
            )}

            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="font-serif text-3xl text-white">
                  {profile.agence || `${profile.prenom} ${profile.nom}`}
                </h1>
                {profile.type === 'pro' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: '#4F46E5' }}>
                    PRO
                  </span>
                )}
              </div>
              {profile.agence && (
                <p className="text-white/50 text-sm mb-3">{profile.prenom} {profile.nom}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 flex-wrap mb-4">
                <div>
                  <div className="text-2xl font-serif text-white">{biens?.length ?? 0}</div>
                  <div className="text-[11px] text-white/35">annonce{(biens?.length ?? 0) > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div className="text-2xl font-serif text-white">{totalVues.toLocaleString('fr-FR')}</div>
                  <div className="text-[11px] text-white/35">vues</div>
                </div>
                <div>
                  <div className="text-2xl font-serif text-white">{anneeInscription}</div>
                  <div className="text-[11px] text-white/35">membre depuis</div>
                </div>
              </div>

              {/* Contacts */}
              <div className="flex gap-3 flex-wrap">
                {profile.telephone && (
                  <a href={`tel:${profile.telephone}`}
                    className="flex items-center gap-2 text-sm text-white/70 hover:text-white border border-white/15 hover:border-white/30 px-4 py-2 rounded-lg transition-all">
                    📞 {profile.telephone}
                  </a>
                )}
                {profile.site_web && (
                  <a href={profile.site_web} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-white/70 hover:text-white border border-white/15 hover:border-white/30 px-4 py-2 rounded-lg transition-all">
                    🌐 Site web →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 mb-8">
            <p className="text-[#0F172A]/60 text-sm leading-relaxed italic">"{profile.bio}"</p>
          </div>
        )}

        {/* Listings */}
        <h2 className="font-serif text-xl text-[#0F172A] mb-4">
          Annonces publiées
          <span className="ml-2 text-sm font-sans text-[#0F172A]/40 font-normal">({biens?.length ?? 0})</span>
        </h2>

        {!biens?.length ? (
          <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-12 text-center">
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
                : bien.prix >= 1000000
                  ? `${(bien.prix / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
                  : `${bien.prix.toLocaleString('fr-FR')} €`

              return (
                <Link key={bien.id} href={`/annonce/${bien.id}`}
                  className="bg-white rounded-2xl border border-[#0F172A]/08 overflow-hidden hover:border-[#4F46E5]/30 hover:-translate-y-0.5 transition-all block group">
                  {/* Photo */}
                  <div className="relative aspect-[4/3] overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #E0DDD8, #C8C4BC)' }}>
                    {photo && (
                      <img src={photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    {/* Prix */}
                    <div className="absolute bottom-2 left-2 bg-[#0F172A]/85 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      {prixLabel}
                    </div>
                    {/* Type */}
                    <div className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ background: bien.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                      {bien.type === 'vente' ? 'Vente' : 'Location'}
                    </div>
                    {bien.coup_de_coeur && (
                      <div className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: '#F59E0B' }}>
                        ⭐ Coup de cœur
                      </div>
                    )}
                  </div>
                  {/* Infos */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-[#0F172A] mb-1 line-clamp-1">{bien.titre}</h3>
                    <p className="text-xs text-[#0F172A]/45 mb-2">{bien.ville} · {bien.code_postal}</p>
                    <div className="flex gap-3 text-[11px] text-[#0F172A]/40">
                      {bien.surface && <span>{bien.surface} m²</span>}
                      {bien.pieces && <span>{bien.pieces} pièce{bien.pieces > 1 ? 's' : ''}</span>}
                      {bien.dpe && <span>DPE {bien.dpe}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
