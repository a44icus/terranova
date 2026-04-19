import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_PLAN_CONFIG } from '@/lib/plan'
import type { PlanType } from '@/lib/types'
import { updatePlanConfig } from './actions'

const PLAN_META: Record<PlanType, { label: string; color: string; icon: string }> = {
  gratuit:     { label: 'Plan Gratuit',     color: '#7f8c8d', icon: '🆓' },
  pro_mensuel: { label: 'Pro Mensuel',      color: '#4F46E5', icon: '⚡' },
  pro_annuel:  { label: 'Pro Annuel',       color: '#0891b2', icon: '🏆' },
}

async function getPlanConfigFromDB() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('plan_config').select('*')
  if (error || !data) return null
  const map: Record<string, any> = {}
  for (const row of data) map[row.plan] = row
  return map
}

export default async function AdminParametresPage() {
  const dbConfig = await getPlanConfigFromDB()
  const tableExists = dbConfig !== null

  const plans: PlanType[] = ['gratuit', 'pro_mensuel', 'pro_annuel']
  const config = (plan: PlanType) =>
    dbConfig?.[plan] ?? DEFAULT_PLAN_CONFIG[plan]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-[#0F172A] mb-1">Paramètres des plans</h1>
        <p className="text-sm text-[#0F172A]/50">
          Configurez les limites, prix et intégration Stripe de chaque formule
        </p>
      </div>

      {/* Migration SQL nécessaire */}
      {!tableExists && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Table plan_config manquante</p>
          <p className="text-xs text-amber-700 mb-3">
            Exécutez ce SQL dans Supabase (SQL Editor) pour activer la configuration des plans :
          </p>
          <pre className="text-[11px] bg-amber-100 rounded-lg p-3 overflow-x-auto text-amber-900 font-mono">
{`-- Table de configuration des plans
CREATE TABLE IF NOT EXISTS plan_config (
  plan            text PRIMARY KEY,
  annonces        integer NOT NULL DEFAULT 3,
  photos          integer NOT NULL DEFAULT 5,
  duree_jours     integer NOT NULL DEFAULT 30,
  prix            integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  updated_at      timestamptz DEFAULT now()
);

-- Valeurs par défaut
INSERT INTO plan_config (plan, annonces, photos, duree_jours, prix) VALUES
  ('gratuit',     3,   5,  30,  0),
  ('pro_mensuel', 50,  20, 30,  29),
  ('pro_annuel',  999, 20, 365, 249)
ON CONFLICT (plan) DO NOTHING;

-- Colonne subscription pour les profils
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- RLS (lecture publique, écriture service-role uniquement)
ALTER TABLE plan_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plan_config"
  ON plan_config FOR SELECT USING (true);`}
          </pre>
        </div>
      )}

      {/* Variables d'environnement Stripe */}
      <div className="bg-white rounded-2xl border border-[#0F172A]/08 p-6 mb-6">
        <h2 className="font-medium text-[#0F172A] mb-3 flex items-center gap-2">
          <span>🔑</span> Variables d'environnement Stripe
        </h2>
        <p className="text-xs text-[#0F172A]/50 mb-4">
          Ajoutez ces variables dans votre fichier <code className="bg-[#0F172A]/05 px-1 rounded">.env.local</code> :
        </p>
        <pre className="text-[11px] bg-[#0F172A]/04 rounded-xl p-4 text-[#0F172A]/70 font-mono overflow-x-auto">
{`STRIPE_SECRET_KEY=sk_live_...          # Clé secrète Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Clé publique Stripe (optionnel)
STRIPE_WEBHOOK_SECRET=whsec_...        # Secret du webhook Stripe
NEXT_PUBLIC_BASE_URL=https://votre-domaine.fr`}
        </pre>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-700">
            <strong>Webhook Stripe</strong> : Configurez l'URL{' '}
            <code className="bg-blue-100 px-1 rounded">https://votre-domaine.fr/api/stripe/webhook</code>{' '}
            dans votre dashboard Stripe avec les événements :{' '}
            <code className="bg-blue-100 px-1 rounded">checkout.session.completed</code>,{' '}
            <code className="bg-blue-100 px-1 rounded">invoice.payment_succeeded</code>,{' '}
            <code className="bg-blue-100 px-1 rounded">customer.subscription.deleted</code>
          </p>
        </div>
      </div>

      {/* Formulaire de config des plans */}
      <form action={updatePlanConfig}>
        <div className="space-y-4">
          {plans.map((plan) => {
            const meta = PLAN_META[plan]
            const cfg = config(plan)

            return (
              <div key={plan} className="bg-white rounded-2xl border border-[#0F172A]/08 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">{meta.icon}</span>
                  <h3 className="font-semibold text-[#0F172A]">{meta.label}</h3>
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: meta.color }}>
                    {plan}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">
                      Annonces max
                    </label>
                    <input
                      type="number"
                      name={`${plan}_annonces`}
                      defaultValue={cfg.annonces}
                      min="0"
                      max="9999"
                      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]"
                    />
                    {plan === 'pro_annuel' && (
                      <p className="text-[10px] text-[#0F172A]/35 mt-1">999 = illimité</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">
                      Photos max
                    </label>
                    <input
                      type="number"
                      name={`${plan}_photos`}
                      defaultValue={cfg.photos}
                      min="1"
                      max="100"
                      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">
                      Durée visibilité (jours)
                    </label>
                    <input
                      type="number"
                      name={`${plan}_duree_jours`}
                      defaultValue={cfg.duree_jours}
                      min="1"
                      max="3650"
                      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">
                      Prix (€) {plan === 'pro_mensuel' ? '/mois' : plan === 'pro_annuel' ? '/an' : ''}
                    </label>
                    <input
                      type="number"
                      name={`${plan}_prix`}
                      defaultValue={cfg.prix}
                      min="0"
                      disabled={plan === 'gratuit'}
                      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5] disabled:bg-[#0F172A]/03 disabled:text-[#0F172A]/30"
                    />
                  </div>
                </div>

                {plan !== 'gratuit' && (
                  <div>
                    <label className="block text-xs font-medium text-[#0F172A]/50 mb-1.5">
                      Stripe Price ID
                      <span className="ml-2 text-[10px] font-normal text-[#0F172A]/35">
                        (ex: price_1AbCdEfGhIjKlMnO)
                      </span>
                    </label>
                    <input
                      type="text"
                      name={`${plan}_stripe_price_id`}
                      defaultValue={cfg.stripe_price_id ?? ''}
                      placeholder="price_..."
                      className="w-full border border-[#0F172A]/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4F46E5] font-mono"
                    />
                    {!cfg.stripe_price_id && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        ⚠ Price ID manquant — les utilisateurs ne pourront pas s'abonner à ce plan
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={!tableExists}
            className="bg-[#0F172A] text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#4F46E5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enregistrer les modifications
          </button>
          {!tableExists && (
            <p className="text-xs text-[#0F172A]/40">
              Créez d'abord la table plan_config avec le SQL ci-dessus
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
