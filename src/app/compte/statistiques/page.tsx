import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatPrix } from '@/lib/geo'
import LineChart from '@/components/stats/LineChart'
import BarChart from '@/components/stats/BarChart'

// Génère les 30 derniers jours sous forme YYYY-MM-DD
function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default async function StatistiquesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  // ── Annonces du vendeur ──────────────────────────────────────────────
  const { data: biens } = await supabase
    .from('biens')
    .select('id, titre, statut, prix, type, vues, favoris_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bienIds = (biens ?? []).map(b => b.id)

  // ── Historique vues 30 jours (toutes annonces cumulées) ─────────────
  const days = last30Days()
  let vuesTotalesCourbe: { date: string; value: number }[] = days.map(d => ({ date: d, value: 0 }))

  // ── Stats par bien (vues 30 jours + messages reçus) ──────────────────
  let vuesParBien: Record<string, number> = {}
  let messagesParBien: Record<string, number> = {}

  if (bienIds.length > 0) {
    const [{ data: vuesHist }, { data: contacts }] = await Promise.all([
      admin
        .from('vues_stats')
        .select('bien_id, date, count')
        .in('bien_id', bienIds)
        .gte('date', days[0]),
      admin
        .from('contacts')
        .select('bien_id')
        .in('bien_id', bienIds),
    ])

    // Courbe globale
    const dayMap: Record<string, number> = {}
    for (const row of vuesHist ?? []) {
      dayMap[row.date] = (dayMap[row.date] ?? 0) + row.count
      vuesParBien[row.bien_id] = (vuesParBien[row.bien_id] ?? 0) + row.count
    }
    vuesTotalesCourbe = days.map(d => ({ date: d, value: dayMap[d] ?? 0 }))

    // Contacts par bien
    for (const c of contacts ?? []) {
      messagesParBien[c.bien_id] = (messagesParBien[c.bien_id] ?? 0) + 1
    }
  }

  // ── KPIs globaux ─────────────────────────────────────────────────────
  const totalVues     = (biens ?? []).reduce((s, b) => s + (b.vues ?? 0), 0)
  const totalFavoris  = (biens ?? []).reduce((s, b) => s + (b.favoris_count ?? 0), 0)
  const totalMessages = Object.values(messagesParBien).reduce((s, v) => s + v, 0)
  const actives       = (biens ?? []).filter(b => b.statut === 'publie').length
  const vues30j       = vuesTotalesCourbe.reduce((s, d) => s + d.value, 0)

  // ── Graphique vues par annonce (30 derniers jours) ───────────────────
  const vuesBarData = (biens ?? [])
    .filter(b => b.statut === 'publie')
    .map(b => ({
      label: b.titre.split(' ').slice(0, 3).join(' '),
      value: vuesParBien[b.id] ?? 0,
    }))
    .sort((a, z) => z.value - a.value)
    .slice(0, 8)

  // ── Taux de conversion : vues → messages ─────────────────────────────
  const tauxConversion = vues30j > 0 ? ((totalMessages / vues30j) * 100).toFixed(1) : '0.0'

  const hasVuesHistory = vuesTotalesCourbe.some(d => d.value > 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-navy">Statistiques</h1>
        <p className="text-sm text-navy/50 mt-1">Performances de vos annonces sur les 30 derniers jours</p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Vues totales (30j)', value: vues30j.toLocaleString('fr-FR'), icon: '👁', color: '#4F46E5', sub: `${totalVues.toLocaleString('fr-FR')} au total` },
          { label: 'Messages reçus', value: totalMessages.toLocaleString('fr-FR'), icon: '✉', color: '#0891B2', sub: `Taux de contact : ${tauxConversion}%` },
          { label: 'Favoris', value: totalFavoris.toLocaleString('fr-FR'), icon: '♥', color: '#E05A5A', sub: 'Tous vos biens confondus' },
          { label: 'Annonces actives', value: actives.toLocaleString('fr-FR'), icon: '🏠', color: '#16A34A', sub: `${(biens ?? []).length} au total` },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-navy/08">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: kpi.color + '15', color: kpi.color }}>
                30j
              </span>
            </div>
            <div className="font-serif text-3xl text-navy mb-0.5">{kpi.value}</div>
            <div className="text-[11px] text-navy/40">{kpi.label}</div>
            <div className="text-[10px] text-navy/30 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Courbe vues ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-navy/08 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-medium text-navy">Évolution des vues</h2>
            <p className="text-xs text-navy/40 mt-0.5">30 derniers jours — toutes annonces</p>
          </div>
          <div className="text-right">
            <div className="font-serif text-2xl text-navy">{vues30j}</div>
            <div className="text-[10px] text-navy/35">vues sur la période</div>
          </div>
        </div>
        {hasVuesHistory ? (
          <LineChart data={vuesTotalesCourbe} color="#4F46E5" height={140} />
        ) : (
          <div className="h-36 flex flex-col items-center justify-center text-navy/30 text-sm gap-2">
            <span className="text-3xl">📊</span>
            <span>Les données de vues seront disponibles à partir d'aujourd'hui</span>
            <span className="text-xs text-navy/25">Le graphique se remplira au fil des visites</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── Vues par annonce ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-navy/08">
          <h2 className="font-medium text-navy mb-1">Vues par annonce</h2>
          <p className="text-xs text-navy/40 mb-4">30 derniers jours</p>
          {vuesBarData.length > 0 ? (
            <BarChart data={vuesBarData} color="#4F46E5" height={160} />
          ) : (
            <div className="h-36 flex items-center justify-center text-navy/30 text-sm">Aucune donnée</div>
          )}
        </div>

        {/* ── Messages par annonce ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-navy/08">
          <h2 className="font-medium text-navy mb-1">Messages reçus par annonce</h2>
          <p className="text-xs text-navy/40 mb-4">Depuis la création</p>
          {(biens ?? []).some(b => messagesParBien[b.id]) ? (
            <BarChart
              data={(biens ?? [])
                .filter(b => b.statut === 'publie')
                .map(b => ({
                  label: b.titre.split(' ').slice(0, 3).join(' '),
                  value: messagesParBien[b.id] ?? 0,
                  color: '#0891B2',
                }))
                .sort((a, z) => z.value - a.value)
                .slice(0, 8)
              }
              color="#0891B2"
              height={160}
            />
          ) : (
            <div className="h-36 flex items-center justify-center text-navy/30 text-sm">Aucun message reçu</div>
          )}
        </div>
      </div>

      {/* ── Tableau détaillé par annonce ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden">
        <div className="px-6 py-4 border-b border-navy/06">
          <h2 className="font-medium text-navy">Détail par annonce</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/06">
                {['Annonce', 'Statut', 'Prix', 'Vues (30j)', 'Vues totales', 'Messages', 'Favoris', 'Conversion'].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-navy/40 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(biens ?? []).map((b, i) => {
                const vues30 = vuesParBien[b.id] ?? 0
                const msgs = messagesParBien[b.id] ?? 0
                const conv = vues30 > 0 ? ((msgs / vues30) * 100).toFixed(1) + '%' : '—'
                const STATUT: Record<string, { label: string; color: string }> = {
                  publie:     { label: 'Publié',     color: '#16A34A' },
                  en_attente: { label: 'En attente', color: '#D97706' },
                  brouillon:  { label: 'Brouillon',  color: '#64748B' },
                  archive:    { label: 'Archivé',    color: '#94A3B8' },
                  refuse:     { label: 'Refusé',     color: '#DC2626' },
                }
                const st = STATUT[b.statut] ?? STATUT.brouillon
                return (
                  <tr key={b.id} className={`border-b border-navy/04 hover:bg-navy/02 transition-colors ${i % 2 === 0 ? '' : 'bg-navy/01'}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-navy text-xs truncate max-w-[160px]">{b.titre}</div>
                      <div className="text-[10px] text-navy/35 mt-0.5">
                        {new Date(b.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: st.color + '15', color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-navy whitespace-nowrap">
                      {formatPrix(b.prix, b.type)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy">{vues30}</span>
                        {vues30 > 0 && (
                          <div className="flex-1 h-1 bg-navy/08 rounded-full overflow-hidden w-12">
                            <div className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min((vues30 / Math.max(...Object.values(vuesParBien), 1)) * 100, 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-navy/60">{(b.vues ?? 0).toLocaleString('fr-FR')}</td>
                    <td className="px-5 py-3.5 text-xs text-navy/60">{msgs}</td>
                    <td className="px-5 py-3.5 text-xs text-navy/60">{b.favoris_count ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${msgs > 0 ? 'text-green-600' : 'text-navy/30'}`}>
                        {conv}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!(biens ?? []).length && (
            <div className="py-16 text-center text-navy/30 text-sm">Aucune annonce</div>
          )}
        </div>
      </div>
    </div>
  )
}
