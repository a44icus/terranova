import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAlertes } from '@/app/api/alertes/actions'
import CreateAlerteForm from '@/components/alertes/CreateAlerteForm'
import DeleteAlerteButton from '@/components/alertes/DeleteAlerteButton'

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
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Mes alertes</h1>
        <p className="text-sm text-[#0F172A]/50">
          Recevez un email dès qu&apos;un nouveau bien correspond à vos critères
        </p>
      </div>

      {/* Créer une alerte */}
      <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 mb-6">
        <h2 className="font-medium text-[#0F172A] mb-4">Nouvelle alerte</h2>
        <CreateAlerteForm userEmail={user.email ?? ''} />
      </div>

      {/* Liste des alertes */}
      {alertes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-10 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-[#0F172A]/40 text-sm">Aucune alerte créée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte: any) => (
            <div key={alerte.id} className="bg-white rounded-xl border border-[#0F172A]/08 p-4 flex items-center gap-4">
              <div className="text-2xl">🔔</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A]">{formatAlerte(alerte)}</p>
                <p className="text-xs text-[#0F172A]/40 mt-0.5">
                  Vers {alerte.email}
                  {alerte.derniere_notif_at && ` · Dernière notif : ${new Date(alerte.derniere_notif_at).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
              <DeleteAlerteButton alerteId={alerte.id} />
            </div>
          ))}
        </div>
      )}

      {/* SQL migration note */}
      <details className="mt-8">
        <summary className="text-xs text-[#0F172A]/30 cursor-pointer hover:text-[#0F172A]/50">SQL requis (si table manquante)</summary>
        <pre className="mt-2 text-[10px] bg-[#0F172A]/04 rounded-xl p-4 text-[#0F172A]/60 font-mono overflow-x-auto">{`CREATE TABLE alertes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  type text,
  categorie text,
  ville text,
  prix_max integer,
  surface_min integer,
  active boolean DEFAULT true,
  derniere_notif_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertes_user" ON alertes USING (user_id = auth.uid());`}</pre>
      </details>
    </div>
  )
}
