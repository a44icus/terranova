import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminEmailForm from '@/components/compte/AdminEmailForm'

export default async function AdminEmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/compte')

  const { data: config } = await supabase
    .from('email_config')
    .select('api_key, from_email, from_name, enabled')
    .eq('id', 1)
    .single()

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Administration</p>
        <h1 className="font-serif text-3xl text-navy mb-1">Configuration email</h1>
        <p className="text-sm text-navy/50">
          Paramétrez l'envoi des alertes prix et notifications aux utilisateurs.
        </p>
      </div>

      <AdminEmailForm
        initial={{
          api_key:    config?.api_key ?? null,
          from_email: config?.from_email ?? 'no-reply@terranova.fr',
          from_name:  config?.from_name ?? 'Terranova',
          enabled:    config?.enabled ?? false,
        }}
      />

      <details className="mt-8">
        <summary className="text-xs text-navy/30 cursor-pointer hover:text-navy/50">SQL requis (si tables manquantes)</summary>
        <pre className="mt-2 text-[10px] bg-navy/04 rounded-xl p-4 text-navy/60 font-mono overflow-x-auto whitespace-pre-wrap">{`-- Fichier complet : supabase/prix-alerts.sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS email_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  api_key text, from_email text NOT NULL DEFAULT 'no-reply@terranova.fr',
  from_name text NOT NULL DEFAULT 'Terranova',
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO email_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS prix_alerts_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bien_id uuid REFERENCES biens(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  ancien_prix numeric NOT NULL, nouveau_prix numeric NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(), sent_at timestamptz
);

-- Trigger : voir supabase/prix-alerts.sql`}</pre>
      </details>
    </div>
  )
}
