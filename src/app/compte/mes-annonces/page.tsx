import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnnonceActions from '@/components/compte/AnnonceActions'
import { getViewUserId } from '@/lib/impersonation'

const STATUT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:  { label: 'Brouillon',  bg: '#f5f5f5', color: '#888' },
  en_attente: { label: 'En attente', bg: '#fef9c3', color: '#854d0e' },
  publie:     { label: 'Publié',     bg: '#dcfce7', color: '#166534' },
  archive:    { label: 'Archivé',    bg: '#f5f5f5', color: '#888' },
  refuse:     { label: 'Refusé',     bg: '#fee2e2', color: '#991b1b' },
}

export default async function MesAnnoncesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const viewId = await getViewUserId() ?? user.id
  const admin = createAdminClient()

  const { data: biens } = await admin
    .from('biens')
    .select('*, photos(url, principale, ordre)')
    .eq('user_id', viewId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-navy">Mes annonces</h1>
          <p className="text-sm text-navy/50 mt-0.5">{biens?.length ?? 0} annonce{(biens?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link href="/publier"
          className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
          + Nouvelle annonce
        </Link>
      </div>

      {!biens?.length ? (
        <div className="bg-white rounded-2xl border border-navy/08 py-16 text-center">
          <div className="text-4xl mb-3">🏠</div>
          <p className="text-sm text-navy/50 mb-4">Vous n'avez pas encore d'annonce</p>
          <Link href="/publier" className="inline-block bg-primary text-white text-sm px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors">
            Publier mon premier bien
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {biens.map((bien: any) => {
            const photos = (bien.photos ?? []).sort((a: any, b: any) => (b.principale ? 1 : 0) - (a.principale ? 1 : 0) || a.ordre - b.ordre)
            const photo = photos[0]?.url
            const statut = STATUT_STYLE[bien.statut] ?? STATUT_STYLE.brouillon
            const prix = bien.type === 'location'
              ? `${bien.prix?.toLocaleString('fr-FR')} €/mois`
              : bien.prix >= 1000000
                ? `${(bien.prix / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
                : `${bien.prix?.toLocaleString('fr-FR')} €`

            return (
              <div key={bien.id} className="bg-white rounded-2xl border border-navy/08 overflow-hidden hover:border-navy/15 transition-all">
                <div className="flex items-center gap-5 p-4">
                  {/* Photo */}
                  <div className="w-24 h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden">
                    {photo
                      ? <img src={photo} alt={bien.titre} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🏠</div>
                    }
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statut.bg, color: statut.color }}>
                        {statut.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${bien.type === 'vente' ? 'bg-primary/10 text-primary' : 'bg-location/10 text-location'}`}>
                        {bien.type === 'vente' ? 'Vente' : 'Location'}
                      </span>
                      <span className="text-[10px] text-navy/35">
                        {new Date(bien.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-navy truncate">{bien.titre}</h3>
                    <p className="text-xs text-navy/50 mt-0.5">{bien.ville} {bien.code_postal}</p>
                    <p className="font-serif text-base text-navy mt-1">{prix}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <div className="flex gap-4 text-xs text-navy/40 mb-2 justify-end">
                      <span title="Vues">👁 {bien.vues ?? 0}</span>
                      <span title="Favoris">♥ {bien.favoris_count ?? 0}</span>
                      <span title="Contacts">✉ {bien.contacts ?? 0}</span>
                    </div>
                    {bien.expire_at && (
                      <div className="text-[10px] text-navy/35 mb-2">
                        Expire le {new Date(bien.expire_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Link href={`/annonce/${bien.id}`}
                      className="text-xs border border-navy/15 px-3 py-2 rounded-lg hover:border-navy/30 transition-colors text-navy/60">
                      Voir
                    </Link>
                    <Link href={`/compte/mes-annonces/${bien.id}/modifier`}
                      className="text-xs bg-navy text-white px-3 py-2 rounded-lg hover:bg-primary transition-colors">
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
      )}
    </div>
  )
}
