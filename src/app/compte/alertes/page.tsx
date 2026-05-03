import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAlertes } from '@/app/api/alertes/actions'
import CreateAlerteForm from '@/components/alertes/CreateAlerteForm'
import DeleteAlerteButton from '@/components/alertes/DeleteAlerteButton'
import PageHeader from '@/components/compte/ui/PageHeader'
import EmptyState from '@/components/compte/ui/EmptyState'

function formatAlerte(a: any): string {
  const parts = []
  if (a.type) parts.push(a.type === 'vente' ? 'Vente' : 'Location')
  if (a.categorie) parts.push(a.categorie)
  if (a.ville) parts.push(a.ville)
  if (a.prix_max) parts.push(`max ${a.prix_max.toLocaleString('fr-FR')} €`)
  if (a.surface_min) parts.push(`min ${a.surface_min} m²`)
  return parts.length ? parts.join(' · ') : 'Tous les biens'
}

export default async function AlertesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/compte/alertes')

  const alertes = await getAlertes()

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <PageHeader
        title="Mes alertes"
        description="Recevez un email dès qu'un nouveau bien correspond à vos critères"
      />

      {/* Créer une alerte */}
      <div className="bg-white rounded-2xl border border-navy/08 p-6 mb-6">
        <h2 className="font-medium text-navy mb-4">Nouvelle alerte</h2>
        <CreateAlerteForm userEmail={user.email ?? ''} />
      </div>

      {/* Liste des alertes */}
      {alertes.length === 0 ? (
        <EmptyState icon="🔔" title="Aucune alerte créée" />
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte: any) => (
            <div key={alerte.id} className="bg-white rounded-xl border border-navy/08 p-4 flex items-center gap-4">
              <div className="text-2xl">🔔</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">{formatAlerte(alerte)}</p>
                <p className="text-xs text-navy/40 mt-0.5">
                  Vers {alerte.email}
                  {alerte.derniere_notif_at && ` · Dernière notif : ${new Date(alerte.derniere_notif_at).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
              <DeleteAlerteButton alerteId={alerte.id} />
            </div>
          ))}
        </div>
      )}

      {/* SQL migration note — dev only */}
      {process.env.NODE_ENV !== 'production' && (
        <details className="mt-8">
          <summary className="text-xs text-navy/30 cursor-pointer hover:text-navy/50">SQL requis (si table manquante)</summary>
          <pre className="mt-2 text-[10px] bg-navy/04 rounded-xl p-4 text-navy/60 font-mono overflow-x-auto">{`CREATE TABLE alertes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  type text, categorie text, ville text,
  prix_max integer, surface_min integer,
  active boolean DEFAULT true,
  derniere_notif_at timestamptz,
  created_at timestamptz DEFAULT now()
);`}</pre>
        </details>
      )}
    </div>
  )
}
