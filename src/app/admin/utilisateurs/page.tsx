import { createAdminClient } from '@/lib/supabase/admin'
import { startImpersonation, changeUserType } from './actions'
import PlanGrantButton from './PlanGrantButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminUtilisateursPage() {
  const admin = createAdminClient()

  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    admin.from('profiles').select('*, reseaux(nom)').order('created_at', { ascending: false }).limit(500),
    admin.auth.admin.listUsers({ perPage: 500 }),
  ])

  const emailById = Object.fromEntries(
    (authUsers?.users ?? []).map(u => [u.id, u.email ?? ''])
  )

  const pros        = profiles?.filter(p => p.type === 'pro') ?? []
  const particuliers = profiles?.filter(p => p.type !== 'pro') ?? []

  return (
    <div className="p-6 lg:p-10 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-navy mb-1">Utilisateurs</h1>
        <p className="text-sm text-navy/45">
          {profiles?.length ?? 0} compte{(profiles?.length ?? 0) > 1 ? 's' : ''} ·{' '}
          Cliquez sur le badge <span className="font-medium text-navy/60">Plan</span> pour débridage ·{' '}
          <span className="font-medium text-navy/60">Simuler</span> pour voir le compte d'un utilisateur
        </p>
      </div>

      {/* ── Pros ─────────────────────────────────────────────── */}
      <UserSection
        title="Professionnels"
        count={pros.length}
        emptyLabel="Aucun professionnel inscrit"
        users={pros}
        emailById={emailById}
        isPro
      />

      {/* ── Particuliers ─────────────────────────────────────── */}
      <UserSection
        title="Particuliers"
        count={particuliers.length}
        emptyLabel="Aucun particulier inscrit"
        users={particuliers}
        emailById={emailById}
        isPro={false}
      />
    </div>
  )
}

function UserSection({ title, count, emptyLabel, users, emailById, isPro }: {
  title: string
  count: number
  emptyLabel: string
  users: any[]
  emailById: Record<string, string>
  isPro: boolean
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-bold text-navy/40 uppercase tracking-widest">{title}</h2>
        <span className="bg-navy/06 text-navy/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">{count}</span>
      </div>

      <div className="bg-white rounded-2xl border border-navy/08 shadow-sm">
        {users.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-navy/35">{emptyLabel}</p>
          </div>
        ) : (
          <div className="divide-y divide-navy/06">
            {users.map((p: any, i: number) => {
              const email    = emailById[p.id] ?? ''
              const initials = `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase()
              const hasReseau = p.reseaux?.nom

              return (
                <div key={p.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-navy/01 transition-colors ${i === 0 ? 'rounded-t-2xl' : ''} ${i === users.length - 1 ? 'rounded-b-2xl' : ''}`}>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isPro ? 'bg-primary/12 text-primary' : 'bg-navy/08 text-navy/50'
                  }`}>
                    {initials || '?'}
                  </div>

                  {/* Identité */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-navy truncate">
                        {p.prenom} {p.nom}
                      </span>
                      {hasReseau && (
                        <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {p.reseaux.nom}
                        </span>
                      )}
                      {isPro && !hasReseau && (
                        <span className="text-[10px] text-navy/30">Indépendant</span>
                      )}
                    </div>
                    {email && (
                      <a href={`mailto:${email}`} className="text-xs text-navy/40 hover:text-primary transition-colors truncate block max-w-xs">
                        {email}
                      </a>
                    )}
                  </div>

                  {/* Plan (pros seulement) */}
                  {isPro && (
                    <div className="flex-shrink-0">
                      <PlanGrantButton
                        userId={p.id}
                        currentPlan={p.plan ?? 'gratuit'}
                        expireAt={p.plan_expire_at ?? null}
                      />
                    </div>
                  )}

                  {/* Annonces */}
                  {isPro && (
                    <div className="text-center flex-shrink-0 hidden sm:block w-14">
                      <div className="text-base font-serif font-medium text-navy">{p.annonces_actives ?? 0}</div>
                      <div className="text-[10px] text-navy/35">annonces</div>
                    </div>
                  )}

                  {/* Date inscription */}
                  <div className="text-xs text-navy/35 hidden lg:block flex-shrink-0 w-20 text-right">
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isPro && (
                      <>
                        <Link href={`/annonces?vendeur=${p.id}`} target="_blank"
                          title="Voir les annonces"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-navy/12 text-navy/40 hover:border-navy/30 hover:text-navy transition-colors text-xs">
                          📋
                        </Link>
                        <Link href={`/vendeur/${p.id}`} target="_blank"
                          title="Voir la fiche"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-navy/12 text-navy/40 hover:border-navy/30 hover:text-navy transition-colors text-xs">
                          👤
                        </Link>
                      </>
                    )}

                    {/* Toggle type */}
                    <form action={changeUserType.bind(null, p.id, isPro ? 'particulier' : 'pro')}>
                      <button type="submit" title={isPro ? '→ Particulier' : '→ Pro'}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition-colors ${
                          isPro
                            ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}>
                        {isPro ? '↓' : '↑'}
                      </button>
                    </form>

                    {/* Simuler */}
                    <form action={startImpersonation.bind(null, p.id)}>
                      <button type="submit"
                        className="h-8 px-3 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/85 transition-colors whitespace-nowrap">
                        Simuler
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
