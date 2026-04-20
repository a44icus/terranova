import { getSiteSettings } from '@/lib/siteSettings'
import SettingsForm from './SettingsForm'

export default async function AdminReglagesPage() {
  const settings = await getSiteSettings()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Réglages du site</h1>
        <p className="text-sm text-[#0F172A]/50">
          Configurez tous les paramètres de la plateforme
        </p>
      </div>

      {/* SQL à créer si la table n'existe pas encore */}
      <details className="mb-6 bg-[#0F172A]/03 border border-[#0F172A]/08 rounded-2xl overflow-hidden">
        <summary className="cursor-pointer px-5 py-3.5 text-xs font-semibold text-[#0F172A]/50 hover:text-[#0F172A] select-none flex items-center gap-2">
          <span>🛠</span> SQL — Créer la table site_settings (à exécuter une seule fois dans Supabase)
        </summary>
        <div className="px-5 pb-5 pt-2">
          <pre className="text-[11px] bg-[#0F172A] text-emerald-400 rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">{`-- Table de réglages globaux (1 seule ligne)
CREATE TABLE IF NOT EXISTS site_settings (
  id           int  PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings     jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz DEFAULT now()
);

-- Ligne initiale
INSERT INTO site_settings (id, settings)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

-- RLS : lecture publique, écriture service_role uniquement
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);`}</pre>
        </div>
      </details>

      <SettingsForm settings={settings} />
    </div>
  )
}
