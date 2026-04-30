import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatPrix } from '@/lib/geo'
import PeriodChart from '@/components/stats/PeriodChart'
import DonutChart from '@/components/stats/DonutChart'
import { getViewUserId } from '@/lib/impersonation'
import Link from 'next/link'

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

const STATUT_BIEN: Record<string, { label: string; color: string }> = {
  publie:     { label: 'Publié',     color: '#16A34A' },
  en_attente: { label: 'En attente', color: '#D97706' },
  brouillon:  { label: 'Brouillon',  color: '#64748B' },
  archive:    { label: 'Archivé',    color: '#94A3B8' },
  refuse:     { label: 'Refusé',     color: '#DC2626' },
}

const VISITE_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  en_attente: { label: 'En attente', bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  confirme:   { label: 'Confirmée',  bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  annule:     { label: 'Annulée',    bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
}

export default async function StatistiquesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin    = createAdminClient()
  const viewId   = await getViewUserId() ?? user.id
  const todayStr = new Date().toISOString().slice(0, 10)
  const days     = last30Days()

  const [
    { data: biens },
    { data: toutesVisites },
    { data: prochainesVisites },
    { data: visitesRecentes },
  ] = await Promise.all([
    admin.from('biens')
      .select('id, titre, statut, prix, type, vues, favoris_count, created_at')
      .eq('user_id', viewId)
      .order('created_at', { ascending: false }),

    admin.from('visites').select('statut').eq('vendeur_id', viewId),

    admin.from('visites')
      .select('id, demandeur_nom, demandeur_email, date_souhaitee, creneau, statut, biens(id, titre, ville)')
      .eq('vendeur_id', viewId)
      .in('statut', ['confirme', 'en_attente'])
      .gte('date_souhaitee', todayStr)
      .order('date_souhaitee', { ascending: true })
      .limit(5),

    admin.from('visites')
      .select('id, demandeur_nom, demandeur_email, date_souhaitee, creneau, statut, biens(id, titre, ville)')
      .eq('vendeur_id', viewId)
      .lt('date_souhaitee', todayStr)
      .order('date_souhaitee', { ascending: false })
      .limit(6),
  ])

  const bienIds = (biens ?? []).map(b => b.id)
  let vuesTotalesCourbe = days.map(d => ({ date: d, value: 0 }))
  let vuesParBien:    Record<string, number> = {}
  let messagesParBien: Record<string, number> = {}

  if (bienIds.length > 0) {
    const [{ data: vuesHist }, { data: contacts }] = await Promise.all([
      admin.from('vues_stats').select('bien_id, date, count').in('bien_id', bienIds).gte('date', days[0]),
      admin.from('contacts').select('bien_id').in('bien_id', bienIds),
    ])
    const dayMap: Record<string, number> = {}
    for (const row of vuesHist ?? []) {
      dayMap[row.date] = (dayMap[row.date] ?? 0) + row.count
      vuesParBien[row.bien_id] = (vuesParBien[row.bien_id] ?? 0) + row.count
    }
    vuesTotalesCourbe = days.map(d => ({ date: d, value: dayMap[d] ?? 0 }))
    for (const c of contacts ?? []) {
      messagesParBien[c.bien_id] = (messagesParBien[c.bien_id] ?? 0) + 1
    }
  }

  const totalVues      = (biens ?? []).reduce((s, b) => s + (b.vues  ?? 0), 0)
  const totalFavoris   = (biens ?? []).reduce((s, b) => s + (b.favoris_count ?? 0), 0)
  const totalMessages  = Object.values(messagesParBien).reduce((s, v) => s + v, 0)
  const actives        = (biens ?? []).filter(b => b.statut === 'publie').length
  const vues30j        = vuesTotalesCourbe.reduce((s, d) => s + d.value, 0)
  const tauxConversion = vues30j > 0 ? ((totalMessages / vues30j) * 100).toFixed(1) : '0.0'

  const visitesTotal    = toutesVisites?.length ?? 0
  const visitesAttente  = toutesVisites?.filter(v => v.statut === 'en_attente').length ?? 0
  const visitesConfirme = toutesVisites?.filter(v => v.statut === 'confirme').length  ?? 0
  const visitesAnnule   = toutesVisites?.filter(v => v.statut === 'annule').length    ?? 0

  const maxVues = Math.max(...Object.values(vuesParBien), 1)

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-5" style={{ background: '#F4F5F7' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-xl sm:text-2xl text-[#0F172A]">Tableau de bord</h1>
        <div className="flex gap-2">
          <Link href="/compte/visites"
            className="hidden sm:block text-sm font-medium border border-[#0F172A]/15 text-[#0F172A]/70 px-4 py-2 rounded-xl hover:bg-white transition-colors">
            Planifier une visite
          </Link>
          <Link href="/publier"
            className="text-sm font-semibold bg-[#4F46E5] text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-[#4338CA] transition-colors whitespace-nowrap">
            + Annonce
          </Link>
        </div>
      </div>

      {/* ── 4 KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Vues totales"
          value={totalVues.toLocaleString('fr-FR')}
          trend={`+${vues30j} sur 30j`}
          trendUp={vues30j > 0}
          sub="toutes annonces"
          icon={<EyeIcon />}
          iconColor="#4F46E5"
        />
        <KpiCard
          label="Annonces actives"
          value={actives.toLocaleString('fr-FR')}
          trend={`${(biens ?? []).length} au total`}
          trendUp={actives > 0}
          trendNeutral
          sub={`${totalFavoris} mis en favoris`}
          icon={<HomeIcon />}
          iconColor="#0891B2"
        />
        <KpiCard
          label="Messages reçus"
          value={totalMessages.toLocaleString('fr-FR')}
          trend={`Taux ${tauxConversion}%`}
          trendUp={parseFloat(tauxConversion) > 1}
          sub="depuis le début"
          icon={<MailIcon />}
          iconColor="#7C3AED"
        />
        <KpiCard
          label="Demandes de visite"
          value={visitesTotal.toLocaleString('fr-FR')}
          trend={visitesAttente > 0 ? `${visitesAttente} en attente` : 'Aucune en attente'}
          trendUp={false}
          trendNeutral={visitesAttente === 0}
          sub={`${visitesConfirme} confirmée${visitesConfirme > 1 ? 's' : ''}`}
          icon={<CalIcon />}
          iconColor="#D97706"
        />
      </div>

      {/* ── Ligne 2 : Graphique + Prochaines visites ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Graphique — 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-medium text-[#0F172A] text-base">Activité mensuelle des vues</h2>
              <p className="text-xs text-[#0F172A]/40 mt-0.5">Toutes vos annonces · 30 derniers jours</p>
            </div>
          </div>
          <PeriodChart data30j={vuesTotalesCourbe} color="#4F46E5" />
        </div>

        {/* Prochaines visites — 1/3 */}
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(15,23,42,0.06)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-medium text-[#0F172A] text-base">Prochaines visites</h2>
          </div>

          <div className="flex-1 overflow-auto">
            {!(prochainesVisites?.length) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <div className="w-12 h-12 rounded-2xl bg-[#4F46E5]/08 flex items-center justify-center mb-3">
                  <CalIcon color="#4F46E5" />
                </div>
                <p className="text-sm font-medium text-[#0F172A]/40">Aucune visite à venir</p>
                <p className="text-xs text-[#0F172A]/25 mt-1">Les demandes confirmées apparaîtront ici</p>
              </div>
            ) : (prochainesVisites as any[]).map(v => {
              const d      = new Date(v.date_souhaitee + 'T12:00:00')
              const jour   = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
              const isToday = v.date_souhaitee === todayStr
              const cfg    = VISITE_CFG[v.statut] ?? VISITE_CFG.en_attente
              return (
                <div key={v.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#F4F5F7] transition-colors border-t border-[#0F172A]/04 first:border-0">
                  {/* Heure / créneau */}
                  <div className={`flex-shrink-0 text-center min-w-[46px] rounded-xl py-2 px-1
                    ${isToday ? 'bg-[#4F46E5]' : 'bg-[#0F172A]/05'}`}>
                    <div className={`text-[9px] font-bold uppercase tracking-wide ${isToday ? 'text-white/60' : 'text-[#0F172A]/35'}`}>
                      {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`font-serif text-xl leading-tight ${isToday ? 'text-white' : 'text-[#0F172A]'}`}>
                      {d.getDate()}
                    </div>
                    <div className={`text-[9px] ${isToday ? 'text-white/50' : 'text-[#0F172A]/30'}`}>
                      {d.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0F172A] truncate">{v.demandeur_nom}</div>
                    {v.biens && (
                      <div className="text-[11px] text-[#0F172A]/40 truncate mt-0.5 flex items-center gap-1">
                        <span>📍</span>{v.biens.titre}
                      </div>
                    )}
                    {v.creneau && (
                      <div className="text-[10px] text-[#0F172A]/30 mt-0.5">{v.creneau}</div>
                    )}
                  </div>

                  {/* Lien */}
                  <a href={`mailto:${v.demandeur_email}`}
                    className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#0F172A]/04 flex items-center justify-center text-[#0F172A]/35 hover:bg-[#4F46E5]/10 hover:text-[#4F46E5] transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-[#0F172A]/06 px-5 py-3">
            <Link href="/compte/visites"
              className="text-xs font-medium text-[#0F172A]/40 hover:text-[#4F46E5] transition-colors flex items-center gap-1">
              Voir toutes les visites
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Ligne 3 : Tableau visites récentes + Donut ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Tableau — 2/3 */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-[0_1px_4px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#0F172A]/05">
            <h2 className="font-medium text-[#0F172A]">Visites récentes</h2>
            <Link href="/compte/visites"
              className="text-xs text-[#4F46E5] hover:underline font-medium">
              Tout voir →
            </Link>
          </div>

          {!(visitesRecentes?.length) ? (
            <div className="py-14 text-center">
              <p className="text-sm text-[#0F172A]/30">Aucune visite passée</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0F172A]/05">
                  {['Bien', 'Date', 'Visiteur', 'Statut', ''].map((h, i) => (
                    <th key={i} className="text-left text-[10px] font-semibold text-[#0F172A]/30 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(visitesRecentes as any[]).map(v => {
                  const cfg = VISITE_CFG[v.statut] ?? VISITE_CFG.en_attente
                  const d   = new Date(v.date_souhaitee + 'T12:00:00')
                  return (
                    <tr key={v.id} className="border-b border-[#0F172A]/04 last:border-0 hover:bg-[#F4F5F7] transition-colors">
                      <td className="px-6 py-3.5">
                        {v.biens ? (
                          <>
                            <a href={`/annonce/${v.biens.id}`}
                              className="text-xs font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors line-clamp-1 block max-w-[160px]">
                              {v.biens.titre}
                            </a>
                            <div className="text-[10px] text-[#0F172A]/35 mt-0.5 flex items-center gap-0.5">
                              <span>📍</span>{v.biens.ville}
                            </div>
                          </>
                        ) : <span className="text-xs text-[#0F172A]/25">—</span>}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-[#0F172A]/70">
                          {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                        {v.creneau && <div className="text-[10px] text-[#0F172A]/35 mt-0.5">{v.creneau}</div>}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#4F46E5]/15 flex items-center justify-center text-[10px] font-bold text-[#4F46E5] flex-shrink-0">
                            {v.demandeur_nom[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-[#0F172A]">{v.demandeur_nom}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.text }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <a href={`mailto:${v.demandeur_email}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#0F172A]/10 text-[#0F172A]/35 hover:border-[#4F46E5]/40 hover:text-[#4F46E5] transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Donut — 1/3 */}
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(15,23,42,0.06)] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-medium text-[#0F172A]">Visites par statut</h2>
            <span className="text-[10px] font-semibold text-[#0F172A]/35 bg-[#0F172A]/05 px-2.5 py-1 rounded-full">
              Ce mois
            </span>
          </div>
          <DonutChart
            data={[
              { label: 'En attente', value: visitesAttente,  color: '#F59E0B' },
              { label: 'Confirmées', value: visitesConfirme, color: '#10B981' },
              { label: 'Annulées',   value: visitesAnnule,   color: '#E2E8F0' },
            ].filter(d => d.value > 0)}
            total={visitesTotal}
            centerLine1={String(visitesTotal)}
            centerLine2="visites"
            size={150}
          />
        </div>
      </div>

      {/* ── Ligne 4 : Tableau annonces ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#0F172A]/05">
          <h2 className="font-medium text-[#0F172A]">Mes annonces</h2>
          <span className="text-xs text-[#0F172A]/35">{(biens ?? []).length} annonce{(biens ?? []).length > 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto -mx-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0F172A]/05">
                {['Annonce', 'Statut', 'Prix', 'Vues 30j', 'Messages', 'Favoris', 'Conversion'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-[#0F172A]/30 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(biens ?? []).map(b => {
                const vues30 = vuesParBien[b.id]    ?? 0
                const msgs   = messagesParBien[b.id] ?? 0
                const conv   = vues30 > 0 ? ((msgs / vues30) * 100).toFixed(1) + '%' : '—'
                const st     = STATUT_BIEN[b.statut] ?? STATUT_BIEN.brouillon
                return (
                  <tr key={b.id} className="border-b border-[#0F172A]/04 last:border-0 hover:bg-[#F4F5F7] transition-colors">
                    <td className="px-6 py-3.5">
                      <Link href={`/annonce/${b.id}`}
                        className="text-xs font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors line-clamp-1 max-w-[200px] block">
                        {b.titre}
                      </Link>
                      <div className="text-[10px] text-[#0F172A]/30 mt-0.5">
                        {new Date(b.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.color + '18', color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold text-[#0F172A] whitespace-nowrap">
                      {formatPrix(b.prix, b.type)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-[#0F172A]">{vues30}</span>
                        {vues30 > 0 && (
                          <div className="h-1.5 bg-[#0F172A]/08 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-[#4F46E5] rounded-full transition-all"
                              style={{ width: `${Math.min((vues30 / maxVues) * 100, 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-[#0F172A]/60">{msgs}</td>
                    <td className="px-6 py-3.5 text-xs font-medium text-[#0F172A]/60">{b.favoris_count ?? 0}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-bold ${msgs > 0 ? 'text-[#16A34A]' : 'text-[#0F172A]/20'}`}>
                        {conv}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!(biens ?? []).length && (
                <tr><td colSpan={7} className="py-14 text-center text-[#0F172A]/25 text-sm">Aucune annonce</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

/* ── KPI Card ──────────────────────────────────────────────────────────── */
function KpiCard({ label, value, trend, trendUp, trendNeutral, sub, icon, iconColor }: {
  label: string; value: string; trend: string; trendUp: boolean
  trendNeutral?: boolean; sub: string; icon: React.ReactNode; iconColor: string
}) {
  const trendColor = trendNeutral ? '#94A3B8' : trendUp ? '#16A34A' : '#DC2626'
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconColor + '15' }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: iconColor + 'AA' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10"/>
        </svg>
      </div>
      <div className="font-serif text-3xl text-[#0F172A] mb-0.5 leading-none">{value}</div>
      <div className="text-xs font-semibold text-[#0F172A]/60 mb-1">{label}</div>
      <div className="text-[11px] font-medium" style={{ color: trendColor }}>{trend}</div>
    </div>
  )
}

/* ── Icônes ─────────────────────────────────────────────────────────────── */
function EyeIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
}
function HomeIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
}
function MailIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
}
function CalIcon({ color }: { color?: string }) {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color ?? 'currentColor'} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
}
