import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import ContactChercheurForm from './ContactChercheurForm'

interface Props {
  params: Promise<{ id: string }>
}

const CAT_LABEL: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', bureau: 'Bureau/Local',
  terrain: 'Terrain', parking: 'Parking', local: 'Local commercial',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('prenom, ville')
    .eq('id', id)
    .single()
  if (!profile) return { title: 'Chercheur introuvable — Terranova' }
  return {
    title: `${profile.prenom} cherche un bien — Terranova`,
    description: `Profil chercheur actif sur Terranova. Contactez-le si vous avez un bien à vendre ou à louer.`,
  }
}

export default async function ChercheurPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: recherche }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('id, prenom, nom, avatar_url, bio, type, agence').eq('id', id).single(),
    supabase.from('recherches').select('*').eq('user_id', id).eq('actif', true).single(),
    supabase.auth.getUser(),
  ])

  if (!profile || !recherche) notFound()

  const isSelf = user?.id === id
  const cats: string[] = (recherche.categories ?? []).map((c: string) => CAT_LABEL[c] ?? c)

  function fmtPrix(n: number) { return n.toLocaleString('fr-FR') }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-navy text-white px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-primary italic">nova</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/chercheurs" className="text-white/50 hover:text-white text-sm transition-colors">← Chercheurs</Link>
          {user
            ? <Link href="/compte" className="text-white/50 hover:text-white text-sm transition-colors">Mon compte</Link>
            : <Link href="/auth/login" className="text-white/50 hover:text-white text-sm transition-colors">Se connecter</Link>
          }
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Profil + critères */}
          <div className="lg:col-span-3 space-y-5">

            {/* Carte identité */}
            <div className="bg-white rounded-2xl border border-navy/08 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (profile.prenom?.[0] ?? '?').toUpperCase()
                  }
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-navy">{profile.prenom}</h1>
                  {profile.type === 'pro' && profile.agence && (
                    <p className="text-xs text-navy/50">{profile.agence}</p>
                  )}
                  {isSelf && (
                    <Link href="/compte/chercheur" className="text-xs text-primary hover:underline">Modifier mon profil →</Link>
                  )}
                </div>
              </div>
              {profile.bio && (
                <p className="text-sm text-navy/60 leading-relaxed">{profile.bio}</p>
              )}
            </div>

            {/* Critères */}
            <div className="bg-white rounded-2xl border border-navy/08 p-6">
              <h2 className="text-xs font-medium text-navy/50 uppercase tracking-wider mb-4">Critères de recherche</h2>
              <div className="space-y-3">

                {recherche.type && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy/40 w-28 flex-shrink-0">Transaction</span>
                    <span className="text-sm font-medium text-white px-2.5 py-0.5 rounded-full"
                      style={{ background: recherche.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                      {recherche.type === 'vente' ? 'Achat' : 'Location'}
                    </span>
                  </div>
                )}

                {cats.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-navy/40 w-28 flex-shrink-0 mt-1">Type de bien</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cats.map(c => (
                        <span key={c} className="text-xs bg-navy/06 text-navy/70 px-2.5 py-1 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {recherche.ville && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy/40 w-28 flex-shrink-0">Localisation</span>
                    <span className="text-sm text-navy">
                      {recherche.ville}
                      {recherche.rayon_km ? ` · ${recherche.rayon_km} km autour` : ''}
                    </span>
                  </div>
                )}

                {recherche.budget_visible && (recherche.prix_min || recherche.prix_max) && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy/40 w-28 flex-shrink-0">Budget</span>
                    <span className="text-sm text-navy font-medium">
                      {recherche.prix_min ? fmtPrix(recherche.prix_min) : '—'} – {recherche.prix_max ? fmtPrix(recherche.prix_max) : '—'} €
                    </span>
                  </div>
                )}

                {(recherche.surface_min || recherche.surface_max) && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy/40 w-28 flex-shrink-0">Surface</span>
                    <span className="text-sm text-navy">
                      {recherche.surface_min ? `≥ ${recherche.surface_min} m²` : ''}
                      {recherche.surface_min && recherche.surface_max ? ' · ' : ''}
                      {recherche.surface_max ? `≤ ${recherche.surface_max} m²` : ''}
                    </span>
                  </div>
                )}

                {recherche.pieces_min && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy/40 w-28 flex-shrink-0">Pièces</span>
                    <span className="text-sm text-navy">≥ {recherche.pieces_min} pièce{recherche.pieces_min > 1 ? 's' : ''}</span>
                  </div>
                )}

                {recherche.description && (
                  <div className="pt-3 border-t border-navy/06">
                    <p className="text-xs text-navy/40 mb-2">Description du projet</p>
                    <p className="text-sm text-navy/70 leading-relaxed">{recherche.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-navy/08 p-5 sticky top-20">
              {isSelf ? (
                <div className="text-center py-4">
                  <p className="text-sm text-navy/50 mb-3">C'est votre profil chercheur.</p>
                  <Link href="/compte/chercheur" className="text-sm font-medium text-primary hover:underline">
                    Modifier →
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-medium text-navy mb-1">Contacter {profile.prenom}</h2>
                  <p className="text-xs text-navy/45 mb-4">Présentez votre bien si il correspond à sa recherche.</p>
                  <ContactChercheurForm chercheurId={profile.id} chercheurPrenom={profile.prenom} />
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
