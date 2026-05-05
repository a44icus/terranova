import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanConfig, ALL_FEATURES, FEATURE_GROUPS, DEFAULT_PLAN_CONFIG } from '@/lib/plan'
import { updatePlanConfig, updateCategoriesActives } from './actions'
import BackfillScoresButton from '@/components/admin/BackfillScoresButton'
import { getSiteSettings } from '@/lib/siteSettings'

export const dynamic = 'force-dynamic'

const ALL_CATS = [
  { group: 'Résidentiel', items: [
    { key: 'appartement',           label: 'Appartement',           icon: '🏢' },
    { key: 'maison',                label: 'Maison',                icon: '🏠' },
    { key: 'studio',                label: 'Studio / T1',           icon: '🛏️' },
    { key: 'villa',                 label: 'Villa',                 icon: '🏡' },
    { key: 'chalet',                label: 'Chalet',                icon: '🏔️' },
    { key: 'loft',                  label: 'Loft / Atelier',        icon: '🏭' },
    { key: 'colocation',            label: 'Colocation',            icon: '👥' },
  ]},
  { group: 'Commercial / Pro', items: [
    { key: 'bureau',                label: 'Bureau',                icon: '🏗️' },
    { key: 'local',                 label: 'Local commercial',      icon: '🏪' },
    { key: 'restaurant',            label: 'Restaurant',            icon: '🍽️' },
    { key: 'entrepot',              label: 'Entrepôt',              icon: '🏭' },
    { key: 'hotel',                 label: 'Hôtel',                 icon: '🏨' },
    { key: 'fonds_commerce',        label: 'Fonds de commerce',     icon: '💼' },
    { key: 'murs_commerciaux',      label: 'Murs commerciaux',      icon: '🏬' },
  ]},
  { group: 'Foncier', items: [
    { key: 'terrain',               label: 'Terrain',               icon: '🌱' },
    { key: 'terrain_agricole',      label: 'Terrain agricole',      icon: '🌾' },
    { key: 'terrain_constructible', label: 'Terrain constructible', icon: '🏗️' },
  ]},
  { group: 'Autre', items: [
    { key: 'parking',               label: 'Parking',               icon: '🅿️' },
  ]},
]

// Vérifier si plan_config existe
async function checkTableExists() {
  const supabase = createAdminClient()
  const { error } = await supabase.from('plan_config').select('plan').limit(1)
  return !error
}

// ── Tiers = regroupement logique des plans ────────────────────────────────────
const TIERS = [
  {
    key: 'gratuit' as const,
    label: 'Gratuit',
    icon: '🆓',
    color: '#64748b',
    colorLight: '#f1f5f9',
    hasBilling: false,
  },
  {
    key: 'pro' as const,
    label: 'Pro',
    icon: '⚡',
    color: '#4F46E5',
    colorLight: '#eef2ff',
    hasBilling: true,
  },
  {
    key: 'agence' as const,
    label: 'Agence',
    icon: '🏆',
    color: '#0891b2',
    colorLight: '#ecfeff',
    hasBilling: true,
  },
]

