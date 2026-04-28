import { createAdminClient } from '@/lib/supabase/admin'
import ReseauxClient from './ReseauxClient'

export default async function AdminReseauxPage() {
  const admin = createAdminClient()

  const { data: reseaux } = await admin
    .from('reseaux')
    .select('*, profiles(count)')
    .order('nom')

  const reseauxWithCount = (reseaux ?? []).map(r => ({
    ...r,
    _count: Array.isArray(r.profiles) ? (r.profiles[0]?.count ?? 0) : 0,
    profiles: undefined,
  }))

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Réseaux & Enseignes</h1>
        <p className="text-sm text-[#0F172A]/50">
          Gérez les réseaux immobiliers (Century 21, iAd, Orpi…). Les agents pro peuvent s'y affilier depuis leur profil.
        </p>
      </div>

      <details className="mb-6 bg-[#0F172A]/03 border border-[#0F172A]/08 rounded-2xl overflow-hidden">
        <summary className="cursor-pointer px-5 py-3.5 text-xs font-semibold text-[#0F172A]/50 hover:text-[#0F172A] select-none flex items-center gap-2">
          <span>🛠</span> SQL — Créer la table reseaux (à exécuter une seule fois dans Supabase)
        </summary>
        <div className="px-5 pb-5 pt-2">
          <pre className="bg-[#0F172A] text-green-400 text-[11px] rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{`-- Voir supabase/migrations/reseaux.sql
CREATE TABLE IF NOT EXISTS reseaux (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          text NOT NULL,
  slug         text NOT NULL UNIQUE,
  logo_url     text,
  description  text,
  site_web     text,
  type_reseau  text NOT NULL DEFAULT 'enseigne'
               CHECK (type_reseau IN ('franchise', 'mandataires', 'groupement', 'enseigne')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reseaux ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reseaux_public_read" ON reseaux FOR SELECT USING (true);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reseau_id uuid REFERENCES reseaux(id) ON DELETE SET NULL;`}
          </pre>
        </div>
      </details>

      <ReseauxClient reseaux={reseauxWithCount as any} />
    </div>
  )
}
