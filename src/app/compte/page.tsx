import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrix } from '@/lib/geo'
import { getViewUserId } from '@/lib/impersonation'

export default async function ComptePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const viewId = await getViewUserId() ?? user.id
  const admin = createAdminClient()

  const [{ data: profile }, { data: biens }, { data: messages }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', viewId).single(),
    admin.from('biens').select('*, photos(url, principale)').eq('user_id', viewId).order('created_at', { ascending: false }).limit(5),
    admin.from('contacts').select('*', { count: 'exact' }).eq('vendeur_id', viewId).eq('lu', false),
  ])

  const totalVues = biens?.reduce((s, b) => s + (b.vues ?? 0), 0) ?? 0
  const totalContacts = biens?.reduce((s, b) => s + (b.contacts ?? 0), 0) ?? 0
  const biensPublies = biens?.filter(b => b.statut === 'publie').length ?? 0
  const messagesNonLus = messages?.length ?? 0

  const STATUT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
    brouillon:  { label: 'Brouillon',   bg: '#f5f5f5',  color: '#888' },
    en_attente: { label: 'En attente',  bg: '#fef9c3',  color: '#854d0e' },
    publie:     { label: 'Publié',      bg: '#dcfce7',  color: '#166534' },
    archive:    { label: 'Archivé',     bg: '#f5f5f5',  color: '#888' },
    refuse:     { label: 'Refusé',      bg: '#fee2e2',  color: '#991b1b' },
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-serif text-3xl text-navy mb-1">Bonjour, {profile?.prenom} 👋</h1>
      <p className="text-sm text-navy/50 mb-8">Voici un aperçu de votre activité</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Annonces publiées', value: biensPublies,     icon: '🏠', color: '#4F46E5', href: '/compte/mes-annonces' },
          { label: 'Vues totales',      value: totalVues,        icon: '👁',  color: '#2980b9', href: '/compte/mes-annonces' },
          { label: 'Contacts reçus',    value: totalContacts,    icon: '✉',  color: '#27ae60', href: '/compte/messages' },
          { label: 'Non lus',           value: messagesNonLus,   icon: '🔔', color: messagesNonLus > 0 ? '#e74c3c' : '#888', href: '/compte/messages' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}
            className="bg-white rounded-2xl p-5 border border-navy/08 hover:border-primary/30 hover:-translate-y-0.5 transition-all block">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="font-serif text-3xl" style={{ color: stat.color }}>{stat.value}</span>
            </div>
            <div className="text-xs text-navy/50 font-medium">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Dernières annonces */}
      <div className="bg-white rounded-2xl border border-navy/08 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/08">
          <h2 className="font-medium text-navy">Dernières annonces</h2>
          <Link href="/compte/mes-annonces" className="text-xs text-primary hover:underline">Voir tout →</Link>
        </div>
        {!biens?.length ? (
          <div className="py-10 text-center text-sm text-navy/40">
            Aucune annonce pour l'instant
          </div>
        ) : (
          biens.map((bien: any) => {
            const photo = bien.photos?.find((p: any) => p.principale)?.url ?? bien.photos?.[0]?.url
            const statut = STATUT_STYLE[bien.statut] ?? STATUT_STYLE.brouillon
            return (
              <div key={bien.id} className="flex items-center gap-4 px-6 py-3.5 border-b border-navy/06 last:border-b-0 hover:bg-navy/02 transition-colors">
                <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] overflow-hidden flex-shrink-0">
                  {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy truncate">{bien.titre}</div>
                  <div className="text-xs text-navy/45 mt-0.5">{bien.ville} · {bien.type === 'location' ? `${bien.prix.toLocaleString('fr-FR')} €/mois` : `${bien.prix.toLocaleString('fr-FR')} €`}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: statut.bg, color: statut.color }}>
                  {statut.label}
                </span>
                <div className="flex gap-3 text-[11px] text-navy/40 flex-shrink-0">
                  <span>👁 {bien.vues}</span>
                  <span>✉ {bien.contacts}</span>
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

      {/* Action rapide */}
      <Link href="/publier"
        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
        + Publier un nouveau bien
      </Link>
    </div>
  )
}
