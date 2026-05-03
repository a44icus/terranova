import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getViewUserId } from '@/lib/impersonation'
import PageHeader from '@/components/compte/ui/PageHeader'
import EmptyState from '@/components/compte/ui/EmptyState'

export default async function FavorisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const viewId = await getViewUserId() ?? user.id
  const admin = createAdminClient()

  const { data: favoris } = await admin
    .from('favoris')
    .select('bien_id, created_at, biens(*, photos(url, principale))')
    .eq('user_id', viewId)
    .order('created_at', { ascending: false })

  const biens = favoris?.map((f: any) => f.biens).filter(Boolean) ?? []

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <PageHeader
        title="Mes favoris"
        description={`${biens.length} bien${biens.length > 1 ? 's' : ''} sauvegardé${biens.length > 1 ? 's' : ''}`}
      />

      {!biens.length ? (
        <EmptyState
          icon="♡"
          title="Vous n'avez pas encore de favoris"
          action={
            <Link href="/" className="inline-block bg-navy text-white text-sm px-5 py-2.5 rounded-xl hover:bg-primary transition-colors">
              Explorer les annonces
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {biens.map((bien: any) => {
            const photo = (bien.photos ?? []).find((p: any) => p.principale)?.url ?? bien.photos?.[0]?.url
            const prix = bien.type === 'location'
              ? `${bien.prix?.toLocaleString('fr-FR')} €/mois`
              : bien.prix >= 1000000
                ? `${(bien.prix / 1000000).toFixed(2).replace(/\.?0+$/, '')} M€`
                : `${bien.prix?.toLocaleString('fr-FR')} €`

            return (
              <div key={bien.id} className="bg-white rounded-2xl border border-navy/08 overflow-hidden hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                <div className="h-44 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc] relative overflow-hidden">
                  {photo
                    ? <img src={photo} alt={bien.titre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
                  }
                  <span className={`absolute top-2 left-2 text-white text-[10px] font-semibold px-2 py-0.5 rounded ${bien.type === 'vente' ? 'bg-primary' : 'bg-location'}`}>
                    {bien.type === 'vente' ? 'Vente' : 'Location'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="font-serif text-lg text-navy">{prix}</div>
                  <div className="text-sm font-medium mt-0.5 truncate">{bien.titre}</div>
                  <div className="text-xs text-navy/45 mt-0.5 mb-3">📍 {bien.ville} · {bien.code_postal}</div>
                  <div className="flex gap-2 text-[10px] text-navy/50 mb-3">
                    {bien.surface && <span>{bien.surface} m²</span>}
                    {(bien.pieces ?? 0) > 0 && <span>🛏 {bien.pieces} p.</span>}
                  </div>
                  <Link href={`/annonce/${bien.id}`}
                    className="block w-full text-center bg-navy text-white text-xs font-medium py-2 rounded-lg hover:bg-primary transition-colors">
                    Voir l'annonce
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