export default async function AdminParametresPage() {
  const [planConfig, siteSettings, tableExists] = await Promise.all([
    getPlanConfig(),
    getSiteSettings(),
    checkTableExists(),
  ])

  // Config de chaque tier : on lit le plan _mensuel (ou gratuit) comme source des champs partagés
  const tierCfg = {
    gratuit: planConfig.gratuit,
    pro:     planConfig.pro_mensuel,
    agence:  planConfig.agence_mensuel,
  }

  const activeCats = new Set<string>(siteSettings.categories_actives)

  return (
    <div className="p-6 md:p-8 max-w-6xl space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-navy mb-1">Paramètres</h1>
        <p className="text-sm text-navy/50">Configurez les formules tarifaires, fonctionnalités et catégories</p>
      </div>

      {/* ── Alerte table manquante ── */}
      {!tableExists && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠ Table plan_config manquante</p>
          <p className="text-xs text-amber-700 mb-3">
            Exécutez ce SQL dans Supabase pour activer la configuration :
          </p>
          <pre className="text-[11px] bg-amber-100 rounded-lg p-3 overflow-x-auto text-amber-900 font-mono whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS plan_config (
  plan             text PRIMARY KEY,
  annonces         integer NOT NULL DEFAULT 1,
  photos           integer NOT NULL DEFAULT 10,
  duree_jours      integer NOT NULL DEFAULT 30,
  prix             integer NOT NULL DEFAULT 0,
  stripe_price_id  text,
  updated_at       timestamptz DEFAULT now()
);
INSERT INTO plan_config (plan, annonces, photos, duree_jours, prix) VALUES
  ('gratuit',        1,   10,  90,   0),
  ('pro_mensuel',    10,  20,  30,  29),
  ('pro_annuel',     10,  20, 365, 249),
  ('agence_mensuel', 999, 30,  30,  79),
  ('agence_annuel',  999, 30, 365, 699)
ON CONFLICT (plan) DO NOTHING;
ALTER TABLE plan_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plan_config" ON plan_config FOR SELECT USING (true);`}
          </pre>
        </div>
      )}

      {/* ── Stripe env vars ── */}
      <div className="bg-white rounded-2xl border border-navy/08 p-6">
        <h2 className="font-medium text-navy mb-3 flex items-center gap-2">🔑 Variables Stripe</h2>
        <pre className="text-[11px] bg-navy/03 rounded-xl p-4 text-navy/60 font-mono overflow-x-auto">
{`STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=https://votre-domaine.fr`}
        </pre>
        <p className="text-xs text-navy/40 mt-3">
          Webhook : <code className="bg-navy/05 px-1 rounded">POST /api/stripe/webhook</code> —
          événements : <code className="bg-navy/05 px-1 rounded">checkout.session.completed</code>,{' '}
          <code className="bg-navy/05 px-1 rounded">invoice.payment_succeeded</code>,{' '}
          <code className="bg-navy/05 px-1 rounded">customer.subscription.deleted</code>
        </p>
      </div>

      {/* ══ PLANS ══ */}
      <section>
        <h2 className="font-serif text-xl text-navy mb-1">Formules tarifaires</h2>
        <p className="text-sm text-navy/50 mb-5">
          Les fonctionnalités et limites sont partagées entre mensuel et annuel d'un même plan.
          Seuls les prix et les Price ID Stripe diffèrent.
        </p>
        <form action={updatePlanConfig}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {TIERS.map((tier) => {
              const c = tierCfg[tier.key]
              const featureSet = new Set<string>(c.features)

              return (
                <div key={tier.key}
                  className="bg-white rounded-2xl border border-navy/08 overflow-hidden flex flex-col"
                  style={{ borderTopColor: tier.color, borderTopWidth: 3 }}>

                  {/* En-tête */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-navy/06"
                    style={{ background: tier.colorLight }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tier.icon}</span>
                      <span className="font-semibold text-navy">{tier.label}</span>
                    </div>
                    {/* Toggle actif — hidden input pour gérer la case décochée */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-navy/50">Actif</span>
                      <input type="hidden" name={`${tier.key}_actif`} value="off" />
                      <input type="checkbox" name={`${tier.key}_actif`} value="on"
                        defaultChecked={c.actif !== false}
                        className="accent-primary w-4 h-4" />
                    </label>
                  </div>

                  <div className="p-5 space-y-5 flex-1">

                    {/* Identité */}
                    <div>
                      <p className="text-[10px] font-semibold text-navy/35 uppercase tracking-wider mb-3">Identité</p>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-navy/50 mb-1">Nom affiché</label>
                          <input type="text" name={`${tier.key}_label`}
                            defaultValue={c.label ?? ''}
                            placeholder={tier.label}
                            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-xs text-navy/50 mb-1">Description</label>
                          <input type="text" name={`${tier.key}_description`}
                            defaultValue={c.description ?? ''}
                            placeholder="Courte description…"
                            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Limites */}
                    <div>
                      <p className="text-[10px] font-semibold text-navy/35 uppercase tracking-wider mb-3">Limites</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-navy/50 mb-1">Annonces max</label>
                          <input type="number" name={`${tier.key}_annonces`}
                            defaultValue={c.annonces} min="0" max="99999"
                            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                          <p className="text-[10px] text-navy/30 mt-0.5">999 = illimité</p>
                        </div>
                        <div>
                          <label className="block text-xs text-navy/50 mb-1">Photos / annonce</label>
                          <input type="number" name={`${tier.key}_photos`}
                            defaultValue={c.photos} min="1" max="100"
                            className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        {tier.key === 'gratuit' && (
                          <div className="col-span-2">
                            <label className="block text-xs text-navy/50 mb-1">Visibilité (jours)</label>
                            <input type="number" name="gratuit_duree_jours"
                              defaultValue={c.duree_jours} min="1" max="365"
                              className="w-full border border-navy/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tarification */}
                    <div>
                      <p className="text-[10px] font-semibold text-navy/35 uppercase tracking-wider mb-3">
                        {tier.hasBilling ? 'Tarification' : 'Prix'}
                      </p>

                      {!tier.hasBilling ? (
                        <p className="text-sm text-navy/40 italic">Gratuit — aucun paiement requis</p>
                      ) : (
                        <div className="space-y-3">
                          {/* Mensuel */}
                          <div className="bg-navy/02 rounded-xl p-3 border border-navy/08">
                            <p className="text-[10px] font-semibold text-navy/40 uppercase tracking-wider mb-2">Mensuel</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-navy/50 mb-1">Prix (€/mois)</label>
                                <input type="number" name={`${tier.key}_mensuel_prix`}
                                  defaultValue={planConfig[`${tier.key}_mensuel` as 'pro_mensuel' | 'agence_mensuel'].prix}
                                  min="0" max="9999"
                                  className="w-full border border-navy/15 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary" />
                              </div>
                              <div>
                                <label className="block text-xs text-navy/50 mb-1">Price ID Stripe</label>
                                <input type="text" name={`${tier.key}_mensuel_stripe_price_id`}
                                  defaultValue={planConfig[`${tier.key}_mensuel` as 'pro_mensuel' | 'agence_mensuel'].stripe_price_id ?? ''}
                                  placeholder="price_..."
                                  className="w-full border border-navy/15 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
                              </div>
                            </div>
                            {!planConfig[`${tier.key}_mensuel` as 'pro_mensuel' | 'agence_mensuel'].stripe_price_id && (
                              <p className="text-[10px] text-amber-500 mt-1.5">⚠ Price ID manquant</p>
                            )}
                          </div>

                          {/* Annuel */}
                          <div className="bg-navy/02 rounded-xl p-3 border border-navy/08">
                            <p className="text-[10px] font-semibold text-navy/40 uppercase tracking-wider mb-2">Annuel</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-navy/50 mb-1">Prix (€/an)</label>
                                <input type="number" name={`${tier.key}_annuel_prix`}
                                  defaultValue={planConfig[`${tier.key}_annuel` as 'pro_annuel' | 'agence_annuel'].prix}
                                  min="0" max="99999"
                                  className="w-full border border-navy/15 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary" />
                              </div>
                              <div>
                                <label className="block text-xs text-navy/50 mb-1">Price ID Stripe</label>
                                <input type="text" name={`${tier.key}_annuel_stripe_price_id`}
                                  defaultValue={planConfig[`${tier.key}_annuel` as 'pro_annuel' | 'agence_annuel'].stripe_price_id ?? ''}
                                  placeholder="price_..."
                                  className="w-full border border-navy/15 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-primary" />
                              </div>
                            </div>
                            {!planConfig[`${tier.key}_annuel` as 'pro_annuel' | 'agence_annuel'].stripe_price_id && (
                              <p className="text-[10px] text-amber-500 mt-1.5">⚠ Price ID manquant</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fonctionnalités */}
                    <div>
                      <p className="text-[10px] font-semibold text-navy/35 uppercase tracking-wider mb-3">Fonctionnalités incluses</p>
                      <div className="space-y-3">
                        {FEATURE_GROUPS.map(group => (
                          <div key={group}>
                            <p className="text-[10px] font-medium text-navy/40 mb-1.5">{group}</p>
                            <div className="space-y-1">
                              {ALL_FEATURES.filter(f => f.group === group).map(feat => (
                                <label key={feat.key}
                                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all text-left ${
                                    featureSet.has(feat.key)
                                      ? 'border-primary/30 bg-primary/04'
                                      : 'border-navy/08 hover:border-navy/15'
                                  }`}>
                                  <input type="hidden"    name={`${tier.key}_feature_${feat.key}`} value="off" />
                                  <input type="checkbox" name={`${tier.key}_feature_${feat.key}`} value="on"
                                    defaultChecked={featureSet.has(feat.key)}
                                    className="accent-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-navy/80 leading-tight">{feat.label}</p>
                                    <p className="text-[10px] text-navy/40 leading-tight mt-0.5">{feat.hint}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button type="submit" disabled={!tableExists}
              className="bg-navy text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-primary transition-colors disabled:opacity-40">
              Enregistrer les plans
            </button>
            {!tableExists && (
              <p className="text-xs text-navy/40">Créez d'abord la table plan_config</p>
            )}
          </div>
        </form>
      </section>

      {/* ══ CATÉGORIES ══ */}
      <section>
        <h2 className="font-serif text-xl text-navy mb-1">Catégories de biens</h2>
        <p className="text-sm text-navy/50 mb-4">
          Les catégories désactivées n'apparaissent plus dans le formulaire de publication ni dans les filtres.
        </p>
        <form action={updateCategoriesActives}>
          <div className="bg-white rounded-2xl border border-navy/08 p-6 space-y-5">
            {ALL_CATS.map(({ group, items }) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-navy/35 uppercase tracking-wider mb-2">{group}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {items.map(cat => {
                    const isActive = activeCats.has(cat.key)
                    return (
                      <label key={cat.key}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isActive
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-navy/08 bg-navy/02 opacity-60 hover:opacity-80'
                        }`}>
                        <input type="hidden"    name={`cat_${cat.key}`} value="off" />
                        <input type="checkbox" name={`cat_${cat.key}`} value="on"
                          defaultChecked={isActive}
                          className="accent-emerald-600 flex-shrink-0" />
                        <span className="text-base leading-none">{cat.icon}</span>
                        <span className="text-xs font-medium text-navy/70">{cat.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button type="submit"
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
              Enregistrer les catégories
            </button>
          </div>
        </form>
      </section>

      {/* ══ OUTILS ══ */}
      <section className="border-t border-navy/08 pt-8">
        <h2 className="font-serif text-xl text-navy mb-4">Outils de maintenance</h2>
        <div className="bg-white border border-navy/08 rounded-2xl p-5">
          <p className="text-sm font-medium text-navy mb-1">Score de quartier</p>
          <p className="text-xs text-navy/50 mb-4">
            Calcule et enregistre le score OSM pour tous les biens publiés sans score.
          </p>
          <BackfillScoresButton />
        </div>
      </section>
    </div>
  )
}
