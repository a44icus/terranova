import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chercheurs actifs — Terranova',
  description: 'Acheteurs et locataires qui cherchent activement un bien immobilier.',
}

const CAT_LABEL: Record<string, string> = {
  appartement: 'Appt', maison: 'Maison', bureau: 'Bureau',
  terrain: 'Terrain', parking: 'Parking', local: 'Local',
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (!min && !max) return ''
  if (min && max) return `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} €`
  if (min) return `Dès ${min.toLocaleString('fr-FR')} €`
  return `Jusqu'à ${max!.toLocaleString('fr-FR')} €`
}

export default async function ChercheurListPage() {
  const supabase = await createClient()

  const { data: recherches } = await supabase
    .from('recherches')
    .select(`
      id, type, categories, ville, rayon_km,
      prix_min, prix_max, surface_min, surface_max, pieces_min,
      description, budget_visible, created_at,
      profiles!inner(id, prenom, nom, avatar_url, type)
    `)
    .eq('actif', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-navy text-white px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="font-serif text-[22px] tracking-wide">
          Terra<span className="text-primary italic">nova</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/carte" className="text-white/50 hover:text-white text-sm transition-colors">Carte</Link>
          <Link href="/compte" className="text-white/50 hover:text-white text-sm transition-colors">Mon compte</Link>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-navy mb-2">Chercheurs actifs</h1>
          <p className="text-sm text-navy/50">
            {recherches?.length ?? 0} acheteur{(recherches?.length ?? 0) > 1 ? 's' : ''} et locataire{(recherches?.length ?? 0) > 1 ? 's' : ''} en recherche active.
            Contactez-les directement si vous avez un bien correspondant.
          </p>
        </div>

        {!recherches?.length ? (
          <div className="bg-white rounded-2xl border border-navy/08 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-navy/40 text-sm">Aucun chercheur actif pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recherches.map((r: any) => {
              const profile = r.profiles
              const budget = r.budget_visible ? formatBudget(r.prix_min, r.prix_max) : null
              const cats: string[] = (r.categories ?? []).map((c: string) => CAT_LABEL[c] ?? c)

              return (
                <Link key={r.id} href={`/chercheurs/${profile.id}`}
                  className="block bg-white rounded-2xl border border-navy/08 p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white font-semibold text-base overflow-hidden">
                      {profile.avatar_url
                        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (profile.prenom?.[0] ?? '?').toUpperCase()
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-navy">{profile.prenom}</span>
                        {profile.type === 'pro' && (
                          <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Pro</span>
                        )}
                        {r.type && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ background: r.type === 'vente' ? '#4F46E5' : '#0891B2' }}>
                            {r.type === 'vente' ? 'Achat' : 'Location'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cats.map(c => (
                          <span key={c} className="text-[11px] px-2 py-0.5 bg-navy/05 text-navy/60 rounded-full">{c}</span>
                        ))}
                        {r.ville && (
                          <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                            📍 {r.ville}{r.rayon_km ? ` (${r.rayon_km} km)` : ''}
                          </span>
                        )}
                        {budget && (
                          <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{budget}</span>
                        )}
                        {r.surface_min && (
                          <span className="text-[11px] px-2 py-0.5 bg-navy/05 text-navy/60 rounded-full">≥ {r.surface_min} m²</span>
                        )}
                        {r.pieces_min && (
                          <span className="text-[11px] px-2 py-0.5 bg-navy/05 text-navy/60 rounded-full">≥ {r.pieces_min} pièces</span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-xs text-navy/50 mt-2 line-clamp-2">{r.description}</p>
                      )}
                    </div>

                    <svg className="w-4 h-4 text-navy/25 group-hover:text-primary flex-shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-10 bg-white rounded-2xl border border-navy/08 p-6 flex items-start gap-4">
          <div className="text-3xl">🔔</div>
          <div>
            <p className="text-sm font-medium text-navy mb-1">Vous cherchez un bien ?</p>
            <p className="text-xs text-navy/50 mb-3">Activez votre profil chercheur pour que les vendeurs vous contactent directement.</p>
            <Link href="/compte/chercheur" className="text-xs font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
              Activer mon profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
