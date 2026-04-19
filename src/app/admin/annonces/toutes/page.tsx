import { createAdminClient } from "@/lib/supabase/admin"
import ModerationActions from '@/components/admin/ModerationActions'
import FeaturedToggles from '@/components/admin/FeaturedToggles'

const STATUT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  brouillon:  { label: 'Brouillon',   bg: '#f5f5f5',  color: '#888' },
  en_attente: { label: 'En attente',  bg: '#fef9c3',  color: '#854d0e' },
  publie:     { label: 'Publié',      bg: '#dcfce7',  color: '#166534' },
  archive:    { label: 'Archivé',     bg: '#f5f5f5',  color: '#888' },
  refuse:     { label: 'Refusé',      bg: '#fee2e2',  color: '#991b1b' },
}

function formatPrix(prix: number, type: string) {
  return type === 'location'
    ? `${prix.toLocaleString('fr-FR')} €/mois`
    : `${prix.toLocaleString('fr-FR')} €`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function AdminToutesAnnoncesPage() {
  const supabase = createAdminClient()

  const { data: biens, error } = await supabase
    .from('biens')
    .select('*, profiles!biens_user_id_fkey(prenom, nom, type), photos(url, principale)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('[Admin] Erreur requête biens:', error.message)

  const annonces = biens ?? []
  const enAttente = annonces.filter((b: any) => b.statut === 'en_attente').length

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Toutes les annonces</h1>
        <p className="text-sm text-[#0F172A]/50">
          {annonces.length} annonce{annonces.length > 1 ? 's' : ''} au total
          {enAttente > 0 && (
            <span className="ml-2 text-amber-700 font-medium">· {enAttente} en attente</span>
          )}
        </p>
      </div>

      {annonces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-16 text-center">
          <p className="text-[#0F172A]/40 text-sm">Aucune annonce</p>
        </div>
      ) : (
        <div className="space-y-3">
          {annonces.map((bien: any) => {
            const profile = Array.isArray(bien.profiles) ? bien.profiles[0] : bien.profiles
            const photos: any[] = bien.photos ?? []
            const photo = photos.find((p: any) => p.principale)?.url ?? photos[0]?.url
            const statut = STATUT_STYLE[bien.statut] ?? STATUT_STYLE.brouillon

            return (
              <div
                key={bien.id}
                className="bg-white rounded-2xl border border-[#0F172A]/08 p-4 flex gap-4 hover:border-[#0F172A]/16 transition-colors"
              >
                {/* Photo */}
                <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc]">
                  {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[#0F172A] truncate flex-1">{bien.titre}</span>
                    <span
                      className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: statut.bg, color: statut.color }}
                    >
                      {statut.label}
                    </span>
                  </div>
                  <div className="text-xs text-[#0F172A]/50 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="font-medium text-[#0F172A]/70">{formatPrix(bien.prix, bien.type)}</span>
                    <span>· {bien.ville}</span>
                    <span>· {profile ? `${profile.prenom} ${profile.nom}` : '—'}</span>
                    <span>· {formatDate(bien.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <FeaturedToggles
                    bienId={bien.id}
                    coupDeCoeur={bien.coup_de_coeur ?? false}
                    featured={bien.featured ?? false}
                  />
                  <a
                    href={`/annonce/${bien.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0F172A]/40 hover:text-[#0F172A] underline underline-offset-2"
                  >
                    Voir
                  </a>
                  {bien.statut === 'en_attente' && (
                    <ModerationActions bienId={bien.id} compact />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
