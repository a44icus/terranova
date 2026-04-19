import { createAdminClient } from '@/lib/supabase/admin'
import ModerationActions from '@/components/admin/ModerationActions'

const CATEGORIE_LABEL: Record<string, string> = {
  appartement: 'Appartement',
  maison:      'Maison',
  bureau:      'Bureau',
  terrain:     'Terrain',
  parking:     'Parking',
  local:       'Local',
}

const TYPE_LABEL: Record<string, string> = {
  vente:    'Vente',
  location: 'Location',
}

function formatPrix(prix: number, type: string) {
  return type === 'location'
    ? `${prix.toLocaleString('fr-FR')} €/mois`
    : `${prix.toLocaleString('fr-FR')} €`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminAnnoncesPage() {
  const supabase = createAdminClient()

  const { data: biens, error } = await supabase
    .from('biens')
    .select('*, profiles!biens_user_id_fkey(prenom, nom, type), photos(url, principale)')
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false })

  if (error) console.error('[Admin] Erreur requête biens:', error.message)

  const annonces = biens ?? []

  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Modération des annonces</h1>
        <p className="text-sm text-[#0F172A]/50">
          {annonces.length === 0
            ? 'Aucune annonce en attente de validation'
            : `${annonces.length} annonce${annonces.length > 1 ? 's' : ''} en attente de validation`}
        </p>
      </div>

      {/* Liste */}
      {annonces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-16 text-center">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-[#0F172A]/40 text-sm">Toutes les annonces ont été traitées</p>
        </div>
      ) : (
        <div className="space-y-4">
          {annonces.map((bien: any) => {
            const profile = Array.isArray(bien.profiles) ? bien.profiles[0] : bien.profiles
            const photos: any[] = bien.photos ?? []
            const photo = photos.find((p: any) => p.principale)?.url ?? photos[0]?.url

            return (
              <div
                key={bien.id}
                className="bg-white rounded-2xl border border-[#0F172A]/08 p-5 flex gap-4 hover:border-[#0F172A]/16 transition-colors"
              >
                {/* Photo */}
                <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#e0ddd8] to-[#c8c4bc]">
                  {photo && (
                    <img
                      src={photo}
                      alt={bien.titre}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h2 className="text-sm font-semibold text-[#0F172A] truncate flex-1">
                      {bien.titre}
                    </h2>
                    {/* Badge statut */}
                    <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      En attente
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#0F172A]/50 mb-2">
                    <span className="font-medium text-[#0F172A]/80">{formatPrix(bien.prix, bien.type)}</span>
                    <span>·</span>
                    <span>{bien.ville} ({bien.code_postal})</span>
                    <span>·</span>
                    <span>{TYPE_LABEL[bien.type] ?? bien.type} — {CATEGORIE_LABEL[bien.categorie] ?? bien.categorie}</span>
                    {bien.surface && (
                      <>
                        <span>·</span>
                        <span>{bien.surface} m²</span>
                      </>
                    )}
                  </div>

                  {/* Vendeur */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-[#4F46E5]/15 flex items-center justify-center text-[#4F46E5] font-semibold text-[9px] flex-shrink-0">
                      {profile?.prenom?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-[#0F172A]/60">
                      {profile ? `${profile.prenom} ${profile.nom}` : 'Inconnu'}
                    </span>
                    {profile?.type === 'pro' && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#4F46E5]/10 text-[#4F46E5] uppercase tracking-wider">
                        Pro
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 text-[11px] text-[#0F172A]/35">
                    Soumis le {formatDate(bien.created_at)}
                    {bien.ref_agence && <span className="ml-2">· Réf. {bien.ref_agence}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 justify-center flex-shrink-0">
                  <a
                    href={`/annonce/${bien.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0F172A]/40 hover:text-[#0F172A] underline underline-offset-2 text-center"
                  >
                    Voir l'annonce
                  </a>
                  <ModerationActions bienId={bien.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
