import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getViewUserId } from '@/lib/impersonation'

const STATUT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:  { label: 'Brouillon',   bg: '#f5f5f5',  color: '#888' },
  en_attente: { label: 'En attente',  bg: '#fef9c3',  color: '#854d0e' },
  publie:     { label: 'Publié',      bg: '#dcfce7',  color: '#166534' },
  archive:    { label: 'Archivé',     bg: '#f5f5f5',  color: '#888' },
  refuse:     { label: 'Refusé',      bg: '#fee2e2',  color: '#991b1b' },
}

const VISITE_STYLE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  confirme:   { label: 'Confirmée',  bg: '#D1FAE5', color: '#065F46', dot: '#10B981' },
  annule:     { label: 'Annulée',    bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
}

export default async function ComptePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const viewId   = await getViewUserId() ?? user.id
  const admin    = createAdminClient()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [
    { data: profile },
    { data: biens },
    { data: messages },
    { data: prochainesVisites },
    { data: derniersMessages },
    { data: avis },
  ] = await Promise.all([
    admin.from('profiles').select('prenom, nom, type, plan').eq('id', viewId).single(),
    admin.from('biens').select('id, titre, ville, prix, type, statut, vues, contacts, photos(url, principale)')
      .eq('user_id', viewId).order('created_at', { ascending: false }).limit(4),
    admin.from('contacts').select('id', { count: 'exact', head: true })
      .eq('vendeur_id', viewId).eq('lu', false),
    admin.from('visites')
      .select('id, demandeur_nom, date_souhaitee, creneau, statut, biens(id, titre, ville)')
      .eq('vendeur_id', viewId)
      .in('statut', ['en_attente', 'confirme'])
      .gte('date_souhaitee', todayStr)
      .order('date_souhaitee', { ascending: true })
      .limit(3),
    admin.from('contacts')
      .select('id, nom, message, created_at, lu, biens(id, titre)')
      .eq('vendeur_id', viewId)
      .order('created_at', { ascending: false })
      .limit(3),
    admin.from('avis_agents')
      .select('id, note, commentaire, created_at, profiles!auteur_id(prenom, nom)')
      .eq('agent_id', viewId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const totalVues       = biens?.reduce((s, b) => s + (b.vues  ?? 0), 0) ?? 0
  const biensPublies    = biens?.filter(b => b.statut === 'publie').length ?? 0
  const messagesNonLus  = (messages as any)?.length ?? 0
  // Note: messagesNonLus utilise count head=true → on récupère via meta

  // Récupérer les vrais counts depuis le head: true call
  const { count: countMessages } = await admin.from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('vendeur_id', viewId).eq('lu', false)
  const { count: countVisitesAttente } = await admin.from('visites')
    .select('id', { count: 'exact', head: true })
    .eq('vendeur_id', viewId).eq('statut', 'en_attente')
  const { count: countAvis } = await admin.from('avis_agents')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', viewId)

  const noteMoyenne = avis?.length
    ? (avis.reduce((s, a) => s + a.note, 0) / avis.length)
    : null

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="font-serif text-2xl sm:text-3xl text-navy mb-1">Bonjour, {profile?.prenom} 👋</h1>
      <p className="text-sm text-navy/50 mb-6 sm:mb-8">Voici un aperçu de votre activité</p>

      {/* ── KPI ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard icon="🏠" label="Annonces publiées" value={biensPublies} color="#4F46E5" href="/compte/mes-annonces" />
        <KpiCard icon="👁"  label="Vues totales"      value={totalVues}    color="#0891B2" href="/compte/statistiques" />
        <KpiCard icon="✉"  label="Messages non lus"  value={countMessages ?? 0} color={(countMessages ?? 0) > 0 ? '#DC2626' : '#94A3B8'} href="/compte/messages" />
        <KpiCard icon="📅" label="Visites en attente" value={countVisitesAttente ?? 0} color={(countVisitesAttente ?? 0) > 0 ? '#D97706' : '#94A3B8'} href="/compte/visites" />
      </div>

      {/* ── Ligne 2 : Visites + Messages ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Prochaines visites */}
        <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-navy/08">
            <h2 className="font-medium text-navy flex items-center gap-2">
              <span>📅</span> Prochaines visites
            </h2>
            <Link href="/compte/visites" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          {!prochainesVisites?.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-navy/40">Aucune visite à venir</p>
              <p className="text-xs text-navy/25 mt-1">Les demandes confirmées apparaîtront ici</p>
            </div>
          ) : (
            (prochainesVisites as any[]).map(v => {
              const d = new Date(v.date_souhaitee + 'T12:00:00')
              const cfg = VISITE_STYLE[v.statut] ?? VISITE_STYLE.en_attente
              return (
                <div key={v.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-navy/06 last:border-b-0 hover:bg-navy/02 transition-colors">
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-[10px] uppercase font-bold text-navy/35">
                      {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className="font-serif text-xl text-navy leading-tight">{d.getDate()}</div>
                    <div className="text-[10px] text-navy/40">
                      {d.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy truncate">{v.demandeur_nom}</div>
                    {v.biens && (
                      <div className="text-xs text-navy/45 truncate">{v.biens.titre}</div>
                    )}
                    {v.creneau && <div className="text-[11px] text-navy/35 mt-0.5">{v.creneau}</div>}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 inline-flex items-center gap-1"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Derniers messages */}
        <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-navy/08">
            <h2 className="font-medium text-navy flex items-center gap-2">
              <span>✉</span> Derniers messages
            </h2>
            <Link href="/compte/messages" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </div>
          {!derniersMessages?.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-navy/40">Aucun message reçu</p>
            </div>
          ) : (
            (derniersMessages as any[]).map(m => (
              <Link key={m.id} href={`/compte/messages/${m.id}`}
                className="flex items-start gap-3 px-4 sm:px-6 py-3 border-b border-navy/06 last:border-b-0 hover:bg-navy/02 transition-colors block">
                <div className="w-8 h-8 rounded-full bg-navy/08 flex items-center justify-center text-xs font-bold text-navy/60 flex-shrink-0">
                  {m.nom?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-navy truncate">{m.nom}</span>
                    {!m.lu && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  {m.biens && (
                    <div className="text-[11px] text-navy/45 truncate mt-0.5">📌 {m.biens.titre}</div>
                  )}
                  <p className="text-xs text-navy/55 line-clamp-1 mt-0.5">{m.message}</p>
                </div>
                <div className="text-[10px] text-navy/30 flex-shrink-0">
                  {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ── Avis (Pro uniquement, si présents) ────────────────── */}
      {profile?.type === 'pro' && (countAvis ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-navy/08">
            <h2 className="font-medium text-navy flex items-center gap-2">
              <span>⭐</span> Avis reçus
              {noteMoyenne !== null && (
                <span className="text-sm font-bold text-amber-500">
                  {noteMoyenne.toFixed(1)} <span className="text-xs text-navy/40 font-normal">({countAvis} avis)</span>
                </span>
              )}
            </h2>
            <Link href={`/vendeur/${viewId}`} className="text-xs text-primary hover:underline">Voir ma fiche →</Link>
          </div>
          {(avis as any[]).map(a => {
            const auteur = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
            return (
              <div key={a.id} className="px-4 sm:px-6 py-3 border-b border-navy/06 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-amber-400 text-sm">{'★'.repeat(a.note)}<span className="text-navy/15">{'★'.repeat(5 - a.note)}</span></div>
                  <span className="text-xs text-navy/60 font-medium">{auteur?.prenom} {auteur?.nom?.[0]}.</span>
                  <span className="text-[10px] text-navy/30">
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {a.commentaire && (
                  <p className="text-xs text-navy/65 line-clamp-2 italic">« {a.commentaire} »</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Dernières annonces ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-navy/08">
          <h2 className="font-medium text-navy flex items-center gap-2">
            <span>🏠</span> Dernières annonces
          </h2>
          <Link href="/compte/mes-annonces" className="text-xs text-primary hover:underline">Voir tout →</Link>
        </div>
        {!biens?.length ? (
          <div className="py-10 text-center text-sm text-navy/40">
            Aucune annonce pour l&apos;instant
          </div>
        ) : (
          biens.map((bien: any) => {
            const photo  = bien.photos?.find((p: any) => p.principale)?.url ?? bien.photos?.[0]?.url
            const statut = STATUT_STYLE[bien.statut] ?? STATUT_STYLE.brouillon
            const prix   = bien.type === 'location'
              ? `${bien.prix?.toLocaleString('fr-FR')} €/mois`
              : `${bien.prix?.toLocaleString('fr-FR')} €`
            return (
              <div key={bien.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-navy/06 last:border-b-0 hover:bg-navy/02 transition-colors">
                <div className="w-11 h-10 rounded-lg bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden flex-shrink-0">
                  {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: statut.bg, color: statut.color }}>
                      {statut.label}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-navy truncate leading-tight">{bien.titre}</div>
                  <div className="text-[11px] text-navy/45 mt-0.5 flex items-center gap-2">
                    <span className="truncate">{bien.ville}</span>
                    <span className="flex-shrink-0 font-medium text-navy/70">{prix}</span>
                  </div>
                </div>
                <div className="hidden sm:flex gap-3 text-[11px] text-navy/40 flex-shrink-0">
                  <span>👁 {bien.vues ?? 0}</span>
                  <span>✉ {bien.contacts ?? 0}</span>
                </div>
                <Link href={`/compte/mes-annonces/${bien.id}/modifier`}
                  className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-primary transition-colors flex-shrink-0">
                  Modifier
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* ── Action rapide ─────────────────────────────────────── */}
      <Link href="/publier"
        className="flex sm:inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
        + Publier un nouveau bien
      </Link>
    </div>
  )
}

/* ── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color, href }: {
  icon: string; label: string; value: number; color: string; href: string
}) {
  return (
    <Link href={href}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-navy/08 hover:border-primary/30 hover:-translate-y-0.5 transition-all block">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl sm:text-2xl">{icon}</span>
        <span className="font-serif text-2xl sm:text-3xl" style={{ color }}>{value}</span>
      </div>
      <div className="text-xs text-navy/50 font-medium">{label}</div>
    </Link>
  )
}
