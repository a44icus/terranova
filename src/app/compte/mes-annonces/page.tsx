import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnnonceActions from '@/components/compte/AnnonceActions'
import { getViewUserId } from '@/lib/impersonation'
import { formatPrix } from '@/lib/geo'

const PER_PAGE = 12

const STATUT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:  { label: 'Brouillon',  bg: '#f5f5f5', color: '#888' },
  en_attente: { label: 'En attente', bg: '#fef9c3', color: '#854d0e' },
  publie:     { label: 'Publié',     bg: '#dcfce7', color: '#166534' },
  archive:    { label: 'Archivé',    bg: '#f5f5f5', color: '#888' },
  refuse:     { label: 'Refusé',     bg: '#fee2e2', color: '#991b1b' },
}

const FILTRES = [
  { key: '',           label: 'Toutes' },
  { key: 'publie',     label: 'Publiées' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'brouillon',  label: 'Brouillons' },
  { key: 'archive',    label: 'Archivées' },
  { key: 'refuse',     label: 'Refusées' },
]

interface Props {
  searchParams: Promise<{ statut?: string; page?: string }>
}

export default async function MesAnnoncesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { statut: statutFilter = '', page: pageStr = '1' } = await searchParams
  const page    = Math.max(1, parseInt(pageStr) || 1)
  const from    = (page - 1) * PER_PAGE
  const to      = from + PER_PAGE - 1

  const viewId = await getViewUserId() ?? user.id
  const admin  = createAdminClient()

  // Compte par statut pour les badges de filtre
  const { data: counts } = await admin
    .from('biens')
    .select('statut')
    .eq('user_id', viewId)

  const countsByStatut = (counts ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.statut] = (acc[b.statut] ?? 0) + 1
    return acc
  }, {})
  const total = counts?.length ?? 0

  // Fetch paginé + filtré
  let query = admin
    .from('biens')
    .select('*, photos(url, principale, ordre)', { count: 'exact' })
    .eq('user_id', viewId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statutFilter) query = query.eq('statut', statutFilter)

  const { data: biens, count: filteredCount } = await query

  const totalPages = Math.ceil((filteredCount ?? 0) / PER_PAGE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (statutFilter) params.set('statut', statutFilter)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/compte/mes-annonces${qs ? `?${qs}` : ''}`
  }

  function filtreUrl(s: string) {
    return s ? `/compte/mes-annonces?statut=${s}` : '/compte/mes-annonces'
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-2xl text-navy">Mes annonces</h1>
          <p className="text-sm text-navy/50 mt-0.5">{total} annonce{total > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/publier"
          className="bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors whitespace-nowrap">
          + Nouvelle
        </Link>
      </div>

      {/* Filtres par statut */}
      {total > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
          {FILTRES.map(f => {
            const count = f.key ? (countsByStatut[f.key] ?? 0) : total
            if (f.key && count === 0) return null
            const isActive = statutFilter === f.key
            return (
              <Link key={f.key} href={filtreUrl(f.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'bg-white border border-navy/12 text-navy/60 hover:border-navy/25 hover:text-navy'
                }`}>
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-navy/08 text-navy/50'
                }`}>{count}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Liste vide */}
      {!biens?.length ? (
        <div className="bg-white rounded-2xl border border-navy/08 py-16 text-center">
          <div className="text-4xl mb-3">🏠</div>
          {total === 0 ? (
            <>
              <p className="text-sm text-navy/50 mb-4">Vous n'avez pas encore d'annonce</p>
              <Link href="/publier" className="inline-block bg-primary text-white text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
                Publier mon premier bien
              </Link>
            </>
          ) : (
            <p className="text-sm text-navy/50">Aucune annonce pour ce filtre</p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {biens.map((bien: any) => {
              const photos = (bien.photos ?? []).sort((a: any, b: any) =>
                (b.principale ? 1 : 0) - (a.principale ? 1 : 0) || a.ordre - b.ordre
              )
              const photo  = photos[0]?.url
              const statut = STATUT_STYLE[bien.statut] ?? STATUT_STYLE.brouillon
              const prix   = formatPrix(bien.prix, bien.type)

              return (
                <div key={bien.id} className="bg-white rounded-2xl border border-navy/08 overflow-hidden hover:border-navy/15 transition-all">
                  <div className="flex items-center gap-4 p-4">
                    {/* Photo */}
                    <div className="w-20 h-16 sm:w-24 sm:h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden">
                      {photo
                        ? <img src={photo} alt={bien.titre} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🏠</div>
                      }
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: statut.bg, color: statut.color }}>
                          {statut.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          bien.type === 'vente' ? 'bg-primary/10 text-primary' : 'bg-location/10 text-location'
                        }`}>
                          {bien.type === 'vente' ? 'Vente' : 'Location'}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-navy truncate">{bien.titre}</h3>
                      <p className="text-xs text-navy/50 mt-0.5">{bien.ville}{bien.code_postal ? ` ${bien.code_postal}` : ''}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-serif text-sm text-navy">{prix}</span>
                        <span className="text-[10px] text-navy/35 hidden sm:inline">
                          {new Date(bien.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Stats — desktop seulement */}
                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 text-xs text-navy/40">
                      <span title="Vues">👁 {bien.vues ?? 0}</span>
                      <span title="Favoris">♥ {bien.favoris_count ?? 0}</span>
                      <span title="Contacts">✉ {bien.contacts ?? 0}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                      <Link href={`/annonce/${bien.id}`}
                        className="text-xs border border-navy/15 px-2.5 py-1.5 rounded-lg hover:border-navy/30 transition-colors text-navy/60 text-center">
                        Voir
                      </Link>
                      <Link href={`/compte/mes-annonces/${bien.id}/modifier`}
                        className="text-xs bg-navy text-white px-2.5 py-1.5 rounded-lg hover:bg-primary transition-colors text-center">
                        Modifier
                      </Link>
                      <AnnonceActions bienId={bien.id} statut={bien.statut} />
                    </div>
                  </div>

                  {bien.statut === 'en_attente' && (
                    <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                      <span>⏳</span>
                      Votre annonce est en cours de modération — elle sera visible sous 24h.
                    </div>
                  )}
                  {bien.statut === 'refuse' && (
                    <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-700 flex items-center gap-2">
                      <span>❌</span>
                      Annonce refusée. Modifiez-la et soumettez-la à nouveau.
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-navy/08">
              <span className="text-xs text-navy/40">
                Page {page} sur {totalPages} · {filteredCount} annonce{(filteredCount ?? 0) > 1 ? 's' : ''}
              </span>
              <div className="flex gap-1.5">
                {page > 1 && (
                  <Link href={pageUrl(page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-navy/15 text-xs text-navy/60 hover:border-navy/30 transition-colors">
                    ← Précédent
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-navy/30">…</span>
                    ) : (
                      <Link key={p} href={pageUrl(p as number)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          p === page
                            ? 'bg-navy text-white'
                            : 'border border-navy/15 text-navy/60 hover:border-navy/30'
                        }`}>
                        {p}
                      </Link>
                    )
                  )}
                {page < totalPages && (
                  <Link href={pageUrl(page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-navy/15 text-xs text-navy/60 hover:border-navy/30 transition-colors">
                    Suivant →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
