import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ignorerSignalement, retrograderEtTraiter, suspendrEtTraiter } from './actions'

export const dynamic = 'force-dynamic'

const MOTIF_LABEL: Record<string, string> = {
  faux_pro:            'Fausse identité pro',
  arnaque:             'Suspicion d\'arnaque',
  contenu_inapproprie: 'Contenu inapproprié',
  prix_suspect:        'Prix suspect',
  photos_fausses:      'Photos fausses',
  bien_inexistant:     'Bien inexistant',
  doublon:             'Annonce en doublon',
  autre:               'Autre',
}

const STATUT_STYLE: Record<string, string> = {
  ouvert:  'bg-amber-50 text-amber-700 border-amber-200',
  ignore:  'bg-navy/06 text-navy/40 border-navy/12',
  traite:  'bg-green-50 text-green-700 border-green-200',
}

export default async function SignalementsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>
}) {
  const admin = createAdminClient()
  const { statut = 'ouvert' } = await searchParams

  const { data: signalements } = await admin
    .from('signalements')
    .select(`
      id, motif, message, statut, created_at, bien_id,
      reporter:reporter_id(id, prenom, nom),
      reported:reported_user_id(id, prenom, nom, agence, type),
      bien:bien_id(id, titre, ville)
    `)
    .eq('statut', statut)
    .order('created_at', { ascending: false })
    .limit(100)

  const { count: totalOuverts } = await admin
    .from('signalements')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'ouvert')

  const tabs = [
    { value: 'ouvert',  label: 'En attente', count: totalOuverts ?? 0 },
    { value: 'ignore',  label: 'Ignorés',    count: null },
    { value: 'traite',  label: 'Traités',    count: null },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-5xl">

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-navy mb-1">Signalements</h1>
        <p className="text-sm text-navy/45">Profils signalés par les utilisateurs connectés.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <Link key={tab.value} href={`/admin/signalements?statut=${tab.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
              statut === tab.value
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-navy/55 border-navy/15 hover:border-navy/35'
            }`}>
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                statut === tab.value ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              }`}>
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-navy/08 shadow-sm">
        {!signalements?.length ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-sm text-navy/40">Aucun signalement {statut === 'ouvert' ? 'en attente' : statut}</p>
          </div>
        ) : (
          <div className="divide-y divide-navy/06">
            {signalements.map((s: any) => {
              const reported = s.reported
              const reporter = s.reporter
              const displayName = reported?.agence || `${reported?.prenom ?? ''} ${reported?.nom ?? ''}`.trim()

              return (
                <div key={s.id} className="p-5 flex items-start gap-4 hover:bg-navy/01 transition-colors">

                  {/* Infos signalé */}
                  <div className="flex-1 min-w-0">
                    {/* Badge type : profil ou annonce */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.bien_id
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {s.bien_id ? '🏠 Annonce' : '👤 Profil'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {s.bien ? (
                        <Link href={`/annonce/${s.bien.id}`} target="_blank"
                          className="font-semibold text-navy text-sm hover:text-primary transition-colors">
                          {s.bien.titre} · {s.bien.ville} ↗
                        </Link>
                      ) : (
                        <span className="font-semibold text-navy text-sm">{displayName || '—'}</span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        reported?.type === 'pro'
                          ? 'bg-primary/08 text-primary border-primary/20'
                          : 'bg-navy/06 text-navy/40 border-navy/12'
                      }`}>
                        {reported?.type === 'pro' ? 'Pro' : 'Particulier'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUT_STYLE[s.statut]}`}>
                        {s.statut}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        {MOTIF_LABEL[s.motif] ?? s.motif}
                      </span>
                      <span className="text-xs text-navy/35">
                        par {reporter ? `${reporter.prenom} ${reporter.nom}` : 'utilisateur supprimé'}
                      </span>
                      <span className="text-xs text-navy/30">
                        {new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {s.message && (
                      <p className="text-xs text-navy/55 bg-navy/03 rounded-lg px-3 py-2 italic border border-navy/06">
                        « {s.message} »
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {statut === 'ouvert' && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link
                        href={s.bien_id ? `/annonce/${s.bien_id}` : `/vendeur/${reported?.id}`}
                        target="_blank"
                        title={s.bien_id ? "Voir l'annonce" : "Voir le profil"}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-navy/12 text-navy/40 hover:border-navy/30 hover:text-navy transition-colors text-xs">
                        {s.bien_id ? '🏠' : '👤'}
                      </Link>

                      <form action={ignorerSignalement.bind(null, s.id)}>
                        <button type="submit" title="Ignorer"
                          className="h-8 px-3 text-xs font-medium rounded-lg border border-navy/15 text-navy/50 hover:border-navy/30 hover:text-navy transition-colors whitespace-nowrap">
                          Ignorer
                        </button>
                      </form>

                      {!s.bien_id && (
                        <form action={retrograderEtTraiter.bind(null, s.id, reported?.id)}>
                          <button type="submit" title="Rétrograder en particulier"
                            className="h-8 px-3 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors whitespace-nowrap">
                            Rétrograder
                          </button>
                        </form>
                      )}

                      <form action={suspendrEtTraiter.bind(null, s.id, reported?.id)}>
                        <button type="submit" title="Suspendre le compte"
                          className="h-8 px-3 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">
                          Suspendre
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
